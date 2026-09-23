"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type ReactElement } from "react";
import toast from "react-hot-toast";

import { AuthCard, AuthLink, FormBanner, FormSuccess } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { useAuth } from "@/context/AuthContext";
import {
  FORM_ERROR_KEY,
  useAuthForm,
  type AuthFormErrors,
  type AuthFormValues,
} from "@/hooks/useAuthForm";
import { buildLoginPayload, loginSchema, readValue } from "@/lib/validation";

/** How long the welcome message stays up before the dashboard redirect. */
const REDIRECT_DELAY_MS = 1000;

const REMEMBER_FIELD = "rememberMe";

const INITIAL_VALUES: AuthFormValues = {
  identifier: "",
  password: "",
  [REMEMBER_FIELD]: "true",
};

function validateLoginField(name: string, value: string): string {
  if (name === "identifier") {
    return value.trim().length === 0 ? "Enter your email or username" : "";
  }

  if (name === "password") {
    return value.length === 0 ? "Enter your password" : "";
  }

  return "";
}

function validateLoginForm(values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const parsed = loginSchema.safeParse({
    identifier: readValue(values, "identifier"),
    password: readValue(values, "password"),
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];

      if (typeof key === "string" && errors[key] === undefined) {
        errors[key] = issue.message;
      }
    }
  }

  return errors;
}

export function LoginForm(): ReactElement {
  const router = useRouter();
  const { login } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validateField: validateLoginField,
    validateAll: validateLoginForm,
  });

  const handleValid = async (values: AuthFormValues): Promise<void> => {
    const result = await login(buildLoginPayload(values));

    // The backend flags an account whose email is still unverified. Sending that
    // user to the dashboard would be misleading, so the verification prompt stays.
    if (result.isNew) {
      setUnverifiedEmail(result.user.email);
      toast.success("Signed in. Please verify your email address to finish setup.");

      return;
    }

    setIsRedirecting(true);
    toast.success(`Welcome back, ${result.user.fullName}.`);

    window.setTimeout((): void => {
      router.push("/");
    }, REDIRECT_DELAY_MS);
  };

  const handleRememberChange = (event: ChangeEvent<HTMLInputElement>): void => {
    form.setField(REMEMBER_FIELD, event.target.checked ? "true" : "false");
  };

  const formError = form.errors[FORM_ERROR_KEY];
  const isBusy = form.isSubmitting || isRedirecting;

  if (unverifiedEmail !== null) {
    return (
      <AuthCard
        title="Verify your email"
        subtitle="Your account was created but the email address has not been confirmed yet."
        footer={
          <>
            Wrong account? <AuthLink href="/login">Start over</AuthLink>
          </>
        }
      >
        <FormSuccess message="Sign in succeeded. Verify your email to unlock the dashboard." />

        <p className="text-body-sm text-ink-600">
          We sent a verification code to <span className="font-medium">{unverifiedEmail}</span>.
        </p>

        <p className="mt-4 text-body-sm">
          <AuthLink
            href={`/register/success?identifier=${encodeURIComponent(unverifiedEmail)}`}
          >
            Enter the verification code
          </AuthLink>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage your profile, announcements and community activities."
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          Don&apos;t have an account? <AuthLink href="/register">Register</AuthLink>
        </>
      }
    >
      {isRedirecting ? <FormSuccess message="Signed in. Taking you to your dashboard..." /> : null}

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        <FormField
          id="identifier"
          name="identifier"
          label="Email or username"
          type="text"
          value={readValue(form.fields, "identifier")}
          error={form.errors["identifier"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="username"
          placeholder="you@example.com"
          required
          disabled={isBusy}
        />

        <FormField
          id="password"
          name="password"
          label="Password"
          type="password"
          value={readValue(form.fields, "password")}
          error={form.errors["password"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="current-password"
          required
          disabled={isBusy}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
          <label htmlFor={REMEMBER_FIELD} className="flex items-center gap-2 text-ink-700">
            <input
              id={REMEMBER_FIELD}
              name={REMEMBER_FIELD}
              type="checkbox"
              checked={readValue(form.fields, REMEMBER_FIELD) === "true"}
              onChange={handleRememberChange}
              disabled={isBusy}
              className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-2 focus:ring-brand-300"
            />
            Remember me
          </label>

          <AuthLink href="/forgot-password">Forgot your password?</AuthLink>
        </div>

        {/*
          Phase 1: the session length is fixed server-side by
          JWT_REFRESH_TOKEN_EXPIRY, so this checkbox is presentational only.
          TODO: issue a shorter-lived refresh token when "Remember me" is off.
        */}

        <SubmitButton label="Sign In" loadingLabel="Signing in" isSubmitting={isBusy} />
      </form>
    </AuthCard>
  );
}
