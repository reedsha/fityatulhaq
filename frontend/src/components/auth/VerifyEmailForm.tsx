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

      toast.success("A new verification code is on its way.");
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
    toast.success("Email verified.");

    window.setTimeout((): void => {
      router.push("/dashboard");
    }, REDIRECT_DELAY_MS);
  };

  const formError = form.errors[FORM_ERROR_KEY];
  const isBusy = form.isSubmitting || isVerified;

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        identifierIsValid
          ? `Enter the code we sent to ${identifier}.`
          : "Enter the code we sent to your email address."
      }
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          Wrong account? <AuthLink href="/login">Back to log in</AuthLink>
        </>
      }
    >
      {isVerified ? (
        <FormSuccess message="Email verified. Taking you to your dashboard..." />
      ) : (
        <FormSuccess message="Account created. One last step to unlock everything." />
      )}

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
          disabled={isBusy}
        />

        <SubmitButton
          label="Verify Code"
          loadingLabel="Verifying code"
          isSubmitting={isBusy}
        />
      </form>

      <p className="mt-5 text-center text-body-sm text-ink-600">
        <AuthLink href="/dashboard">Continue to your dashboard</AuthLink>
      </p>
    </AuthCard>
  );
}
