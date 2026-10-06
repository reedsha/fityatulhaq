import { createTransport, type SendMailOptions } from "nodemailer";

import { toErrorMessage } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import type { OtpPurposeValue } from "../types";

const DEFAULT_SMTP_HOST = "localhost";
const DEFAULT_SMTP_PORT = 587;
const DEFAULT_SENDER_EMAIL = "noreply@fityatulhaq.org";
const SENDER_NAME = "FityatulHaq";
const BRAND_ACCENT = "#059669";
const BRAND_ACCENT_SOFT = "#ecfdf5";

/** SMTP submission port that expects TLS immediately (implicit TLS). */
const IMPLICIT_TLS_PORT = 465;

/**
 * Outbound deadlines. Delivery is awaited inside the register and
 * forgot-password request paths, so a black-holed SMTP host must not be able to
 * hold an HTTP response open for nodemailer's two-minute defaults.
 */
const CONNECTION_TIMEOUT_MS = 10_000;
const GREETING_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 20_000;

function optionalEnvVar(name: string, fallback: string): string {
  const value = process.env[name]?.trim();

  return value !== undefined && value.length > 0 ? value : fallback;
}

function requireEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`MISSING_ENV_VAR: ${name}`);
  }

  return value;
}

/** Fail fast rather than letting a malformed port reach nodemailer as `NaN`. */
function requirePort(): number {
  const raw = optionalEnvVar("SMTP_PORT", String(DEFAULT_SMTP_PORT));
  const port = Number.parseInt(raw, 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`INVALID_ENV_VAR: SMTP_PORT (${raw})`);
  }

  return port;
}

export const SMTP_HOST: string = optionalEnvVar("SMTP_HOST", DEFAULT_SMTP_HOST);
export const SMTP_PORT: number = requirePort();

/** Credentials are required: an unauthenticated relay is never the intent here. */
export const SMTP_USER: string = requireEnvVar("SMTP_USER");
export const SMTP_PASS: string = requireEnvVar("SMTP_PASS");
export const SMTP_SENDER_EMAIL: string = optionalEnvVar(
  "SMTP_SENDER_EMAIL",
  DEFAULT_SENDER_EMAIL,
);

export const SMTP_FROM: string = `${SENDER_NAME} <${SMTP_SENDER_EMAIL}>`;

/**
 * Shape handed straight to nodemailer. Exported so the transport contract can
 * be asserted in tests without reaching into nodemailer's internals.
 */
export interface SmtpTransportOptions {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls: {
    rejectUnauthorized: boolean;
  };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
}

/**
 * Port 465 speaks TLS from the first byte, whereas 587 upgrades via STARTTLS.
 * Getting this pair wrong hangs the handshake instead of failing loudly, so the
 * flag is derived from the port rather than hardcoded.
 */
export function resolveSecureFlag(port: number): boolean {
  return port === IMPLICIT_TLS_PORT;
}

export const smtpTransportOptions: SmtpTransportOptions = {
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: resolveSecureFlag(SMTP_PORT),
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    // Accepts self-signed certificates, which is what local development and
    // most managed relays present. Production should pin a real certificate and
    // flip this to true.
    rejectUnauthorized: false,
  },
  connectionTimeout: CONNECTION_TIMEOUT_MS,
  greetingTimeout: GREETING_TIMEOUT_MS,
  socketTimeout: SOCKET_TIMEOUT_MS,
};

export const transporter = createTransport(smtpTransportOptions);

/**
 * Fire-and-forget configuration probe. Deliberately not awaited: a relay that
 * is slow or unreachable at boot must still let the API come up, because email
 * is non-fatal to every flow that uses it.
 */
transporter
  .verify()
  .then(() => {
    logger.info(
      `[SMTP] Transport verified for ${SMTP_HOST}:${SMTP_PORT} (secure=${resolveSecureFlag(SMTP_PORT)}, user=${SMTP_USER})`,
    );
  })
  .catch((error: unknown) => {
    logger.error(
      `[SMTP] Verification failed for ${SMTP_HOST}:${SMTP_PORT} (secure=${resolveSecureFlag(SMTP_PORT)}, user=${SMTP_USER}): ${toErrorMessage(error)}`,
    );
    if (SMTP_HOST === "localhost" || SMTP_HOST === "127.0.0.1") {
      logger.warn(
        "[SMTP] SMTP_HOST is set to localhost — check that your .env file defines SMTP_HOST to a reachable mail relay.",
      );
    } else {
      logger.warn(
        "[SMTP] If you are using managed email (Supabase), the hostname should look like smtp.<your-project-ref>.supabase.co, not a bare domain.",
      );
      if (SMTP_PORT === 587) {
        logger.warn(
          "[SMTP] Port 587 with secure=false requires STARTTLS. If the server expects TLS from the first byte, try SMTP_PORT=465 instead.",
        );
      }
    }
  });

export interface EmailTemplate {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readMessageId(info: unknown): string | undefined {
  if (!isRecord(info)) {
    return undefined;
  }

  return readNonEmptyString(info.messageId);
}

/**
 * Sends one transactional email through the configured SMTP relay.
 *
 * Never throws and never reports an exception to the caller: delivery problems
 * are expressed as `{ success: false, error }` so that a mail outage can never
 * take down registration or password reset.
 */
export async function sendEmail(template: EmailTemplate): Promise<SendResult> {
  try {
    const mailOptions: SendMailOptions = {
      from: SMTP_FROM,
      to: template.to,
      subject: template.subject,
      html: template.html,
    };

    if (template.text !== undefined && template.text.length > 0) {
      mailOptions.text = template.text;
    }

    // Nodemailer types `SentMessageInfo` as `any`; pinning it to `unknown` keeps
    // the untyped value from leaking into the rest of this module.
    const info: unknown = await transporter.sendMail(mailOptions);
    const messageId = readMessageId(info);

    return messageId === undefined ? { success: true } : { success: true, messageId };
  } catch (error) {
    // Recorded at debug level: the caller decides whether this is worth a
    // warning, and the raw relay error must never reach the end user.
    logger.debug(`[SMTP_SEND_ERROR] ${toErrorMessage(error)}`);

    return { success: false, error: toErrorMessage(error) };
  }
}

/**
 * Delivers a one-time code. The code itself is never logged, here or downstream.
 */
export function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpPurposeValue,
): Promise<SendResult> {
  const isPasswordReset = purpose === "PASSWORD_RESET";

  return sendEmail({
    to: [to],
    subject: isPasswordReset
      ? "รีเซ็ตรหัสผ่าน FityatulHaq"
      : "ยืนยันอีเมล FityatulHaq",
    html: createOtpEmailHtml(code, purpose),
    text: createOtpEmailText(code, purpose),
  });
}

/** Shared copy so the HTML and plain-text parts can never drift apart. */
function otpCopy(purpose: string): { heading: string; intro: string } {
  const isPasswordReset = purpose === "PASSWORD_RESET";

  return {
    heading: isPasswordReset ? "รีเซ็ตรหัสผ่าน" : "ยืนยันอีเมลของคุณ",
    intro: isPasswordReset
      ? "ใช้รหัสด้านล่างนี้เพื่อตั้งรหัสผ่านใหม่สำหรับบัญชี FityatulHaq ของคุณ"
      : "ใช้รหัสด้านล่างนี้เพื่อยืนยันอีเมลและเปิดใช้งานบัญชี FityatulHaq ของคุณ",
  };
}

/**
 * Pure HTML builder for the OTP email.
 *
 * Table-based and fully inline-styled, which is the only layout Outlook and the
 * webmail clients render predictably. No `<style>` block — it would be stripped.
 */
export function createOtpEmailHtml(code: string, purpose: string): string {
  const { heading, intro } = otpCopy(purpose);

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>รหัสยืนยัน FityatulHaq</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
            <tr>
              <td style="padding:32px 32px 0 32px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${BRAND_ACCENT};font-weight:700;">
                รหัสยืนยัน FityatulHaq
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px;font-size:22px;font-weight:700;line-height:30px;">
                ${heading}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px;font-size:15px;line-height:24px;color:#374151;">
                ${intro}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="background-color:${BRAND_ACCENT_SOFT};border:1px dashed ${BRAND_ACCENT};border-radius:8px;padding:16px 24px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND_ACCENT};">
                      ${code}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;font-size:14px;line-height:22px;color:#374151;">
                รหัสนี้หมดอายุภายใน 15 นาที
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;line-height:20px;color:#6b7280;">
                      หากคุณไม่ได้เป็นผู้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ &mdash; บัญชีของคุณยังคงปลอดภัยและไม่มีการเปลี่ยนแปลงใดๆ
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;font-size:12px;color:#9ca3af;">
                FityatulHaq &middot; นี่เป็นข้อความอัตโนมัติ กรุณาอย่าตอบกลับ
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Plain-text alternative for clients that refuse HTML. Kept in step with
 * {@link createOtpEmailHtml} so both parts carry the same information.
 */
export function createOtpEmailText(code: string, purpose: string): string {
  const { heading, intro } = otpCopy(purpose);

  return [
    "รหัสยืนยัน FityatulHaq",
    "",
    heading,
    "",
    intro,
    "",
    `    ${code}`,
    "",
    "รหัสนี้หมดอายุภายใน 15 นาที",
    "",
    "หากคุณไม่ได้เป็นผู้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ - บัญชีของคุณ",
    "ยังคงปลอดภัยและไม่มีการเปลี่ยนแปลงใดๆ",
    "",
    "FityatulHaq - นี่เป็นข้อความอัตโนมัติ กรุณาอย่าตอบกลับ",
  ].join("\n");
}
