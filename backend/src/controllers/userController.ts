import type { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import { z } from "zod";

import {
  createAppError,
  formatAuthResponse,
  isApplicationError,
  toHttpError,
} from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import * as userService from "../services/userService";
import {
  MAX_AVATAR_BYTES,
  generateAvatarFilename,
  sanitizeFileName,
  validateImageFile,
} from "../utils/imageValidator";
import { parseBody } from "../utils/validation";

/** PATCH semantics — every field is optional. Mirrors `registerSchema`. */
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name minimum 2 characters")
      .max(100, "Full name maximum 100 characters")
      .optional(),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
  })
  .refine(
    (value: { fullName?: string; phone?: string; birthDate?: string }): boolean =>
      value.fullName !== undefined || value.phone !== undefined || value.birthDate !== undefined,
    { message: "Provide at least one profile field to update" },
  );

/** The single multipart field the avatar endpoint reads. */
export const AVATAR_FIELD_NAME = "avatar";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const MAX_AVATAR_MEGABYTES = Math.round(MAX_AVATAR_BYTES / (1024 * 1024));

function extensionOf(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex === -1 ? "" : fileName.slice(dotIndex).toLowerCase();
}

/**
 * The caller's own id, cross-checked against the id in the URL.
 *
 * Identity comes from the verified token and never from the request: a member
 * can only ever act on their own row, and a mismatch is a 403 rather than a
 * silent redirect to their own profile, so a client bug cannot go unnoticed.
 */
function requireSelf(req: Request): string {
  const authenticatedId = req.user?.id;

  if (authenticatedId === undefined || authenticatedId.length === 0) {
    throw createAppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const requestedId = req.params["userId"] ?? "";

  if (requestedId.length === 0) {
    throw createAppError("VALIDATION_ERROR", "userId is required", 400);
  }

  if (requestedId !== authenticatedId) {
    logger.warn(`[FORBIDDEN] ${authenticatedId} attempted to act on user ${requestedId}`);
    throw createAppError("FORBIDDEN", "You may only manage your own profile", 403);
  }

  return authenticatedId;
}

/**
 * Maps anything multer can raise onto the API's error contract. Its own errors
 * are plain `Error`s, so without this an oversized upload would surface as a 500
 * instead of the 413 the client can act on.
 */
function toUploadError(error: unknown): Error {
  if (isApplicationError(error)) {
    return error;
  }

  // Checked structurally: multer's error class is not reliably exported through
  // its type definitions, but `name` and `code` are part of its contract.
  if (error instanceof Error && error.name === "MulterError") {
    const code = (error as { code?: unknown }).code;

    if (code === "LIMIT_FILE_SIZE") {
      return createAppError(
        "AVATAR_TOO_LARGE",
        `Avatar must be ${MAX_AVATAR_MEGABYTES} MB or smaller`,
        413,
      );
    }

    logger.warn(`[INVALID_UPLOAD] ${error.message}`);
    return createAppError("INVALID_UPLOAD", "The avatar upload was rejected", 400);
  }

  return toHttpError(error, {
    code: "AVATAR_UPLOAD_FAILED",
    message: "Unable to update the avatar",
  });
}

const avatarUpload = multer({
  // Buffered in memory rather than written to disk: the image is validated and
  // then streamed to Supabase Storage, so it never needs to survive the request.
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback): void => {
    // A cheap first gate that rejects the obvious cases before any bytes are
    // buffered. The extension is client-supplied, so it decides nothing on its
    // own — `validateImageFile` is what authoritatively checks the magic number.
    if (ALLOWED_EXTENSIONS.has(extensionOf(file.originalname))) {
      callback(null, true);
      return;
    }

    // Passing an error alone rejects the file: the single-argument overload is
    // the rejection form, the two-argument one is the accept/reject flag form.
    callback(
      createAppError(
        "UNSUPPORTED_FILE_TYPE",
        "Upload a JPEG, PNG, GIF or WebP image",
        400,
      ),
    );
  },
});

/** Multipart parser for the avatar endpoint, exported for the router to mount. */
export const uploadAvatarMiddleware: RequestHandler = (req, res, next): void => {
  avatarUpload.single(AVATAR_FIELD_NAME)(req, res, (error: unknown): void => {
    if (error === undefined || error === null) {
      next();
      return;
    }

    next(toUploadError(error));
  });
};

/** `PUT /users/:userId/profile` — partial update of the caller's own profile. */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireSelf(req);
    const payload = parseBody(updateProfileSchema, req.body);
    const profile = await userService.updateProfile(userId, payload);

    res.status(200).json(formatAuthResponse(profile));
  } catch (error) {
    next(
      toHttpError(error, {
        code: "PROFILE_UPDATE_FAILED",
        message: "Unable to update the profile",
      }),
    );
  }
}

/**
 * `POST /users/:userId/avatar` — replaces the caller's avatar.
 *
 * The image is validated by magic number before anything is stored, and the
 * response carries only the new URL; the envelope's own `success` flag already
 * reports the outcome, so the payload does not repeat it.
 */
export async function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireSelf(req);
    const file = req.file;

    if (file === undefined) {
      throw createAppError("AVATAR_REQUIRED", "An avatar image is required", 400);
    }

    const validation = await validateImageFile(file.buffer);

    if (!validation.isValid) {
      throw createAppError(
        "INVALID_IMAGE",
        `Upload a JPEG, PNG, GIF or WebP image between 100x100 and 2048x2048 pixels, up to ${MAX_AVATAR_MEGABYTES} MB`,
        400,
      );
    }

    const avatarUrl = await userService.replaceAvatar(userId, {
      fileBuffer: file.buffer,
      mimeType: validation.mimeType,
      fileName: generateAvatarFilename(validation.mimeType),
      originalName: sanitizeFileName(file.originalname),
    });

    res.status(200).json(formatAuthResponse({ avatarUrl }));
  } catch (error) {
    next(
      toHttpError(error, {
        code: "AVATAR_UPLOAD_FAILED",
        message: "Unable to update the avatar",
      }),
    );
  }
}
