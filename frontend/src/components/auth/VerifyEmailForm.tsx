"use client";

import { useSearchParams } from "next/navigation";
import { useState, type ReactElement } from "react";
import toast from "react-hot-toast";

import { AuthCard, AuthLink, FormBanner, FormSuccess } from "@/components/auth/AuthCard";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  useAuthForm,
  type AuthFormErrors,
  type AuthFormValues,
} from "@/hooks/useAuthForm";
import { request } from "@/lib/api";
import { resolveUnknownError } from "@/lib/errorMessages";
import { readValue, sanitizeText, validateEmail, validateOtpCode } from "@/lib/validation";

/**
 * The account already exists at this point and its tokens are stored, but
 * `emailVerifiedAt` is still null until the emailed code is redeemed.
 *
 * TODO: wire this form to a `POST /auth/verify-email` endpoint. The backend
 * currently issues the EMAIL_VERIFICATION code but has no route that consumes
 * it, so redeeming is unavailable and the screen offers the dashboard instead.
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
  const searchParams = useSearchParams();

  const identifier = sanitizeText(searchParams.get("identifier") ?? "").toLowerCase();
  const identifierIsValid = validateEmail(identifier).valid;

  const [notice, setNotice] = useState<string | null>(null);

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

      toast.success("A new verification code is on its way.");
    } catch (error: unknown) {
      toast.error(resolveUnknownError(error).message);
    }
  };

  const handleValid = (): Promise<void> => {
    setNotice(
      "Code entry is ready, but email verification is not switched on yet in this phase. You can continue to your dashboard and verify later.",
    );

    return Promise.resolve();
  };

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        identifierIsValid
          ? `Enter the code we sent to ${identifier}.`
          : "Enter the code we sent to your email address."
      }
      footer={
        <>
          Wrong account? <AuthLink href="/login">Back to log in</AuthLink>
        </>
      }
    >
      <FormSuccess message="Account created. One last step to unlock everything." />

      {notice !== null ? (
        <div
          role="status"
          className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          {notice}
        </div>
      ) : null}

      {identifierIsValid ? null : (
        <FormBanner message="We could not read the email address for this account. Please register again or log in." />
      )}

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
          label="Verify Code"
          loadingLabel="Verifying code"
          isSubmitting={form.isSubmitting}
        />
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        <AuthLink href="/dashboard">Continue to your dashboard</AuthLink>
      </p>
    </AuthCard>
  );
}
