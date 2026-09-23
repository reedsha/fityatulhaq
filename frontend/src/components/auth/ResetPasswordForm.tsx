"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactElement } from "react";
import toast from "react-hot-toast";

import { AuthCard, AuthLink, FormBanner, FormSuccess } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  FORM_ERROR_KEY,
  useAuthForm,
  type AuthFormErrors,
  type AuthFormValues,
} from "@/hooks/useAuthForm";
import { request } from "@/lib/api";
import {
  MIN_PASSWORD_LENGTH,
  OTP_CODE_LENGTH,
  buildResetPasswordPayload,
  readValue,
  resetPasswordSchema,
  sanitizeText,
  validateConfirmPassword,
  validateEmail,
  validateOtpCode,
  validatePassword,
} from "@/lib/validation";

/** Time the success message stays up before the login redirect. */
const REDIRECT_DELAY_MS = 3000;

const CONFIRM_FIELD = "confirmNewPassword";

function validateResetField(
  name: string,
  value: string,
  values: AuthFormValues,
): string {
  if (name === "code") {
    return validateOtpCode(value).error;
  }

  if (name === "newPassword") {
    return validatePassword(value).error;
  }

  if (name === CONFIRM_FIELD) {
    return validateConfirmPassword(readValue(values, "newPassword"), value).error;
  }

  return "";
}

function validateResetForm(identifier: string) {
  return (values: AuthFormValues): AuthFormErrors => {
    const errors: AuthFormErrors = {};

    const parsed = resetPasswordSchema.safeParse({
      identifier,
      code: sanitizeText(readValue(values, "code")),
      newPassword: readValue(values, "newPassword"),
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];

        if (typeof key === "string" && errors[key] === undefined) {
          errors[key] = issue.message;
        }
      }
    }

    const confirmError = validateConfirmPassword(
      readValue(values, "newPassword"),
      readValue(values, CONFIRM_FIELD),
    ).error;

    if (confirmError.length > 0) {
      errors[CONFIRM_FIELD] = confirmError;
    }

    return errors;
  };
}

/** Final step of the reset flow: the code plus the new password. */
export function ResetPasswordForm(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const identifier = sanitizeText(searchParams.get("identifier") ?? "").toLowerCase();
  const identifierIsValid = validateEmail(identifier).valid;

  const [isReset, setIsReset] = useState(false);

  const form = useAuthForm({
    initialValues: {
      code: sanitizeText(searchParams.get("code") ?? ""),
      newPassword: "",
      [CONFIRM_FIELD]: "",
    },
    validateField: validateResetField,
    validateAll: validateResetForm(identifier),
  });

  const handleValid = async (values: AuthFormValues): Promise<void> => {
    await request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(buildResetPasswordPayload(identifier, values)),
    });

    setIsReset(true);
    toast.success("อัปเดตรหัสผ่านแล้ว กำลังพาไปเข้าสู่ระบบ...");

    window.setTimeout((): void => {
      router.push("/login");
    }, REDIRECT_DELAY_MS);
  };

  const formError = form.errors[FORM_ERROR_KEY];
  const isBusy = form.isSubmitting || isReset;

  if (!identifierIsValid) {
    return (
      <AuthCard
        title="ตั้งรหัสผ่านใหม่"
        subtitle="เราต้องการอีเมลที่รหัสยืนยันถูกส่งไป"
        banner={<FormBanner message="ลิงก์นี้ไม่มีอีเมลที่ถูกต้อง" />}
        footer={
          <>
            เริ่มใหม่? <AuthLink href="/forgot-password">ขอรหัสใหม่</AuthLink>
          </>
        }
      >
        <p className="text-body-sm text-ink-600">
          ขอรหัสยืนยันใหม่ แล้วเราจะพาคุณไปยังขั้นตอนถัดไป
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="ตั้งรหัสผ่านใหม่"
      subtitle={`กำลังตั้งรหัสผ่านใหม่สำหรับ ${identifier}`}
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          จำรหัสผ่านได้แล้ว? <AuthLink href="/login">กลับไปเข้าสู่ระบบ</AuthLink>
        </>
      }
    >
      {isReset ? (
        <FormSuccess message="อัปเดตรหัสผ่านแล้ว กำลังพาไปเข้าสู่ระบบ..." />
      ) : null}

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        <FormField
          id="code"
          name="code"
          label="รหัสยืนยัน"
          type="text"
          inputMode="numeric"
          maxLength={OTP_CODE_LENGTH}
          value={readValue(form.fields, "code")}
          error={form.errors["code"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="one-time-code"
          placeholder="123456"
          hint={`รหัส ${OTP_CODE_LENGTH} หลักจากอีเมลของคุณ`}
          required
          disabled={isBusy}
        />

        <FormField
          id="newPassword"
          name="newPassword"
          label="รหัสผ่านใหม่"
          type="password"
          value={readValue(form.fields, "newPassword")}
          error={form.errors["newPassword"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="new-password"
          hint={`อย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`}
          required
          disabled={isBusy}
        />

        <FormField
          id={CONFIRM_FIELD}
          name={CONFIRM_FIELD}
          label="ยืนยันรหัสผ่านใหม่"
          type="password"
          value={readValue(form.fields, CONFIRM_FIELD)}
          error={form.errors[CONFIRM_FIELD]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="new-password"
          required
          disabled={isBusy}
        />

        <SubmitButton
          label="รีเซ็ตรหัสผ่าน"
          loadingLabel="กำลังรีเซ็ตรหัสผ่าน"
          isSubmitting={isBusy}
        />
      </form>
    </AuthCard>
  );
}
