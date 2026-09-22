/**
 * In-memory rate limiter guarding OTP dispatch over SMTP.
 *
 * Deliberately process-local: adequate for the single-instance Phase 2
 * deployment. If the API is ever scaled horizontally this must move to shared
 * storage (Redis, or a database table), otherwise every instance would enforce
 * its own independent quota and the effective limit would scale with the fleet.
 */

export interface SmtpRateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

/** Three dispatches per identifier per five minutes. */
export const DEFAULT_SMTP_RATE_LIMIT: SmtpRateLimitConfig = {
  windowMs: 5 * 60 * 1000,
  maxAttempts: 3,
};

/** Composite key -> dispatch timestamps in milliseconds, oldest first. */
const sendHistory = new Map<string, number[]>();

/**
 * Identifiers are normalised so that `Big@Mo.com` and `big@mo.com` share a
 * quota, and so a caller cannot sidestep the limit with casing or padding.
 */
function buildKey(identifier: string, purpose: string): string {
  return `${purpose}:${identifier.trim().toLowerCase()}`;
}

/** Drops timestamps that have aged out of the window. */
function prune(history: number[], windowMs: number, now: number): number[] {
  return history.filter((timestamp) => now - timestamp < windowMs);
}

/**
 * Reports whether another dispatch is currently allowed. Pure check — it prunes
 * expired timestamps but never records anything, so a caller can inspect the
 * quota without consuming it. Pair with {@link recordSend} after the attempt.
 */
export function canResend(
  identifier: string,
  purpose: string,
  config: SmtpRateLimitConfig = DEFAULT_SMTP_RATE_LIMIT,
): boolean {
  const key = buildKey(identifier, purpose);
  const now = Date.now();
  const history = prune(sendHistory.get(key) ?? [], config.windowMs, now);

  if (history.length === 0) {
    // Nothing live left for this key, so stop the map from growing forever.
    sendHistory.delete(key);
  } else {
    sendHistory.set(key, history);
  }

  return history.length < config.maxAttempts;
}

/**
 * Records a dispatch attempt. Call this only after a send actually went out, so
 * that failures caused by an outage do not burn the caller's quota.
 */
export function recordSend(
  identifier: string,
  purpose: string,
  config: SmtpRateLimitConfig = DEFAULT_SMTP_RATE_LIMIT,
): void {
  const key = buildKey(identifier, purpose);
  const now = Date.now();
  const history = prune(sendHistory.get(key) ?? [], config.windowMs, now);

  history.push(now);
  sendHistory.set(key, history);
}

/** Drops all tracked history. Test seam only — never called from application code. */
export function resetSmtpLimiter(): void {
  sendHistory.clear();
}
