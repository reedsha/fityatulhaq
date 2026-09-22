import { toErrorMessage } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import type { OtpPurposeValue } from "../types";
import { sendOtpEmail } from "../utils/smtp";
import { canResend, recordSend } from "../utils/smtpRateLimiter";

export interface EmailDeliveryResult {
  sent: boolean;
  error?: string;
}

/**
 * Dispatches a one-time code over SMTP, applying the per-identifier resend quota.
 *
 * The contract is deliberately non-fatal: this always resolves, and callers are
 * expected to treat a `false` result as a reportable warning rather than a
 * failure. A mail outage must never turn a successful registration or password
 * reset into an error the member sees, because the account change itself already
 * committed by the time this runs.
 */
export async function deliverOtpEmail(
  to: string,
  code: string,
  purpose: OtpPurposeValue,
): Promise<EmailDeliveryResult> {
  try {
    if (!canResend(to, purpose)) {
      return { sent: false, error: "RATE_LIMIT_EXCEEDED" };
    }

    const result = await sendOtpEmail(to, code, purpose);

    if (!result.success) {
      return { sent: false, error: result.error ?? "EMAIL_DELIVERY_FAILED" };
    }

    // Recorded only after a successful dispatch, so an outage does not consume
    // the caller's quota and a genuine retry stays possible.
    recordSend(to, purpose);

    return { sent: true };
  } catch (error) {
    logger.debug(`[SMTP_DELIVERY_ERROR] ${toErrorMessage(error)}`);

    return { sent: false, error: "Email delivery temporarily unavailable" };
  }
}
