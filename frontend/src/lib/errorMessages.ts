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
    message: "อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว",
    field: "email",
  },
  USERNAME_ALREADY_EXISTS: {
    message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว",
    field: "username",
  },
  WEAK_PASSWORD: {
    message: `รหัสผ่านต้องมีความยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`,
    field: "password",
  },
  INVALID_BIRTH_DATE: {
    message: "กรุณากรอกวันเกิดให้ถูกต้อง",
    field: "birthDate",
  },
  DUPLICATE_RECORD: {
    message: "มีบัญชีที่ใช้ข้อมูลเหล่านี้อยู่แล้ว",
    field: "form",
  },
  INVALID_CREDENTIALS: {
    // One message for both failure modes: never reveal which part was wrong.
    message: "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
    field: "form",
  },
  USER_NOT_FOUND: {
    message: "ไม่พบบัญชีที่ใช้อีเมลนี้",
    field: "email",
  },
  OTP_NOT_FOUND: {
    message: "ไม่พบคำขอรีเซ็ตรหัสผ่านสำหรับอีเมลนี้ กรุณาขอรหัสใหม่",
    field: "code",
  },
  OTP_EXPIRED: {
    message: "รหัสนี้หมดอายุแล้ว กรุณาขอรหัสใหม่",
    field: "code",
  },
  OTP_ALREADY_CONSUMED: {
    message: "รหัสนี้ถูกใช้ไปแล้ว กรุณาขอรหัสใหม่",
    field: "code",
  },
  OTP_ATTEMPTS_EXCEEDED: {
    message: "กรอกรหัสผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่",
    field: "code",
  },
  INVALID_OTP: {
    message: "รหัสไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง",
    field: "code",
  },
  VALIDATION_ERROR: {
    message: "ข้อมูลบางส่วนไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง",
    field: "form",
  },
  TOKEN_EXPIRED: {
    message: "เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
    field: "form",
  },
  TOKEN_REVOKED: {
    message: "เซสชันของคุณสิ้นสุดแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
    field: "form",
  },
  ROUTE_NOT_FOUND: {
    message: "ฟีเจอร์นี้ยังไม่เปิดใช้งาน",
    field: "form",
  },
  INTERNAL_ERROR: {
    message: "เซิร์ฟเวอร์ขัดข้องชั่วคราว กรุณาลองอีกครั้งในภายหลัง",
    field: "form",
  },
  UNAUTHORIZED: {
    message: "เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
    field: "form",
  },
  // Wrapper codes the service layer attaches when an operation fails outright:
  // the account may still be fine, so these read as "try again", never as
  // "what you typed is wrong".
  REGISTRATION_FAILED: {
    message: "สร้างบัญชีไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "form",
  },
  LOGIN_FAILED: {
    message: "เข้าสู่ระบบไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "form",
  },
  OTP_REQUEST_FAILED: {
    message: "ส่งรหัสไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "identifier",
  },
  PASSWORD_RESET_FAILED: {
    message: "รีเซ็ตรหัสผ่านไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "form",
  },
  PROFILE_LOOKUP_FAILED: {
    message: "โหลดบัญชีของคุณไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "form",
  },
  TOKEN_REFRESH_FAILED: {
    message: "ต่ออายุเซสชันไม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง",
    field: "form",
  },
  // Phase 3 — profile & avatar.
  FORBIDDEN: {
    message: "คุณสามารถจัดการโปรไฟล์ของตัวเองได้เท่านั้น",
    field: "form",
  },
  NO_UPDATE_FIELDS: {
    message: "กรุณาแก้ไขอย่างน้อยหนึ่งฟิลด์ก่อนบันทึก",
    field: "form",
  },
  PROFILE_UPDATE_FAILED: {
    message: "บันทึกโปรไฟล์ไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "form",
  },
  AVATAR_REQUIRED: {
    message: "กรุณาเลือกรูปภาพที่ต้องการอัปโหลด",
    field: "form",
  },
  UNSUPPORTED_FILE_TYPE: {
    message: "กรุณาเลือกไฟล์รูปภาพนามสกุล JPEG, PNG, GIF หรือ WebP",
    field: "form",
  },
  INVALID_IMAGE: {
    message:
      "ใช้รูปภาพนี้ไม่ได้ กรุณาเลือกไฟล์ JPEG, PNG, GIF หรือ WebP ขนาดระหว่าง 100x100 ถึง 2048x2048 พิกเซล",
    field: "form",
  },
  INVALID_UPLOAD: {
    message: "การอัปโหลดถูกปฏิเสธ กรุณาลองอีกครั้ง",
    field: "form",
  },
  AVATAR_TOO_LARGE: {
    message: "รูปภาพต้องมีขนาดไม่เกิน 5 MB",
    field: "form",
  },
  AVATAR_UPLOAD_FAILED: {
    message: "อัปเดตรูปภาพไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "form",
  },
  UPLOAD_FAILED: {
    message: "จัดเก็บรูปภาพไม่สำเร็จในขณะนี้ กรุณาลองอีกครั้ง",
    field: "form",
  },
  [CLIENT_ERROR.AUTHENTICATION_EXPIRED]: {
    message: "เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
    field: "form",
  },
  [CLIENT_ERROR.TOO_MANY_REQUESTS]: {
    message: "พยายามหลายครั้งเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง",
    field: "form",
  },
  [CLIENT_ERROR.UNEXPECTED_ERROR]: {
    message: "เกิดข้อผิดพลาดบางอย่าง กรุณาลองอีกครั้ง",
    field: "form",
  },
};

const FALLBACK: FieldError = {
  message: "เกิดข้อผิดพลาดบางอย่าง กรุณาลองอีกครั้ง",
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
