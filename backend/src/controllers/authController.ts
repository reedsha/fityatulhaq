import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import {
  createAppError,
  formatAuthResponse,
  toHttpError,
} from "../middleware/errorFormatter";
import * as authService from "../services/authService";
import { MIN_PASSWORD_LENGTH } from "../services/authService";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username minimum 3 characters")
    .max(30, "Username maximum 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username alphanumeric only"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password minimum ${MIN_PASSWORD_LENGTH} characters`),
  fullName: z
    .string()
    .min(2, "Full name minimum 2 characters")
    .max(100, "Full name maximum 100 characters"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username required"),
  password: z.string().min(1, "Password required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export const forgotPwdSchema = z.object({
  identifier: z.string().email("Valid email required"),
  purpose: z
    .enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"])
    .default("EMAIL_VERIFICATION"),
});

export const resetPwdSchema = z.object({
  identifier: z.string().email("Valid email required"),
  code: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password minimum ${MIN_PASSWORD_LENGTH} characters`),
});

/**
 * Parses (and therefore validates) a request body. A failure throws the
 * `ZodError` itself, which the global error handler turns into a 400
 * `VALIDATION_ERROR` envelope — no unvalidated data ever reaches a service.
 */
function parseBody<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  body: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw result.error;
  }

  return result.data as z.infer<TSchema>;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(registerSchema, req.body);
    const result = await authService.register(payload);

    res.status(201).json(formatAuthResponse(result));
  } catch (error) {
    next(toHttpError(error, { code: "REGISTER_FAILED", message: "Unable to complete registration" }));
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(loginSchema, req.body);
    const result = await authService.login(payload);

    res.status(200).json(formatAuthResponse(result));
  } catch (error) {
    next(toHttpError(error, { code: "LOGIN_FAILED", message: "Unable to sign in" }));
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(refreshTokenSchema, req.body);
    const result = await authService.refreshToken(payload);

    res.status(200).json(formatAuthResponse(result));
  } catch (error) {
    next(toHttpError(error, { code: "TOKEN_REFRESH_FAILED", message: "Unable to refresh the session" }));
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(forgotPwdSchema, req.body);
    const result = await authService.forgotPassword(payload);

    res.status(200).json(formatAuthResponse(result));
  } catch (error) {
    next(
      toHttpError(error, {
        code: "OTP_REQUEST_FAILED",
        message: "Unable to issue a verification code",
      }),
    );
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(resetPwdSchema, req.body);
    const result = await authService.resetPassword(payload);

    res.status(200).json(formatAuthResponse(result));
  } catch (error) {
    next(
      toHttpError(error, {
        code: "PASSWORD_RESET_FAILED",
        message: "Unable to reset the password",
      }),
    );
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw createAppError("UNAUTHORIZED", "Authentication required", 401);
    }

    const profile = await authService.getMe(userId);

    res.status(200).json(formatAuthResponse(profile));
  } catch (error) {
    next(
      toHttpError(error, {
        code: "PROFILE_LOOKUP_FAILED",
        message: "Unable to load the profile",
      }),
    );
  }
}