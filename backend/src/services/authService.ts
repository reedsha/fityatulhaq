import { prisma } from "../config/database";
import { OtpPurpose, Prisma, SyncStatus, UserRole } from "../generated/prisma/client";
import {
  createAppError,
  isApplicationError,
  toErrorMessage,
  toHttpError,
} from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import type { OtpPurposeValue } from "../types";
import { OTP_TTL_MS, compareOtp, generateOtp, hashOtp } from "../utils/otp";
import {
  REFRESH_TOKEN_EXPIRY_SECONDS,
  hashPassword,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "./jwtService";

/** Passwords shorter than this are rejected by both the schema and the service. */
export const MIN_PASSWORD_LENGTH = 8;

/** Wrong OTP submissions tolerated before the code is burnt (defence in depth). */
export const MAX_OTP_ATTEMPTS = 5;

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  birthDate?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  identifier: string;
  purpose: OtpPurposeValue;
}

export interface ResetPasswordInput {
  identifier: string;
  code: string;
  newPassword: string;
}

/** Token pair handed back to the client. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type RegisterResult = AuthTokens;

export interface LoginUserSummary {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface LoginResult extends AuthTokens {
  user: LoginUserSummary;
  isNew: boolean;
}

export interface ForgotPasswordResult {
  message: string;
}

export interface ResetPasswordResult {
  message: string;
}

/** Safe projection of a user row — never carries `passwordHash`. */
export interface PublicUserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string | null;
  birthDate: Date | null;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
}

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  phone: true,
  birthDate: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;

const LOGIN_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;

const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_EXPIRY_SECONDS * 1000;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

function parseBirthDate(rawBirthDate: string | undefined): Date | null {
  if (rawBirthDate === undefined || rawBirthDate.trim() === "") {
    return null;
  }

  const parsed = new Date(rawBirthDate);

  if (Number.isNaN(parsed.getTime())) {
    throw createAppError(
      "INVALID_BIRTH_DATE",
      "birthDate must be a valid ISO 8601 date",
      400,
    );
  }

  return parsed;
}

/**
 * Maps a write failure onto the API's error contract: unique-constraint races
 * become the same conflict codes the pre-flight checks raise, and anything else
 * is logged and wrapped.
 */
function toServiceError(error: unknown, code: string, message: string): Error {
  if (isApplicationError(error)) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = error.meta?.["target"];
    const fields: string[] = Array.isArray(target)
      ? target.map((field: unknown): string => String(field))
      : [];

    if (fields.includes("username")) {
      return createAppError("USERNAME_ALREADY_EXISTS", "This username is already taken", 409);
    }

    if (fields.includes("email")) {
      return createAppError(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists",
        409,
      );
    }

    return createAppError("DUPLICATE_RECORD", "A record with these details already exists", 409);
  }

  logger.error(`[${code}] ${toErrorMessage(error)}`);

  return toHttpError(error, { code, message });
}

/**
 * Registers a member and returns a usable token pair straight away; the account
 * stays unverified until the emailed code is confirmed.
 */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  const email = normaliseEmail(input.email);
  const username = input.username.trim();

  try {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail !== null) {
      throw createAppError(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists",
        409,
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername !== null) {
      throw createAppError("USERNAME_ALREADY_EXISTS", "This username is already taken", 409);
    }

    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw createAppError(
        "WEAK_PASSWORD",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        400,
      );
    }

    const passwordHash = await hashPassword(input.password);

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    const birthDate = parseBirthDate(input.birthDate);

    // The user, its verification code and the first refresh token are written as
    // one unit: any failure leaves no half-registered account behind.
    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const insertedUser = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          fullName: input.fullName.trim(),
          phone: input.phone ?? null,
          birthDate,
          role: UserRole.MEMBER,
          emailVerifiedAt: null,
          syncStatus: SyncStatus.SYNCED,
        },
      });

      const rawRefreshToken = signRefreshToken({ id: insertedUser.id });

      await tx.refreshToken.create({
        data: {
          userId: insertedUser.id,
          tokenHash: await hashRefreshToken(rawRefreshToken),
          expiresAt: refreshTokenExpiry(),
        },
      });

      await tx.otpCode.upsert({
        where: {
          identifier_purpose: {
            identifier: email,
            purpose: OtpPurpose.EMAIL_VERIFICATION,
          },
        },
        create: {
          identifier: email,
          purpose: OtpPurpose.EMAIL_VERIFICATION,
          codeHash,
          expiresAt: otpExpiresAt,
        },
        update: {
          codeHash,
          expiresAt: otpExpiresAt,
          consumedAt: null,
          attempts: 0,
        },
      });

      return { user: insertedUser, refreshToken: rawRefreshToken };
    });

    const accessToken = signAccessToken({
      id: created.user.id,
      email: created.user.email,
      role: created.user.role,
    });

    // Logged only after the transaction commits, so a rolled-back code is never
    // announced. TODO: Implement email delivery when SMTP provider is configured
    logger.info(`[OTP_DISPATCH] EMAIL_VERIFICATION code for ${email}: ${otp}`);

    return { accessToken, refreshToken: created.refreshToken };
  } catch (error) {
    throw toServiceError(error, "REGISTRATION_FAILED", "Unable to complete registration");
  }
}

/**
 * Signs a member in with either their email or their username. Both failure
 * modes return the same code so the endpoint cannot be used to enumerate users.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const identifier = input.identifier.trim();

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normaliseEmail(identifier) }, { username: identifier }],
      },
    });

    if (user === null) {
      logger.warn("[INVALID_CREDENTIALS] Unknown identifier submitted to login");
      throw createAppError("INVALID_CREDENTIALS", "Invalid credentials", 401);
    }

    const passwordMatches = await verifyPassword(user.passwordHash, input.password);

    if (!passwordMatches) {
      logger.warn(`[INVALID_CREDENTIALS] Wrong password for user ${user.id}`);
      throw createAppError("INVALID_CREDENTIALS", "Invalid credentials", 401);
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await hashRefreshToken(refreshToken),
        expiresAt: refreshTokenExpiry(),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
      isNew: user.emailVerifiedAt === null,
    };
  } catch (error) {
    throw toServiceError(error, "LOGIN_FAILED", "Unable to sign in");
  }
}

/**
 * Exchanges a valid refresh token for a fresh pair, rotating the stored row so
 * the presented token can never be replayed.
 */
export async function refreshToken(input: RefreshTokenInput): Promise<AuthTokens> {
  try {
    const payload = verifyRefreshToken(input.refreshToken);

    if (payload === null || typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw createAppError("TOKEN_REVOKED", "Refresh token is invalid or has been revoked", 401);
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: await hashRefreshToken(input.refreshToken) },
    });

    if (stored === null || stored.revokedAt !== null || stored.userId !== payload.sub) {
      throw createAppError("TOKEN_REVOKED", "Refresh token is invalid or has been revoked", 401);
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw createAppError("TOKEN_EXPIRED", "Refresh token has expired", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: stored.userId },
      select: LOGIN_USER_SELECT,
    });

    if (user === null) {
      throw createAppError("USER_NOT_FOUND", "The account for this token no longer exists", 404);
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const nextRefreshToken = signRefreshToken({ id: user.id });

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: stored.id } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: await hashRefreshToken(nextRefreshToken),
          expiresAt: refreshTokenExpiry(),
        },
      }),
    ]);

    return { accessToken, refreshToken: nextRefreshToken };
  } catch (error) {
    throw toServiceError(error, "TOKEN_REFRESH_FAILED", "Unable to refresh the session");
  }
}

/**
 * Issues a fresh OTP for the given purpose. The response is intentionally
 * identical whether or not the account exists.
 */
export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
  const identifier = normaliseEmail(input.identifier);

  try {
    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.otpCode.upsert({
      where: { identifier_purpose: { identifier, purpose: input.purpose } },
      create: {
        identifier,
        purpose: input.purpose,
        codeHash,
        expiresAt,
      },
      update: {
        codeHash,
        expiresAt,
        consumedAt: null,
        attempts: 0,
      },
    });

    if (input.purpose === OtpPurpose.PASSWORD_RESET) {
      const user = await prisma.user.findUnique({
        where: { email: identifier },
        select: { id: true },
      });

      logger.info(
        `[OTP_DISPATCH] PASSWORD_RESET code for ${identifier}: ${otp} (account found: ${user !== null})`,
      );
    } else {
      logger.info(`[OTP_DISPATCH] EMAIL_VERIFICATION code for ${identifier}: ${otp}`);
    }

    // TODO: Implement email delivery when SMTP provider is configured

    return { message: "OTP sent to email" };
  } catch (error) {
    throw toServiceError(error, "OTP_REQUEST_FAILED", "Unable to issue a verification code");
  }
}

/**
 * Consumes a reset code and replaces the stored password hash, revoking every
 * existing refresh token so other sessions cannot outlive the old password.
 */
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ResetPasswordResult> {
  const identifier = normaliseEmail(input.identifier);

  try {
    const otpRecord = await prisma.otpCode.findUnique({
      where: {
        identifier_purpose: {
          identifier,
          purpose: OtpPurpose.PASSWORD_RESET,
        },
      },
    });

    if (otpRecord === null) {
      throw createAppError(
        "OTP_NOT_FOUND",
        "No password reset request was found for this email",
        404,
      );
    }

    if (otpRecord.consumedAt !== null) {
      throw createAppError("OTP_ALREADY_CONSUMED", "This code has already been used", 400);
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      throw createAppError("OTP_EXPIRED", "This code has expired", 400);
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw createAppError(
        "OTP_ATTEMPTS_EXCEEDED",
        "Too many incorrect attempts; request a new code",
        429,
      );
    }

    if (!compareOtp(otpRecord.codeHash, input.code)) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      throw createAppError("INVALID_OTP", "The verification code is incorrect", 400);
    }

    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw createAppError(
        "WEAK_PASSWORD",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: identifier },
      select: { id: true },
    });

    if (user === null) {
      throw createAppError("USER_NOT_FOUND", "No account was found for this email", 404);
    }

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: "Password reset successful" };
  } catch (error) {
    throw toServiceError(error, "PASSWORD_RESET_FAILED", "Unable to reset the password");
  }
}

/** Returns the caller's own profile, never the stored password hash. */
export async function getMe(userId: string): Promise<PublicUserProfile> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });

    if (user === null) {
      throw createAppError("USER_NOT_FOUND", "User not found", 404);
    }

    return user;
  } catch (error) {
    throw toServiceError(error, "PROFILE_LOOKUP_FAILED", "Unable to load the profile");
  }
}