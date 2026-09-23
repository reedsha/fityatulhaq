"use client";

import { useState, type ReactElement } from "react";
import toast from "react-hot-toast";

import {
  AuthCard,
  AuthCardFallback,
  AuthLink,
  FormBanner,
  FormSuccess,
} from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import {
  FORM_ERROR_KEY,
  useAuthForm,
  type AuthFormErrors,
  type AuthFormValues,
} from "@/hooks/useAuthForm";
import { resolveUnknownError, type AuthFormField } from "@/lib/errorMessages";
import { updateProfile } from "@/lib/profileApi";
import {
  readValue,
  sanitizeText,
  validateBirthDate,
  validateFullName,
  validatePhone,
} from "@/lib/validation";

/** Fields the profile form renders inline; anything else becomes a banner. */
const INLINE_FIELDS: ReadonlySet<AuthFormField> = new Set<AuthFormField>([
  "fullName",
  "phone",
  "birthDate",
  "form",
]);

/** A `datetime` is trimmed to the `YYYY-MM-DD` an `<input type="date">` expects. */
function toDateInputValue(birthDate: string | null | undefined): string {
  if (birthDate === null || birthDate === undefined) {
    return "";
  }

  return birthDate.slice(0, 10);
}

function validateProfileField(name: string, value: string): string {
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

function validateProfile(values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const fullName = validateFullName(readValue(values, "fullName"));
  const phone = validatePhone(readValue(values, "phone"));
  const birthDate = validateBirthDate(readValue(values, "birthDate"));

  if (!fullName.valid) {
    errors["fullName"] = fullName.error;
  }

  if (!phone.valid) {
    errors["phone"] = phone.error;
  }

  if (!birthDate.valid) {
    errors["birthDate"] = birthDate.error;
  }

  return errors;
}

interface ReadOnlyRowProps {
  label: string;
  value: string;
}

function ReadOnlyRow({ label, value }: ReadOnlyRowProps): ReactElement {
  return (
    <div className="border-b border-ink-100 py-3 last:border-b-0">
      <dt className="text-caption font-medium uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 break-words text-body-sm text-ink-900">{value}</dd>
    </div>
  );
}

export interface ProfileFormProps {
  user: AuthUser;
  onRefresh: () => Promise<AuthUser | null>;
}

/**
 * Editable profile form.
 *
 * Mounted only once the profile is known, so the fields are initialised from
 * real values rather than being patched in afterwards — `useAuthForm` takes its
 * initial state once and is not designed to be re-hydrated.
 */
function ProfileForm({ user, onRefresh }: ProfileFormProps): ReactElement {
  const form = useAuthForm({
    initialValues: {
      fullName: user.fullName,
      phone: user.phone ?? "",
      birthDate: toDateInputValue(user.birthDate),
    },
    validateField: validateProfileField,
    validateAll: validateProfile,
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (name: string, value: string): void => {
    setIsSaved(false);
    form.setField(name, value);
  };

  const handleSave = async (values: AuthFormValues): Promise<void> => {
    const payload = {
      fullName: sanitizeText(readValue(values, "fullName")),
      phone: sanitizeText(readValue(values, "phone")),
      birthDate: readValue(values, "birthDate").trim(),
    };

    try {
      await updateProfile(user.id, payload);

      // Mirror the sanitised values back into the form so what is displayed is
      // exactly what was stored, then reload the session profile.
      form.setField("fullName", payload.fullName);
      form.setField("phone", payload.phone);
      form.setField("birthDate", payload.birthDate);

      try {
        await onRefresh();
      } catch {
        // The save itself succeeded — only the cached profile is stale, and the
        // next navigation re-reads it.
        toast.error("Saved, but we could not refresh your details. Please reload the page.");
      }

      setIsSaved(true);
      toast.success("Your profile has been saved.");
    } catch (error) {
      // Routed by hand rather than via the hook's own handler: an error whose
      // field the form does not render (a read-only column, say) would otherwise
      // be stored against an invisible key and silently disappear.
      const resolved = resolveUnknownError(error);

      if (INLINE_FIELDS.has(resolved.field)) {
        form.setFieldError(resolved.field, resolved.message);
        return;
      }

      form.setFormError(resolved.message);
    }
  };

  const formError = form.errors[FORM_ERROR_KEY];

  return (
    <form
      onSubmit={form.handleSubmit(handleSave)}
      noValidate
      className="flex flex-col gap-5"
    >
      {formError !== undefined && formError.length > 0 ? (
        <FormBanner message={formError} />
      ) : null}

      {isSaved ? <FormSuccess message="Your profile has been saved." /> : null}

      <FormField
        id="profile-full-name"
        name="fullName"
        label="Full Name"
        type="text"
        value={readValue(form.fields, "fullName")}
        onChange={handleChange}
        onBlur={form.handleBlur}
        error={form.errors["fullName"]}
        disabled={form.isSubmitting}
        required
        autoComplete="name"
      />

      <FormField
        id="profile-phone"
        name="phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        value={readValue(form.fields, "phone")}
        onChange={handleChange}
        onBlur={form.handleBlur}
        error={form.errors["phone"]}
        disabled={form.isSubmitting}
        optional
        autoComplete="tel"
      />

      <FormField
        id="profile-birth-date"
        name="birthDate"
        label="Date of Birth"
        type="date"
        value={readValue(form.fields, "birthDate")}
        onChange={handleChange}
        onBlur={form.handleBlur}
        error={form.errors["birthDate"]}
        disabled={form.isSubmitting}
        optional
      />

      <SubmitButton
        label="Save Changes"
        loadingLabel="Saving"
        isSubmitting={form.isSubmitting}
      />
    </form>
  );
}

/**
 * `/profile` — the member's own account screen.
 *
 * Authentication is resolved client-side because the session lives in httpOnly
 * cookies the page cannot inspect. The profile it renders therefore has three
 * states: resolving, signed out, and signed in.
 */
export function ProfilePage(): ReactElement {
  const { user, isLoading, getMe } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen justify-center bg-ink-50 px-4 py-10 sm:px-6">
        <main className="w-full max-w-3xl">
          <AuthCardFallback />
        </main>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex min-h-screen justify-center bg-ink-50 px-4 py-10 sm:px-6">
        <main className="w-full max-w-md">
          <AuthCard
            title="Your Profile"
            subtitle="Please log in to access your profile."
            footer={<AuthLink href="/">Back to the home page</AuthLink>}
          >
            <AuthLink href="/login">Log in to your account</AuthLink>
          </AuthCard>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-ink-50 px-4 py-10 sm:px-6">
      <main className="w-full max-w-3xl">
        <AuthCard
          title="Your Profile"
          subtitle="Update your photo and personal details."
          maxWidthClassName="max-w-3xl"
          footer={<AuthLink href="/">Back to the dashboard</AuthLink>}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Lime panel — the reference's profile sidebar treatment. */}
            <div className="rounded-2xl bg-accent-300 p-6 sm:w-48 sm:shrink-0">
              <AvatarUploader
                userId={user.id}
                fullName={user.fullName}
                avatarUrl={user.avatarUrl}
                onUploaded={async (): Promise<void> => {
                  await getMe();
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <dl className="mb-6">
                <ReadOnlyRow label="Email" value={user.email} />
                <ReadOnlyRow label="Username" value={user.username} />
              </dl>

              <ProfileForm user={user} onRefresh={getMe} />
            </div>
          </div>
        </AuthCard>
      </main>
    </div>
  );
}
