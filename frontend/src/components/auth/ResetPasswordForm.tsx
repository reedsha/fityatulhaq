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
    toast.success("Password updated. Taking you to log in...");

    window.setTimeout((): void => {
      router.push("/login");
    }, REDIRECT_DELAY_MS);
  };

  const formError = form.errors[FORM_ERROR_KEY];
  const isBusy = form.isSubmitting || isReset;

  if (!identifierIsValid) {
    return (
      <AuthCard
        title="Create a new password"
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
      title="Create a new password"
      subtitle={`Setting a new password for ${identifier}.`}
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          Remembered your password? <AuthLink href="/login">Back to log in</AuthLink>
        </>
      }
    >
      {isReset ? (
        <FormSuccess message="Password updated. Taking you to log in..." />
      ) : null}

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        <FormField
          id="code"
          name="code"
          label="Verification code"
          type="text"
          inputMode="numeric"
          maxLength={OTP_CODE_LENGTH}
          value={readValue(form.fields, "code")}
          error={form.errors["code"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="one-time-code"
          placeholder="123456"
          hint={`The ${OTP_CODE_LENGTH}-digit code from your email.`}
          required
          disabled={isBusy}
        />

        <FormField
          id="newPassword"
          name="newPassword"
          label="New password"
          type="password"
          value={readValue(form.fields, "newPassword")}
          error={form.errors["newPassword"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          required
          disabled={isBusy}
        />

        <FormField
          id={CONFIRM_FIELD}
          name={CONFIRM_FIELD}
          label="Confirm new password"
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
          label="Reset Password"
          loadingLabel="Resetting password"
          isSubmitting={isBusy}
        />
      </form>
    </AuthCard>
  );
}
