import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const OTP_MIN = 100000;

/** `randomInt`'s upper bound is exclusive, so the largest issued code is 999998. */
const OTP_MAX = 999999;

/** Codes and reset links stay valid for 15 minutes (SRS 6). */
export const OTP_TTL_MS = 15 * 60 * 1000;

const HASH_ALGORITHM = "sha256";

/** Random 6-digit numeric code, e.g. `"847291"`. */
export function generateOtp(): string {
  return randomInt(OTP_MIN, OTP_MAX).toString();
}

/** SHA-256 hex digest used as the at-rest representation of a code. */
export function hashOtp(code: string): string {
  return createHash(HASH_ALGORITHM).update(code).digest("hex");
}

/**
 * Constant-time comparison between a stored digest and a freshly submitted code.
 * Returns `false` for anything that is not a well-formed digest.
 */
export function compareOtp(storedHash: string, submittedCode: string): boolean {
  const submittedHash = hashOtp(submittedCode);

  if (storedHash.length !== submittedHash.length) {
    return false;
  }

  const stored = Buffer.from(storedHash, "hex");
  const submitted = Buffer.from(submittedHash, "hex");

  if (stored.length === 0 || stored.length !== submitted.length) {
    return false;
  }

  return timingSafeEqual(stored, submitted);
}