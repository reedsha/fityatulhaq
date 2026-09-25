import { z } from "zod";

/**
 * Client-side mirror of the backend's validation contract. Every limit here is
 * copied from `backend/src/services/authService.ts` and the Zod schemas in
 * `backend/src/controllers/authController.ts` so the two never disagree.
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_FULL_NAME_LENGTH = 2;
export const MAX_FULL_NAME_LENGTH = 100;
export const OTP_CODE_LENGTH = 6;

export const OTP_PURPOSES = ["EMAIL_VERIFICATION", "PASSWORD_RESET"] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/** Letters, numbers and underscores only — identical to the backend regex. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const OTP_CODE_PATTERN = /^[0-9]{6}$/;
export const PHONE_PATTERN = /^[0-9+() -]{7,20}$/;

/**
 * Field schemas are declared once and reused by both the whole-form schemas and
 * the per-field validators, so `onBlur` validation can never drift from submit.
 */
const emailField = z
  .string()
  .min(1, "กรุณากรอกอีเมล")
  .email("กรุณากรอกอีเมลให้ถูกต้อง");

const usernameField = z
  .string()
  .min(MIN_USERNAME_LENGTH, `ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย ${MIN_USERNAME_LENGTH} ตัวอักษร`)
  .max(MAX_USERNAME_LENGTH, `ชื่อผู้ใช้ต้องมีความยาวไม่เกิน ${MAX_USERNAME_LENGTH} ตัวอักษร`)
  .regex(USERNAME_PATTERN, "ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีดล่าง (_)");

const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `รหัสผ่านต้องมีความยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);

const fullNameField = z
  .string()
  .trim()
  .min(MIN_FULL_NAME_LENGTH, `ชื่อ-นามสกุลต้องมีความยาวอย่างน้อย ${MIN_FULL_NAME_LENGTH} ตัวอักษร`)
  .max(MAX_FULL_NAME_LENGTH, `ชื่อ-นามสกุลต้องมีความยาวไม่เกิน ${MAX_FULL_NAME_LENGTH} ตัวอักษร`);

const otpCodeField = z.string().regex(OTP_CODE_PATTERN, "รหัสต้องเป็นตัวเลข 6 หลัก");

export const registerSchema = z.object({
  email: emailField,
  username: usernameField,
  password: passwordField,
  fullName: fullNameField,
  phone: z.string().optional(),
  birthDate: z.string().optional(),
});

export type RegisterPayload = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1, "กรุณากรอกอีเมลหรือชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type LoginPayload = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  identifier: emailField,
  purpose: z.enum(OTP_PURPOSES).default("EMAIL_VERIFICATION"),
});

export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  identifier: emailField,
  code: otpCodeField,
  newPassword: passwordField,
});

export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>;

export interface ValidationResult {
  valid: boolean;
  error: string;
}

const VALID: ValidationResult = { valid: true, error: "" };

function invalid(error: string): ValidationResult {
  return { valid: false, error };
}

function checkString(schema: z.ZodString, value: string, fallback: string): ValidationResult {
  const result = schema.safeParse(value);

  if (result.success) {
    return VALID;
  }

  return invalid(result.error.issues[0]?.message ?? fallback);
}

export function validateEmail(email: string): ValidationResult {
  return checkString(emailField, email, "กรุณากรอกอีเมลให้ถูกต้อง");
}

export function validateUsername(username: string): ValidationResult {
  return checkString(usernameField, username, "กรุณากรอกชื่อผู้ใช้");
}

export function validatePassword(password: string): ValidationResult {
  return checkString(passwordField, password, "กรุณากรอกรหัสผ่าน");
}

export function validateFullName(fullName: string): ValidationResult {
  return checkString(fullNameField, fullName, "กรุณากรอกชื่อ-นามสกุล");
}

export function validateOtpCode(code: string): ValidationResult {
  return checkString(otpCodeField, code, "รหัสต้องเป็นตัวเลข 6 หลัก");
}

/** Optional field: an empty value is valid. */
export function validatePhone(phone: string): ValidationResult {
  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    return VALID;
  }

  return PHONE_PATTERN.test(trimmed) ? VALID : invalid("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
}

/** Optional field: an empty value is valid, as is any past date. */
export function validateBirthDate(birthDate: string): ValidationResult {
  const trimmed = birthDate.trim();

  if (trimmed.length === 0) {
    return VALID;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return invalid("กรุณากรอกวันเกิดให้ถูกต้อง");
  }

  if (parsed.getTime() > Date.now()) {
    return invalid("วันเกิดไม่สามารถเป็นวันที่ในอนาคตได้");
  }

  return VALID;
}

export function validateConfirmPassword(password: string, confirmation: string): ValidationResult {
  if (confirmation.length === 0) {
    return invalid("กรุณายืนยันรหัสผ่าน");
  }

  return password === confirmation ? VALID : invalid("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
}

export function validateTermsAccepted(accepted: boolean): ValidationResult {
  return accepted ? VALID : invalid("กรุณายอมรับข้อกำหนดการใช้งานก่อนสมัครสมาชิก");
}

/** Drops control characters (C0 range plus DEL) without needing a regex. */
function stripControlCharacters(value: string): string {
  let result = "";

  for (const character of value) {
    const codePoint = character.codePointAt(0);

    if (codePoint === undefined || codePoint < 32 || codePoint === 127) {
      continue;
    }

    result += character;
  }

  return result;
}

function collapseSpaces(value: string): string {
  return value.split(" ").filter((part) => part.length > 0).join(" ");
}

/**
 * Normalises text destined for the API: control characters removed, runs of
 * spaces collapsed, ends trimmed.
 *
 * Deliberately does not HTML-escape. The backend already runs every payload
 * through `xss`, and escaping here would double-encode the data — a name like
 * "Ali & Sons" would be stored as "Ali &amp; Sons".
 */
export function sanitizeText(value: string): string {
  return collapseSpaces(stripControlCharacters(value)).trim();
}

/** Passwords are never trimmed: leading and trailing spaces are significant. */
export function sanitizePassword(value: string): string {
  return stripControlCharacters(value);
}

export function readValue(values: Record<string, string>, name: string): string {
  return values[name] ?? "";
}

export function buildRegisterPayload(values: Record<string, string>): RegisterPayload {
  const payload: RegisterPayload = {
    email: sanitizeText(readValue(values, "email")).toLowerCase(),
    username: sanitizeText(readValue(values, "username")),
    password: sanitizePassword(readValue(values, "password")),
    fullName: sanitizeText(readValue(values, "fullName")),
  };

  const phone = sanitizeText(readValue(values, "phone"));

  if (phone.length > 0) {
    payload.phone = phone;
  }

  const birthDate = sanitizeText(readValue(values, "birthDate"));

  if (birthDate.length > 0) {
    payload.birthDate = birthDate;
  }

  return payload;
}

export function buildLoginPayload(values: Record<string, string>): LoginPayload {
  return {
    identifier: sanitizeText(readValue(values, "identifier")),
    password: sanitizePassword(readValue(values, "password")),
  };
}

export function buildForgotPasswordPayload(
  values: Record<string, string>,
): ForgotPasswordPayload {
  return {
    identifier: sanitizeText(readValue(values, "identifier")).toLowerCase(),
    purpose: "PASSWORD_RESET",
  };
}

export function buildResetPasswordPayload(
  identifier: string,
  values: Record<string, string>,
): ResetPasswordPayload {
  return {
    identifier: sanitizeText(identifier).toLowerCase(),
    code: sanitizeText(readValue(values, "code")),
    newPassword: sanitizePassword(readValue(values, "newPassword")),
  };
}

// ------------------------------------------------------------
// Avatar upload — mirrors backend/src/utils/imageValidator.ts
// ------------------------------------------------------------

/** Matches `MAX_AVATAR_BYTES` on the backend (multer's own limit). */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** Matches `SUPPORTED_IMAGE_MIME_TYPES` on the backend. */
export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const AVATAR_ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,.gif,.webp";

/**
 * Cheap client-side gate for a selected avatar.
 *
 * This is a UX affordance, not a security control: the browser's `type` and
 * `size` are trivially forged, and the backend re-derives the real format from
 * the file's magic number. Catching the obvious cases here just avoids a round
 * trip that would fail anyway.
 */
export function validateAvatarFile(file: File): ValidationResult {
  const mimeType = file.type.toLowerCase();

  if (!(ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return invalid("กรุณาเลือกไฟล์รูปภาพนามสกุล JPEG, PNG, GIF หรือ WebP");
  }

  if (file.size === 0) {
    return invalid("ไฟล์นี้ว่างเปล่า");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return invalid(`รูปภาพต้องมีขนาดไม่เกิน ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB`);
  }

  return VALID;
}

// ------------------------------------------------------------
// Date formatting — shared by the home page sections
// ------------------------------------------------------------

/**
 * Pinned to `th-TH` rather than derived from the runtime locale: the site copy
 * is Thai (Buddhist-era years), and a formatter that depends on the visitor's
 * locale would format differently on the server and the client, breaking
 * hydration. `<time dateTime>` attributes keep the ISO value.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
const SECONDS_PER_WEEK = 7 * SECONDS_PER_DAY;
const SECONDS_PER_MONTH = 30 * SECONDS_PER_DAY;
const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;

/** Formats an ISO timestamp as `"15 มกราคม 2569"`. Unparseable input yields `""`. */
export function formatDate(dateString: string): string {
  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return DATE_FORMATTER.format(parsed);
}

function elapsedAgo(count: number, unit: string): string {
  return `${count} ${unit}ที่แล้ว`;
}

/**
 * Relative time such as `"2 ชั่วโมงที่แล้ว"`.
 *
 * Reads the clock, so it must only be rendered after mount on a statically
 * prerendered page — otherwise the server's answer is baked into the HTML and
 * disagrees with the client's. Unparseable input yields `""`, and a future
 * timestamp (clock skew, scheduled posts) reads as `"เมื่อสักครู่"` rather than a
 * negative count.
 */
export function timeAgo(dateString: string): string {
  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const elapsedSeconds = Math.floor((Date.now() - parsed.getTime()) / 1000);

  if (elapsedSeconds < SECONDS_PER_MINUTE) {
    return "เมื่อสักครู่";
  }

  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_MINUTE), "นาที");
  }

  if (elapsedSeconds < SECONDS_PER_DAY) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_HOUR), "ชั่วโมง");
  }

  if (elapsedSeconds < SECONDS_PER_WEEK) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_DAY), "วัน");
  }

  if (elapsedSeconds < SECONDS_PER_MONTH) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_WEEK), "สัปดาห์");
  }

  if (elapsedSeconds < SECONDS_PER_YEAR) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_MONTH), "เดือน");
  }

  return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_YEAR), "ปี");
}
