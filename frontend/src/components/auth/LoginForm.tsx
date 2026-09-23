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
import { isSafeInternalPath } from "@/lib/memberGate";

/** How long the welcome message stays up before the post-login redirect. */
const REDIRECT_DELAY_MS = 1000;

const REMEMBER_FIELD = "rememberMe";

const INITIAL_VALUES: AuthFormValues = {
  identifier: "",
  password: "",
  [REMEMBER_FIELD]: "true",
};

function validateLoginField(name: string, value: string): string {
  if (name === "identifier") {
    return value.trim().length === 0 ? "กรอกอีเมลหรือชื่อผู้ใช้" : "";
  }

  if (name === "password") {
    return value.length === 0 ? "กรอกรหัสผ่าน" : "";
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

/**
 * Resolves the post-login destination from the `?next=` query parameter.
 *
 * Read at submit time through `window.location` rather than through
 * `useSearchParams` at render time: `/login` builds as a static route, and a
 * render-time hook would force a Suspense CSR bailout that fails the build.
 * The three safety rules live in `isSafeInternalPath` (@/lib/memberGate) so the
 * member-action gates share one implementation.
 */
function resolvePostLoginTarget(): string {
  const raw = new URLSearchParams(window.location.search).get("next") ?? "";

  if (isSafeInternalPath(raw)) {
    return raw;
  }

  return "/";
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
      toast.success("เข้าสู่ระบบแล้ว กรุณายืนยันอีเมลเพื่อเปิดใช้งานบัญชี");

      return;
    }

    setIsRedirecting(true);
    toast.success(`ยินดีต้อนรับกลับ, ${result.user.fullName}`);

    window.setTimeout((): void => {
      router.push(resolvePostLoginTarget());
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
        title="ยืนยันอีเมลของคุณ"
        subtitle="บัญชีของคุณถูกสร้างแล้ว แต่ยังไม่ได้ยืนยันอีเมล"
        footer={
          <>
            บัญชีไม่ถูกต้อง? <AuthLink href="/login">เริ่มใหม่</AuthLink>
          </>
        }
      >
        <FormSuccess message="เข้าสู่ระบบสำเร็จ ยืนยันอีเมลเพื่อเปิดใช้งานเต็มรูปแบบ" />

        <p className="text-body-sm text-ink-600">
          เราส่งรหัสยืนยันไปที่ <span className="font-medium">{unverifiedEmail}</span>
        </p>

        <p className="mt-4 text-body-sm">
          <AuthLink
            href={`/register/success?identifier=${encodeURIComponent(unverifiedEmail)}`}
          >
            กรอกรหัสยืนยัน
          </AuthLink>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="ยินดีต้อนรับกลับ"
      subtitle="เข้าสู่ระบบเพื่อจัดการโปรไฟล์ ประกาศ และกิจกรรมชุมชนของคุณ"
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          ยังไม่มีบัญชี? <AuthLink href="/register">สมัครสมาชิก</AuthLink>
        </>
      }
    >
      {isRedirecting ? <FormSuccess message="เข้าสู่ระบบแล้ว กำลังพาคุณไปยังหน้าที่ค้างไว้..." /> : null}

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        <FormField
          id="identifier"
          name="identifier"
          label="อีเมลหรือชื่อผู้ใช้"
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
          label="รหัสผ่าน"
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
            จดจำฉัน
          </label>

          <AuthLink href="/forgot-password">ลืมรหัสผ่าน?</AuthLink>
        </div>

        {/*
          Phase 1: the session length is fixed server-side by
          JWT_REFRESH_TOKEN_EXPIRY, so this checkbox is presentational only.
          TODO: issue a shorter-lived refresh token when "Remember me" is off.
        */}

        <SubmitButton label="เข้าสู่ระบบ" loadingLabel="กำลังเข้าสู่ระบบ" isSubmitting={isBusy} />
      </form>
    </AuthCard>
  );
}
