"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactElement } from "react";
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

/** How long the success message stays up before the dashboard redirect. */
const REDIRECT_DELAY_MS = 1200;

/**
 * The account already exists at this point and its tokens are stored, but
 * `emailVerifiedAt` is still null until the emailed code is redeemed.
 *
 * Redemption goes through `POST /auth/verify-email`, which consumes the code in
 * the same transaction that stamps the account. A code is single-use, so this
 * screen can only ever succeed once per emailed code.
 */
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

export function VerifyEmailForm(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const identifier = sanitizeText(searchParams.get("identifier") ?? "").toLowerCase();
  const identifierIsValid = validateEmail(identifier).valid;

  const [isVerified, setIsVerified] = useState(false);

  const form = useAuthForm({
    initialValues: { code: "" },
    validateField: validateCodeField,
    validateAll: validateCodeForm,
  });

  const handleResend = async (): Promise<void> => {
    try {
      await request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier, purpose: "EMAIL_VERIFICATION" }),
      });

      toast.success("รหัสยืนยันใหม่กำลังส่งไปหาคุณ");
    } catch (error: unknown) {
      toast.error(resolveUnknownError(error).message);
    }
  };

  const handleValid = async (values: AuthFormValues): Promise<void> => {
    const code = sanitizeText(readValue(values, "code"));

    await request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ identifier, code }),
    });

    setIsVerified(true);
    toast.success("ยืนยันอีเมลแล้ว");

    window.setTimeout((): void => {
      router.push("/");
    }, REDIRECT_DELAY_MS);
  };

  const formError = form.errors[FORM_ERROR_KEY];
  const isBusy = form.isSubmitting || isVerified;

  return (
    <AuthCard
      title="ยืนยันอีเมลของคุณ"
      subtitle={
        identifierIsValid
          ? `กรอกรหัสที่เราส่งไปที่ ${identifier}`
          : "กรอกรหัสที่เราส่งไปทางอีเมลของคุณ"
      }
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          บัญชีไม่ถูกต้อง? <AuthLink href="/login">กลับไปเข้าสู่ระบบ</AuthLink>
        </>
      }
    >
      {isVerified ? (
        <FormSuccess message="ยืนยันอีเมลแล้ว กำลังพาคุณไปยังหน้าแรก..." />
      ) : (
        <FormSuccess message="สร้างบัญชีแล้ว เหลืออีกหนึ่งขั้นตอนเพื่อเปิดใช้งานเต็มรูปแบบ" />
      )}

      {identifierIsValid ? null : (
        <FormBanner message="ไม่พบอีเมลของบัญชีนี้ กรุณาสมัครสมาชิกใหม่หรือเข้าสู่ระบบ" />
      )}

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-5">
        <OtpVerification
          value={readValue(form.fields, "code")}
          error={form.errors["code"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          onResend={handleResend}
          disabled={isBusy}
        />

        <SubmitButton
          label="ยืนยันรหัส"
          loadingLabel="กำลังยืนยันรหัส"
          isSubmitting={isBusy}
        />
      </form>

      <p className="mt-5 text-center text-body-sm text-ink-600">
        <AuthLink href="/">ไปยังหน้าแรก</AuthLink>
      </p>
    </AuthCard>
  );
}
