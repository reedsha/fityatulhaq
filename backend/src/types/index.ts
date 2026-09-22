import type { Request } from "express";

/**
 * User roles — mirrors the Prisma `UserRole` enum so consumers of the API
 * layer never have to reach into the generated client just for literals.
 */
export const ROLES = {
  GUEST: "GUEST",
  MEMBER: "MEMBER",
  CONTENT_MODERATOR: "CONTENT_MODERATOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * OTP purposes — mirrors the Prisma `OtpPurpose` enum.
 */
export const OTP_PURPOSES = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

export type OtpPurposeValue = (typeof OTP_PURPOSES)[keyof typeof OTP_PURPOSES];

/**
 * Identity attached to the request once the access token is verified.
 */
export interface UserPayload {
  id: string;
  role: string;
}

/**
 * Use this when a handler must be explicit about requiring an authenticated
 * caller; plain `Request` is enough elsewhere thanks to the global augmentation
 * below.
 */
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}