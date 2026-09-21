"use client";

import { useRouter } from "next/navigation";
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
  buildForgotPasswordPayload,
  forgotPasswordSchema,
  readValue,
  validateEmail,
} from "@/lib/validation";

/** How long the confirmation stays up before moving to the code screen. */
const REDIRECT_DELAY_MS = 1200;

const INITIAL_VALUES: AuthFormValues = {
  identifier: "",
};

function validateForgotField(name: string, value: string): string {
  return name === "identifier" ? validateEmail(value).error : "";
}

function validateForgotForm(values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const parsed = forgotPasswordSchema.safeParse({
    identifier: readValue(values, "identifier"),
    purpose: "PASSWORD_RESET",
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];

      if (typeof key === "string" && key !== "purpose" && errors[key] === undefined) {
        errors[key] = issue.message;
      }
    }
  }

  return errors;
}

/** Step 1 of the reset flow: collect the email that should receive a code. */
export function ForgotPasswordForm(): ReactElement {
  const router = useRouter();
  const [isSent, setIsSent] = useState(false);

  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validateField: validateForgotField,
    validateAll: validateForgotForm,
  });

  const handleValid = async (values: AuthFormValues): Promise<void> => {
    const payload = buildForgotPasswordPayload(values);

    await request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setIsSent(true);
    // The backend answers identically whether or not the address exists, so the
    // copy stays neutral rather than promising a message that may never arrive.
    toast.success("If that email is registered, a code is on its way.");

    window.setTimeout((): void => {
      router.push(`/forgot-password/sent?identifier=${encodeURIComponent(payload.identifier)}`);
    }, REDIRECT_DELAY_MS);
  };

  const formError = form.errors[FORM_ERROR_KEY];
  const isBusy = form.isSubmitting || isSent;

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a verification code."
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          Remembered it? <AuthLink href="/login">Back to log in</AuthLink>
        </>
      }
    >
      {isSent ? <FormSuccess message="Sending your verification code..." /> : null}

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        <FormField
          id="identifier"
          name="identifier"
          label="Email address"
          type="email"
          inputMode="email"
          value={readValue(form.fields, "identifier")}
          error={form.errors["identifier"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={isBusy}
        />

        <SubmitButton label="Send Code" loadingLabel="Sending code" isSubmitting={isBusy} />
      </form>
    </AuthCard>
  );
}
