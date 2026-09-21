import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { sign, verify, type JwtPayload } from "jsonwebtoken";

import { createAppError, toErrorMessage } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";

const HASH_ALGORITHM = "sha256";
const JWT_ALGORITHM = "HS256";

const BCRYPT_MIN_ROUNDS = 4;
const BCRYPT_MAX_ROUNDS = 15;

const DURATION_PATTERN = /^(\d+)(s|m|h|d|w)?$/;

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
};

/**
 * Converts an env duration such as `"15m"` / `"7d"` (a bare number means
 * seconds) into the numeric seconds jsonwebtoken expects. The same value drives
 * the `expiresAt` column of `RefreshToken`, so both can never drift apart.
 */
export function parseDurationToSeconds(value: string, variableName: string): number {
  const match = DURATION_PATTERN.exec(value.trim());

  if (match === null) {
    throw createAppError(
      "INVALID_ENV_VAR",
      `Invalid duration "${value}" for ${variableName}; expected e.g. "15m" or "7d"`,
      500,
    );
  }

  const [, rawAmount, rawUnit] = match;

  if (rawAmount === undefined) {
    throw createAppError("INVALID_ENV_VAR", `Invalid duration for ${variableName}`, 500);
  }

  const seconds = Number.parseInt(rawAmount, 10) * (UNIT_SECONDS[rawUnit ?? "s"] ?? 1);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw createAppError(
      "INVALID_ENV_VAR",
      `Duration for ${variableName} must be greater than zero`,
      500,
    );
  }

  return seconds;
}

function resolveSaltRounds(): number {
  const raw = process.env.BCRYPT_SALT_ROUNDS;

  if (raw === undefined || raw.trim() === "") {
    return 12;
  }

  const rounds = Number.parseInt(raw, 10);

  if (
    !Number.isInteger(rounds) ||
    rounds < BCRYPT_MIN_ROUNDS ||
    rounds > BCRYPT_MAX_ROUNDS
  ) {
    throw createAppError(
      "INVALID_ENV_VAR",
      `BCRYPT_SALT_ROUNDS must be an integer between ${BCRYPT_MIN_ROUNDS} and ${BCRYPT_MAX_ROUNDS}`,
      500,
    );
  }

  return rounds;
}

/** Cost factor for password hashing; shared so every call site agrees. */
export const BCRYPT_SALT_ROUNDS = resolveSaltRounds();

export const ACCESS_TOKEN_EXPIRY_SECONDS = parseDurationToSeconds(
  process.env.JWT_ACCESS_TOKEN_EXPIRY ?? "15m",
  "JWT_ACCESS_TOKEN_EXPIRY",
);

export const REFRESH_TOKEN_EXPIRY_SECONDS = parseDurationToSeconds(
  process.env.JWT_REFRESH_TOKEN_EXPIRY ?? "7d",
  "JWT_REFRESH_TOKEN_EXPIRY",
);

export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  id: string;
}

/**
 * Read lazily so module import order can never mask a misconfigured secret.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw createAppError("MISSING_ENV_VAR", "JWT_SECRET is not configured", 500);
  }

  return secret;
}

/** Issues a short-lived HS256 access token (`sub` = user id). */
export function signAccessToken(payload: AccessTokenPayload): string {
  try {
    return sign(
      { email: payload.email, role: payload.role },
      getJwtSecret(),
      {
        algorithm: JWT_ALGORITHM,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        subject: payload.id,
      },
    );
  } catch (error) {
    logger.error(`[TOKEN_SIGNING_FAILED] ${toErrorMessage(error)}`);
    throw createAppError("TOKEN_SIGNING_FAILED", "Unable to issue access token", 500);
  }
}

/** Returns the verified payload, or `null` for anything invalid/expired. */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });

    if (typeof decoded === "string") {
      logger.warn("[TOKEN_VERIFY_FAILED] Access token carried an unexpected string payload");
      return null;
    }

    return decoded;
  } catch (error) {
    logger.debug(`[TOKEN_VERIFY_FAILED] ${toErrorMessage(error)}`);
    return null;
  }
}

/**
 * Issues a long-lived HS256 refresh token. The `jti` keeps two tokens minted for
 * the same user in the same second from colliding on the unique `tokenHash`.
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  try {
    return sign({}, getJwtSecret(), {
      algorithm: JWT_ALGORITHM,
      expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
      subject: payload.id,
      jwtid: randomUUID(),
    });
  } catch (error) {
    logger.error(`[TOKEN_SIGNING_FAILED] ${toErrorMessage(error)}`);
    throw createAppError("TOKEN_SIGNING_FAILED", "Unable to issue refresh token", 500);
  }
}

/** Returns the verified payload, or `null` for anything invalid/expired. */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });

    if (typeof decoded === "string") {
      logger.warn("[TOKEN_VERIFY_FAILED] Refresh token carried an unexpected string payload");
      return null;
    }

    return decoded;
  } catch (error) {
    logger.debug(`[TOKEN_VERIFY_FAILED] ${toErrorMessage(error)}`);
    return null;
  }
}

/** Hashes a password with bcrypt at the configured cost factor. */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    return await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
  } catch (error) {
    logger.error(`[PASSWORD_HASH_FAILED] ${toErrorMessage(error)}`);
    throw createAppError("PASSWORD_HASH_FAILED", "Unable to secure the password", 500);
  }
}

/** Constant-time bcrypt comparison of a plain password against its hash. */
export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch (error) {
    logger.error(`[PASSWORD_VERIFY_FAILED] ${toErrorMessage(error)}`);
    throw createAppError(
      "PASSWORD_VERIFY_FAILED",
      "Unable to verify the supplied password",
      500,
    );
  }
}

/**
 * Refresh tokens are persisted as a deterministic SHA-256 digest — exactly what
 * `RefreshToken.tokenHash` is documented to hold. bcrypt is deliberately not
 * used here: its per-call salt makes the digest non-deterministic, which would
 * make the `findUnique({ where: { tokenHash } })` lookup impossible.
 */
export async function hashRefreshToken(rawToken: string): Promise<string> {
  return createHash(HASH_ALGORITHM).update(rawToken).digest("hex");
}

/** Constant-time comparison of a stored refresh-token digest with a raw token. */
export async function compareRefreshToken(
  hash: string,
  rawToken: string,
): Promise<boolean> {
  const candidate = createHash(HASH_ALGORITHM).update(rawToken).digest("hex");
  const stored = Buffer.from(hash, "hex");
  const submitted = Buffer.from(candidate, "hex");

  if (stored.length === 0 || stored.length !== submitted.length) {
    return false;
  }

  return timingSafeEqual(stored, submitted);
}