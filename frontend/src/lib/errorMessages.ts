import { ApiError, CLIENT_ERROR } from "./api";
import { MIN_PASSWORD_LENGTH } from "./validation";

/** Form field a server error belongs to; "form" means the whole form. */
export type AuthFormField =
  | "email"
  | "username"
  | "fullName"
  | "phone"
  | "birthDate"
  | "password"
  | "confirmPassword"
  | "identifier"
  | "code"
  | "newPassword"
  | "form";

export interface FieldError {
  message: string;
  field: AuthFormField;
}

/**
 * Maps the backend's machine-readable codes onto a human message and the field
 * that caused it, so requirement 9 (inline errors) can be honoured.
 *
 * Sources: `backend/src/middleware/errorFormatter.ts` and every
 * `createAppError(...)` call in `backend/src/services/authService.ts`.
 */
const FIELD_ERRORS: Record<string, FieldError> = {
  EMAIL_ALREADY_EXISTS: {
    message: "An account with this email already exists.",
    field: "email",
  },
  USERNAME_ALREADY_EXISTS: {
    message: "This username is already taken.",
    field: "username",
  },
  WEAK_PASSWORD: {
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    field: "password",
  },
  INVALID_BIRTH_DATE: {
    message: "Enter a valid date of birth.",
    field: "birthDate",
  },
  DUPLICATE_RECORD: {
    message: "An account with these details already exists.",
    field: "form",
  },
  INVALID_CREDENTIALS: {
    // One message for both failure modes: never reveal which part was wrong.
    message: "Incorrect email/username or password.",
    field: "form",
  },
  USER_NOT_FOUND: {
    message: "We could not find an account for this email.",
    field: "email",
  },
  OTP_NOT_FOUND: {
    message: "We could not find a reset request for this email. Please request a new code.",
    field: "code",
  },
  OTP_EXPIRED: {
    message: "This code has expired. Please request a new one.",
    field: "code",
  },
  OTP_ALREADY_CONSUMED: {
    message: "This code has already been used. Please request a new one.",
    field: "code",
  },
  OTP_ATTEMPTS_EXCEEDED: {
    message: "Too many incorrect attempts. Please request a new code.",
    field: "code",
  },
  INVALID_OTP: {
    message: "That code is incorrect. Please check it and try again.",
    field: "code",
  },
  VALIDATION_ERROR: {
    message: "Some of the details are not valid. Please review them and try again.",
    field: "form",
  },
  TOKEN_EXPIRED: {
    message: "Your session has expired. Please sign in again.",
    field: "form",
  },
  TOKEN_REVOKED: {
    message: "Your session has ended. Please sign in again.",
    field: "form",
  },
  ROUTE_NOT_FOUND: {
    message: "That action is not available yet.",
    field: "form",
  },
  INTERNAL_ERROR: {
    message: "The server ran into a problem. Please try again shortly.",
    field: "form",
  },
  UNAUTHORIZED: {
    message: "Your session has expired. Please sign in again.",
    field: "form",
  },
  // Wrapper codes the service layer attaches when an operation fails outright:
  // the account may still be fine, so these read as "try again", never as
  // "what you typed is wrong".
  REGISTRATION_FAILED: {
    message: "We could not create your account just now. Please try again.",
    field: "form",
  },
  LOGIN_FAILED: {
    message: "We could not sign you in just now. Please try again.",
    field: "form",
  },
  OTP_REQUEST_FAILED: {
    message: "We could not send a code just now. Please try again.",
    field: "identifier",
  },
  PASSWORD_RESET_FAILED: {
    message: "We could not reset your password just now. Please try again.",
    field: "form",
  },
  PROFILE_LOOKUP_FAILED: {
    message: "We could not load your account just now. Please try again.",
    field: "form",
  },
  TOKEN_REFRESH_FAILED: {
    message: "Your session could not be renewed. Please sign in again.",
    field: "form",
  },
  // Phase 3 — profile & avatar.
  FORBIDDEN: {
    message: "You may only manage your own profile.",
    field: "form",
  },
  NO_UPDATE_FIELDS: {
    message: "Change at least one field before saving.",
    field: "form",
  },
  PROFILE_UPDATE_FAILED: {
    message: "We could not save your profile just now. Please try again.",
    field: "form",
  },
  AVATAR_REQUIRED: {
    message: "Choose an image to upload.",
    field: "form",
  },
  UNSUPPORTED_FILE_TYPE: {
    message: "Choose a JPEG, PNG, GIF or WebP image.",
    field: "form",
  },
  INVALID_IMAGE: {
    message:
      "That image could not be used. Choose a JPEG, PNG, GIF or WebP image between 100x100 and 2048x2048 pixels.",
    field: "form",
  },
  INVALID_UPLOAD: {
    message: "The upload was rejected. Please try again.",
    field: "form",
  },
  AVATAR_TOO_LARGE: {
    message: "Image must be 5 MB or smaller.",
    field: "form",
  },
  AVATAR_UPLOAD_FAILED: {
    message: "We could not update your photo just now. Please try again.",
    field: "form",
  },
  UPLOAD_FAILED: {
    message: "We could not store your photo just now. Please try again.",
    field: "form",
  },
  [CLIENT_ERROR.AUTHENTICATION_EXPIRED]: {
    message: "Your session has expired. Please sign in again.",
    field: "form",
  },
  [CLIENT_ERROR.TOO_MANY_REQUESTS]: {
    message: "Too many attempts. Please wait a few minutes and try again.",
    field: "form",
  },
  [CLIENT_ERROR.UNEXPECTED_ERROR]: {
    message: "Something went wrong. Please try again.",
    field: "form",
  },
};

const FALLBACK: FieldError = {
  message: "Something went wrong. Please try again.",
  field: "form",
};

/**
 * Resolves a backend error code to a message plus the field it belongs to.
 * Unknown codes fall back to the server's own message when one was supplied.
 */
export function resolveFieldError(code: string, fallbackMessage?: string): FieldError {
  const known = FIELD_ERRORS[code];

  if (known !== undefined) {
    return known;
  }

  if (fallbackMessage !== undefined && fallbackMessage.length > 0) {
    return { message: fallbackMessage, field: "form" };
  }

  return FALLBACK;
}

/** Resolves anything thrown by the API layer into a message plus field. */
export function resolveUnknownError(error: unknown): FieldError {
  if (error instanceof ApiError) {
    return resolveFieldError(error.code, error.message);
  }

  if (error instanceof Error && error.message.length > 0) {
    return { message: error.message, field: "form" };
  }

  return FALLBACK;
}
