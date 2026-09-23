import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import {
  createAppError,
  formatAuthResponse,
  isApplicationError,
  toErrorMessage,
  toHttpError,
} from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import * as authService from "../services/authService";
import { MIN_PASSWORD_LENGTH } from "../services/authService";
import {
  clearAuthCookies,
  readRefreshTokenCookie,
  setAuthCookies,
} from "../utils/authCookies";
import { parseBody } from "../utils/validation";

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

/**
 * The refresh token normally arrives in the httpOnly `refreshToken` cookie, so
 * the body is optional: it stays accepted so non-browser callers (and the smoke
 * test) can keep presenting the token explicitly.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required").optional(),
});

/** Same contract as the refresh body — the cookie is the usual source. */
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required").optional(),
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
 * Same identifier + code contract as the reset flow, minus the new password:
 * this endpoint only redeems the EMAIL_VERIFICATION code.
 */
export const verifyEmailSchema = z.object({
  identifier: z.string().email("Valid email required"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(registerSchema, req.body);
    const result = await authService.register(payload);

    // The session lives in httpOnly cookies now. The access token is echoed in
    // the body as well so server-to-server callers can still use a bearer header.
    setAuthCookies(res, result);

    res.status(201).json(formatAuthResponse({ accessToken: result.accessToken }));
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

    setAuthCookies(res, result);

    res.status(200).json(
      formatAuthResponse({
        user: result.user,
        isNew: result.isNew,
        accessToken: result.accessToken,
      }),
    );
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

    // Cookie first: it is what a browser presents. The body stays a fallback for
    // callers that hold the token themselves.
    const presented = readRefreshTokenCookie(req) ?? payload.refreshToken;

    if (presented === undefined) {
      throw createAppError(
        "TOKEN_REVOKED",
        "Refresh token is invalid or has been revoked",
        401,
      );
    }

    const result = await authService.refreshToken({ refreshToken: presented });

    setAuthCookies(res, result);

    res.status(200).json(formatAuthResponse({ accessToken: result.accessToken }));
  } catch (error) {
    // A rejected refresh token is unusable from here on, so the dead cookies are
    // cleared instead of being re-presented on every future attempt.
    if (isApplicationError(error) && error.statusCode === 401) {
      clearAuthCookies(res);
    }

    next(toHttpError(error, { code: "TOKEN_REFRESH_FAILED", message: "Unable to refresh the session" }));
  }
}

/**
 * Ends the session: revokes the stored refresh token and expires both cookies.
 *
 * Deliberately not rate limited — a throttled sign-out would leave the browser
 * holding live credentials, which is the one outcome this endpoint exists to
 * prevent. Revocation failures are logged without failing the request, because
 * the cookies are dropped either way and the row expires on its own.
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(logoutSchema, req.body);
    const presented = readRefreshTokenCookie(req) ?? payload.refreshToken;

    if (presented !== undefined) {
      try {
        await authService.logout({ refreshToken: presented });
      } catch (error) {
        logger.warn(`[LOGOUT_REVOKE_FAILED] ${toErrorMessage(error)}`);
      }
    }

    clearAuthCookies(res);

    res.status(200).json(formatAuthResponse({ message: "Signed out" }));
  } catch (error) {
    // The cookies are dropped even when the body was unusable: the caller asked
    // to be signed out, and leaving live credentials behind would be worse.
    clearAuthCookies(res);

    next(toHttpError(error, { code: "LOGOUT_FAILED", message: "Unable to sign out" }));
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

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = parseBody(verifyEmailSchema, req.body);
    const result = await authService.verifyEmail(payload);

    res.status(200).json(formatAuthResponse(result));
  } catch (error) {
    next(
      toHttpError(error, {
        code: "EMAIL_VERIFICATION_FAILED",
        message: "Unable to verify the email",
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