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
  .min(1, "Email is required")
  .email("Enter a valid email address");

const usernameField = z
  .string()
  .min(MIN_USERNAME_LENGTH, `Username must be at least ${MIN_USERNAME_LENGTH} characters`)
  .max(MAX_USERNAME_LENGTH, `Username must be at most ${MAX_USERNAME_LENGTH} characters`)
  .regex(USERNAME_PATTERN, "Use letters, numbers and underscores only");

const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);

const fullNameField = z
  .string()
  .trim()
  .min(MIN_FULL_NAME_LENGTH, `Full name must be at least ${MIN_FULL_NAME_LENGTH} characters`)
  .max(MAX_FULL_NAME_LENGTH, `Full name must be at most ${MAX_FULL_NAME_LENGTH} characters`);

const otpCodeField = z.string().regex(OTP_CODE_PATTERN, "The code is 6 digits");

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
  identifier: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
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
  return checkString(emailField, email, "Enter a valid email address");
}

export function validateUsername(username: string): ValidationResult {
  return checkString(usernameField, username, "Enter a valid username");
}

export function validatePassword(password: string): ValidationResult {
  return checkString(passwordField, password, "Enter a valid password");
}

export function validateFullName(fullName: string): ValidationResult {
  return checkString(fullNameField, fullName, "Enter your full name");
}

export function validateOtpCode(code: string): ValidationResult {
  return checkString(otpCodeField, code, "The code is 6 digits");
}

/** Optional field: an empty value is valid. */
export function validatePhone(phone: string): ValidationResult {
  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    return VALID;
  }

  return PHONE_PATTERN.test(trimmed) ? VALID : invalid("Enter a valid phone number");
}

/** Optional field: an empty value is valid, as is any past date. */
export function validateBirthDate(birthDate: string): ValidationResult {
  const trimmed = birthDate.trim();

  if (trimmed.length === 0) {
    return VALID;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return invalid("Enter a valid date of birth");
  }

  if (parsed.getTime() > Date.now()) {
    return invalid("Date of birth cannot be in the future");
  }

  return VALID;
}

export function validateConfirmPassword(password: string, confirmation: string): ValidationResult {
  if (confirmation.length === 0) {
    return invalid("Confirm your password");
  }

  return password === confirmation ? VALID : invalid("Passwords do not match");
}

export function validateTermsAccepted(accepted: boolean): ValidationResult {
  return accepted ? VALID : invalid("You must accept the terms to create an account");
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
    return invalid("Choose a JPEG, PNG, GIF or WebP image");
  }

  if (file.size === 0) {
    return invalid("That file is empty");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return invalid(`Image must be ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB or smaller`);
  }

  return VALID;
}

// ------------------------------------------------------------
// Date formatting — shared by the home page sections
// ------------------------------------------------------------

/**
 * Pinned to `en-US` rather than derived from the runtime locale: the site copy
 * is English, and a formatter that depends on the visitor's locale would format
 * differently on the server and the client, breaking hydration.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
const SECONDS_PER_WEEK = 7 * SECONDS_PER_DAY;
const SECONDS_PER_MONTH = 30 * SECONDS_PER_DAY;
const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;

/** Formats an ISO timestamp as `"January 15, 2026"`. Unparseable input yields `""`. */
export function formatDate(dateString: string): string {
  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return DATE_FORMATTER.format(parsed);
}

function elapsedAgo(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

/**
 * Relative time such as `"2 hours ago"`.
 *
 * Reads the clock, so it must only be rendered after mount on a statically
 * prerendered page — otherwise the server's answer is baked into the HTML and
 * disagrees with the client's. Unparseable input yields `""`, and a future
 * timestamp (clock skew, scheduled posts) reads as `"just now"` rather than a
 * negative count.
 */
export function timeAgo(dateString: string): string {
  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const elapsedSeconds = Math.floor((Date.now() - parsed.getTime()) / 1000);

  if (elapsedSeconds < SECONDS_PER_MINUTE) {
    return "just now";
  }

  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_MINUTE), "minute");
  }

  if (elapsedSeconds < SECONDS_PER_DAY) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_HOUR), "hour");
  }

  if (elapsedSeconds < SECONDS_PER_WEEK) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_DAY), "day");
  }

  if (elapsedSeconds < SECONDS_PER_MONTH) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_WEEK), "week");
  }

  if (elapsedSeconds < SECONDS_PER_YEAR) {
    return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_MONTH), "month");
  }

  return elapsedAgo(Math.floor(elapsedSeconds / SECONDS_PER_YEAR), "year");
}
