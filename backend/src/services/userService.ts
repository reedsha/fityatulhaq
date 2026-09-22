import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma/client";
import { createAppError } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import { normaliseOptionalText, parseBirthDate } from "../utils/profile";
import { toServiceError } from "./serviceError";
import { deleteOldAvatar, uploadAvatar } from "./storageService";
import { PUBLIC_USER_SELECT, type PublicUserProfile } from "./userProjection";

/**
 * Partial update: an absent key leaves the column untouched, a present key
 * writes it, and an empty string clears it. The controller strips anything the
 * caller is not allowed to change, so `role`, `email` and `passwordHash` can
 * never arrive here.
 */
export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  birthDate?: string;
}

export interface AvatarUploadInput {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  /** Client-supplied label, used for logging only. */
  originalName: string;
}

/**
 * P2025 is what Prisma raises when the target row is gone — a token that
 * outlived its account. Reported as a 404 so the client can react, rather than
 * the 500 the generic mapping would produce.
 */
function toProfileError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return createAppError("USER_NOT_FOUND", "User not found", 404);
  }

  return toServiceError(error, "PROFILE_UPDATE_FAILED", "Unable to update the profile");
}

/**
 * Applies a profile change and returns the updated projection.
 *
 * The update object is built field by field rather than spread from the request
 * body: mass assignment is impossible when only these three keys are ever read.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUserProfile> {
  try {
    const data: Prisma.UserUpdateInput = {};

    if (input.fullName !== undefined) {
      data.fullName = input.fullName.trim();
    }

    if (input.phone !== undefined) {
      data.phone = normaliseOptionalText(input.phone) ?? null;
    }

    if (input.birthDate !== undefined) {
      data.birthDate = parseBirthDate(input.birthDate);
    }

    if (Object.keys(data).length === 0) {
      throw createAppError("NO_UPDATE_FIELDS", "No profile fields were provided", 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: PUBLIC_USER_SELECT,
    });

    logger.info(`[PROFILE_UPDATED] ${userId} (${Object.keys(data).join(", ")})`);

    return user;
  } catch (error) {
    throw toProfileError(error);
  }
}

/**
 * Stores a new avatar and points the member's row at it.
 *
 * The old object is removed *after* the new one is safely in place and the row
 * has been repointed: doing it first would leave the member with a URL that
 * resolves to nothing if the upload then failed. Removal failures are logged
 * and ignored (see `deleteOldAvatar`) — the upload is what the caller asked for.
 *
 * Returns the new public URL.
 */
export async function replaceAvatar(
  userId: string,
  input: AvatarUploadInput,
): Promise<string> {
  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (current === null) {
      throw createAppError("USER_NOT_FOUND", "User not found", 404);
    }

    const previousAvatarUrl = current.avatarUrl;

    const publicUrl = await uploadAvatar(input.fileBuffer, input.fileName, input.mimeType);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: publicUrl },
        select: { id: true },
      });
    } catch (error) {
      // The object is orphaned in the bucket, so drop it before surfacing the
      // failure — otherwise every retry would leave another unreferenced file.
      logger.error(
        `[AVATAR_ROW_UPDATE_FAILED] ${userId}: rolling back ${input.fileName}`,
      );
      await deleteOldAvatar(publicUrl);

      throw error;
    }

    logger.info(
      `[AVATAR_REPLACED] ${userId} (${input.originalName}, ${input.mimeType}, ${input.fileBuffer.length} bytes)`,
    );

    await deleteOldAvatar(previousAvatarUrl);

    return publicUrl;
  } catch (error) {
    throw toProfileError(error);
  }
}
