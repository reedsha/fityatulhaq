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

      toast.success("A new code is on its way.");
    } catch (error: unknown) {
      toast.error(resolveUnknownError(error).message);
    }
  };

  const handleValid = async (values: AuthFormValues): Promise<void> => {
    const code = sanitizeText(readValue(values, "code"));

    toast.success("Code entered. Choose your new password.");

    const query = `identifier=${encodeURIComponent(identifier)}&code=${encodeURIComponent(code)}`;

    router.push(`/reset-password?${query}`);
  };

  const formError = form.errors[FORM_ERROR_KEY];

  if (!identifierIsValid) {
    return (
      <AuthCard
        title="Reset your password"
        subtitle="We need the email address the code was sent to."
        banner={<FormBanner message="This link is missing a valid email address." />}
        footer={
          <>
            Start again? <AuthLink href="/forgot-password">Request a new code</AuthLink>
          </>
        }
      >
        <p className="text-body-sm text-ink-600">
          Request a new verification code and we will take you straight to the next step.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Enter your code"
      subtitle={`We sent a 6-digit verification code to ${identifier}.`}
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          Remembered your password? <AuthLink href="/login">Back to log in</AuthLink>
        </>
      }
    >
      <FormSuccess message="Check your inbox and spam folder for the code." />

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
    </AuthCard>
  );
}
