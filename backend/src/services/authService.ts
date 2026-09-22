import { prisma } from "../config/database";
import { OtpPurpose, Prisma, SyncStatus, UserRole } from "../generated/prisma/client";
import { createAppError, toErrorMessage } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import type { OtpPurposeValue } from "../types";
import { OTP_TTL_MS, compareOtp, generateOtp, hashOtp } from "../utils/otp";
import { parseBirthDate } from "../utils/profile";
import { canResend } from "../utils/smtpRateLimiter";
import { toServiceError } from "./serviceError";
import { PUBLIC_USER_SELECT, type PublicUserProfile } from "./userProjection";
import { deliverOtpEmail } from "./smtpDelivery";
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

export interface VerifyEmailInput {
  identifier: string;
  code: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface LogoutResult {
  message: string;
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

/**
 * Deliberately not `PublicUserProfile`: that projection is a shared contract and
 * has no verification column, and widening it would change what `/auth/me` and
 * the profile endpoints return.
 */
export interface VerifyEmailResult {
  message: string;
  email: string;
  verifiedAt: Date;
}

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

/**
 * Registers a member and returns a usable token pair straight away; the account
 * stays unverified until the emailed code is confirmed.
 */
/**
 * Development-only echo of a freshly issued code. Local mail delivery is usually
 * unconfigured, so without this the verification screens are untestable. The
 * guard is deliberate: an OTP written to a production log is a live credential.
 */
function logOtpForLocalDevelopment(
  identifier: string,
  code: string,
  purpose: OtpPurposeValue,
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  logger.info(`[OTP_DEV_ONLY] ${purpose} code for ${identifier}: ${code}`);
}

/**
 * Issues and dispatches a fresh email-verification code on a best-effort basis.
 *
 * The login path uses this so the verification screen shown to an unverified
 * member is telling the truth when it claims a code was sent. Nothing here may
 * propagate: a mail failure must never turn a valid sign-in into an error, so
 * every problem is reported through the log and swallowed.
 */
async function issueEmailVerificationCode(identifier: string): Promise<void> {
  // Checked before the stored code is rotated. Replacing the hash while the
  // quota forbids sending would invalidate a code the member already holds and
  // leave them with nothing to enter.
  if (!canResend(identifier, "EMAIL_VERIFICATION")) {
    logger.warn(`[EMAIL_VERIFICATION_NOT_SENT] Resend quota exhausted for ${identifier}`);

    return;
  }

  try {
    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.otpCode.upsert({
      where: {
        identifier_purpose: {
          identifier,
          purpose: OtpPurpose.EMAIL_VERIFICATION,
        },
      },
      create: {
        identifier,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
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

    const delivery = await deliverOtpEmail(identifier, otp, "EMAIL_VERIFICATION");

    if (!delivery.sent) {
      logger.warn(
        `[EMAIL_DELIVERY_FAILED] EMAIL_VERIFICATION code for ${identifier}: ${
          delivery.error ?? "unknown error"
        }`,
      );
    }

    logOtpForLocalDevelopment(identifier, otp, "EMAIL_VERIFICATION");
  } catch (error) {
    logger.warn(
      `[EMAIL_VERIFICATION_ISSUE_FAILED] Could not queue a code for ${identifier}: ${toErrorMessage(
        error,
      )}`,
    );
  }
}

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

    // Dispatched only after the transaction commits, so a code belonging to a
    // rolled-back registration is never emailed. Delivery failures are recorded
    // but never surfaced: the account exists either way, and the member can
    // request a fresh code from the verification screen.
    const delivery = await deliverOtpEmail(email, otp, "EMAIL_VERIFICATION");

    if (!delivery.sent) {
      logger.warn(
        `[EMAIL_DELIVERY_FAILED] EMAIL_VERIFICATION code for ${email}: ${
          delivery.error ?? "unknown error"
        }`,
      );
    }

    logOtpForLocalDevelopment(email, otp, "EMAIL_VERIFICATION");

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

    // `isNew` sends the member to the verification screen, which asserts that a
    // code is on its way. Issue one so that assertion holds; the helper is
    // best-effort and cannot fail the sign-in.
    if (user.emailVerifiedAt === null) {
      await issueEmailVerificationCode(user.email);
    }

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
 * Revokes the presented refresh token so the session cannot be resumed.
 *
 * Deliberately idempotent: an unknown, already-rotated or already-revoked token
 * is not an error. Signing out is the caller's exit path — it must succeed even
 * when the stored row is long gone, otherwise the browser would sit on a cookie
 * the server will never accept again.
 */
export async function logout(input: LogoutInput): Promise<LogoutResult> {
  try {
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: await hashRefreshToken(input.refreshToken) },
    });

    return { message: "Signed out" };
  } catch (error) {
    throw toServiceError(error, "LOGOUT_FAILED", "Unable to sign out");
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

    // Dispatched only once the code is durably stored. The response below stays
    // identical whether or not the account exists, and a delivery failure is
    // recorded without changing that answer, so neither branch leaks membership.
    const delivery = await deliverOtpEmail(identifier, otp, input.purpose);

    if (!delivery.sent) {
      logger.warn(
        `[EMAIL_DELIVERY_FAILED] ${input.purpose} code for ${identifier}: ${
          delivery.error ?? "unknown error"
        }`,
      );
    }

    logOtpForLocalDevelopment(identifier, otp, input.purpose);

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

/**
 * Redeems an EMAIL_VERIFICATION code and stamps the account as verified.
 *
 * Unauthenticated by design — the emailed code is the proof, exactly as with
 * `resetPassword`. The row is consumed in the same transaction that flips
 * `emailVerifiedAt`, so a code can never verify twice.
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<VerifyEmailResult> {
  const identifier = normaliseEmail(input.identifier);

  try {
    const otpRecord = await prisma.otpCode.findUnique({
      where: {
        identifier_purpose: {
          identifier,
          purpose: OtpPurpose.EMAIL_VERIFICATION,
        },
      },
    });

    if (otpRecord === null) {
      throw createAppError(
        "OTP_NOT_FOUND",
        "No email verification request was found for this email",
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

    const user = await prisma.user.findUnique({
      where: { email: identifier },
      select: { id: true },
    });

    if (user === null) {
      throw createAppError("USER_NOT_FOUND", "No account was found for this email", 404);
    }

    const verifiedAt = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: verifiedAt },
      }),
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { consumedAt: verifiedAt },
      }),
    ]);

    return { message: "Email verified", email: identifier, verifiedAt };
  } catch (error) {
    throw toServiceError(error, "EMAIL_VERIFICATION_FAILED", "Unable to verify the email");
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