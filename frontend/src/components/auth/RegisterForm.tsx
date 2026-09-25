"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type ReactElement } from "react";
import toast from "react-hot-toast";

import {
  AuthCard,
  AuthLink,
  FormBanner,
  FormSuccess,
} from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { useAuth } from "@/context/AuthContext";
import {
  FORM_ERROR_KEY,
  useAuthForm,
  type AuthFormErrors,
  type AuthFormValues,
} from "@/hooks/useAuthForm";
import {
  buildRegisterPayload,
  readValue,
  registerSchema,
  validateBirthDate,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
  validateTermsAccepted,
  validateUsername,
} from "@/lib/validation";

/** How long the success message stays up before the dashboard redirect. */
const REDIRECT_DELAY_MS = 2000;

const TERMS_FIELD = "termsAccepted";

const INITIAL_VALUES: AuthFormValues = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  phone: "",
  birthDate: "",
  [TERMS_FIELD]: "false",
};

/** Per-field check fired on blur. Returns "" when the value is acceptable. */
function validateRegisterField(
  name: string,
  value: string,
  values: AuthFormValues,
): string {
  if (name === "email") {
    return validateEmail(value).error;
  }

  if (name === "username") {
    return validateUsername(value).error;
  }

  if (name === "password") {
    return validatePassword(value).error;
  }

  if (name === "confirmPassword") {
    return validateConfirmPassword(readValue(values, "password"), value).error;
  }

  if (name === "fullName") {
    return validateFullName(value).error;
  }

  if (name === "phone") {
    return validatePhone(value).error;
  }

  if (name === "birthDate") {
    return validateBirthDate(value).error;
  }

  return "";
}

/** Authoritative check run on submit — nothing reaches the API until it passes. */
function validateRegisterForm(values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const parsed = registerSchema.safeParse({
    email: readValue(values, "email"),
    username: readValue(values, "username"),
    password: readValue(values, "password"),
    fullName: readValue(values, "fullName"),
    phone: readValue(values, "phone"),
    birthDate: readValue(values, "birthDate"),
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
    readValue(values, "password"),
    readValue(values, "confirmPassword"),
  ).error;

  if (confirmError.length > 0) {
    errors["confirmPassword"] = confirmError;
  }

  const phoneError = validatePhone(readValue(values, "phone")).error;

  if (phoneError.length > 0) {
    errors["phone"] = phoneError;
  }

  const birthDateError = validateBirthDate(readValue(values, "birthDate")).error;

  if (birthDateError.length > 0) {
    errors["birthDate"] = birthDateError;
  }

  const termsError = validateTermsAccepted(readValue(values, TERMS_FIELD) === "true").error;

  if (termsError.length > 0) {
    errors[TERMS_FIELD] = termsError;
  }

  return errors;
}

export function RegisterForm(): ReactElement {
  const router = useRouter();
  const { register } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validateField: validateRegisterField,
    validateAll: validateRegisterForm,
  });

  const handleValid = async (values: AuthFormValues): Promise<void> => {
    const payload = buildRegisterPayload(values);

    await register(payload);

    setIsRedirecting(true);
    toast.success("สร้างบัญชีแล้ว ตรวจสอบอีเมลเพื่อรับรหัสยืนยัน");

    // The backend issues an EMAIL_VERIFICATION code at registration, so the user
    // is sent to the verification screen rather than straight to the dashboard.
    window.setTimeout((): void => {
      router.push(`/register/success?identifier=${encodeURIComponent(payload.email)}`);
    }, REDIRECT_DELAY_MS);
  };

  const handleTermsChange = (event: ChangeEvent<HTMLInputElement>): void => {
    form.setField(TERMS_FIELD, event.target.checked ? "true" : "false");
  };

  const formError = form.errors[FORM_ERROR_KEY];
  const termsError = form.errors[TERMS_FIELD];
  const isBusy = form.isSubmitting || isRedirecting;

  return (
    <AuthCard
      title="สร้างบัญชีของคุณ"
      subtitle="เข้าร่วม FityatulHaq เพื่อติดตามประกาศ กิจกรรม และข่าวสารชุมชน"
      banner={formError !== undefined ? <FormBanner message={formError} /> : undefined}
      footer={
        <>
          มีบัญชีแล้ว? <AuthLink href="/login">เข้าสู่ระบบ</AuthLink>
        </>
      }
    >
      {isRedirecting ? (
        <FormSuccess message="สร้างบัญชีแล้ว กำลังพาไปยืนยันอีเมล..." />
      ) : null}

      <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        <FormField
          id="fullName"
          name="fullName"
          label="ชื่อ-นามสกุล"
          type="text"
          value={readValue(form.fields, "fullName")}
          error={form.errors["fullName"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="name"
          placeholder="Ahmad bin Abdullah"
          required
          disabled={isBusy}
        />

        <FormField
          id="email"
          name="email"
          label="อีเมล"
          type="email"
          inputMode="email"
          value={readValue(form.fields, "email")}
          error={form.errors["email"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={isBusy}
        />

        <FormField
          id="username"
          name="username"
          label="ชื่อผู้ใช้"
          type="text"
          value={readValue(form.fields, "username")}
          error={form.errors["username"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="username"
          hint="3-30 ตัวอักษร: ตัวอักษร ตัวเลข และขีดล่าง"
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
          autoComplete="new-password"
          hint="อย่างน้อย 8 ตัวอักษร"
          required
          disabled={isBusy}
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          label="ยืนยันรหัสผ่าน"
          type="password"
          value={readValue(form.fields, "confirmPassword")}
          error={form.errors["confirmPassword"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="new-password"
          required
          disabled={isBusy}
        />

        <FormField
          id="phone"
          name="phone"
          label="เบอร์โทรศัพท์"
          type="tel"
          inputMode="tel"
          value={readValue(form.fields, "phone")}
          error={form.errors["phone"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="tel"
          placeholder="+66812345678"
          optional
          disabled={isBusy}
        />

        <FormField
          id="birthDate"
          name="birthDate"
          label="วันเกิด"
          type="date"
          value={readValue(form.fields, "birthDate")}
          error={form.errors["birthDate"]}
          onChange={form.setField}
          onBlur={form.handleBlur}
          autoComplete="bday"
          optional
          disabled={isBusy}
        />

        <div>
          <div className="flex items-start gap-2">
            <input
              id={TERMS_FIELD}
              name={TERMS_FIELD}
              type="checkbox"
              checked={readValue(form.fields, TERMS_FIELD) === "true"}
              onChange={handleTermsChange}
              disabled={isBusy}
              aria-invalid={termsError !== undefined}
              aria-describedby={termsError !== undefined ? `${TERMS_FIELD}-error` : undefined}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-2 focus:ring-brand-300"
            />
            <label htmlFor={TERMS_FIELD} className="text-body-sm text-ink-700">
              ยอมรับ <AuthLink href="/terms">ข้อกำหนดการใช้งาน</AuthLink> และ{" "}
              <AuthLink href="/privacy-policy">นโยบายความเป็นส่วนตัว</AuthLink>
            </label>
          </div>

          {termsError !== undefined ? (
            <p id={`${TERMS_FIELD}-error`} className="mt-1 text-body-sm text-state-error-600">
              {termsError}
            </p>
          ) : null}
        </div>

        <SubmitButton
          label="สร้างบัญชี"
          loadingLabel="กำลังสร้างบัญชี"
          isSubmitting={isBusy}
        />
      </form>
    </AuthCard>
  );
}
