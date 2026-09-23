"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import toast from "react-hot-toast";

import { AuthCard, AuthLink, FormBanner, FormSuccess } from "@/components/auth/AuthCard";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  FORM_ERROR_KEY,
  useAuthForm,
  type AuthFormErrors,
  type AuthFormValues,
} from "@/hooks/useAuthForm";
import { request } from "@/lib/api";
import { resolveUnknownError } from "@/lib/errorMessages";
import { readValue, sanitizeText, validateEmail, validateOtpCode } from "@/lib/validation";

const INITIAL_VALUES: AuthFormValues = {
  code: "",
};

function validateCodeField(name: string, value: string): string {
  return name === "code" ? validateOtpCode(value).error : "";
}

function validateCodeForm(values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const result = validateOtpCode(readValue(values, "code"));

  if (!result.valid) {
    errors["code"] = result.error;
  }

  return errors;
}

/**
 * Step 2 of the reset flow.
 *
 * There is no "verify OTP" endpoint in Phase 1 — `POST /auth/reset-password`
 * validates the code itself. So this step confirms the code is well-formed and
 * hands it to the reset screen, which is where a wrong or expired code is
 * actually rejected (and reported inline against the code field).
 */
export function VerifyResetCodeForm(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const identifier = sanitizeText(searchParams.get("identifier") ?? "").toLowerCase();
  const identifierIsValid = validateEmail(identifier).valid;

  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validateField: validateCodeField,
    validateAll: validateCodeForm,
  });

  const handleResend = async (): Promise<void> => {
    try {
      await request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier, purpose: "PASSWORD_RESET" }),
      });

      toast.success("รหัสใหม่กำลังส่งไปหาคุณ");
    } catch (error: unknown) {
      toast.error(resolveUnknownError(error).message);
    }
  };

  const handleValid = async (values: AuthFormValues): Promise<void> => {
    const code = sanitizeText(readValue(values, "code"));

    toast.success("กรอกรหัสแล้ว เลือกรหัสผ่านใหม่ของคุณ");

    const query = `identifier=${encodeURIComponent(identifier)}&code=${encodeURIComponent(code)}`;

    router.push(`/reset-password?${query}`);
  };

  const formError = form.errors[FORM_ERROR_KEY];

  if (!identifierIsValid) {
    return (
      <AuthCard
        title="รีเซ็ตรหัสผ่าน"
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
      title="กรอกรหัสยืนยัน"
      subtitle={`เราส่งรหัสยืนยัน 6 หลักไปที่ ${identifier}`}
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          จำรหัสผ่านได้แล้ว? <AuthLink href="/login">กลับไปเข้าสู่ระบบ</AuthLink>
        </>
      }
    >
      <FormSuccess message="ตรวจสอบกล่องจดหมายและโฟลเดอร์สแปมเพื่อหารหัส" />

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-5">
        <OtpVerification
          value={readValue(form.fields, "code")}
          error={form.errors["code"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          onResend={handleResend}
          disabled={form.isSubmitting}
        />

        <SubmitButton
          label="ยืนยันรหัส"
          loadingLabel="กำลังยืนยันรหัส"
          isSubmitting={form.isSubmitting}
        />
      </form>
    </AuthCard>
  );
}
