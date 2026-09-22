"use client";

import Link from "next/link";
import {
  CheckCircle2,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useState, type FormEvent, type ReactElement, type ReactNode } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";

/* ====================================================================
   CONTACT — /contact
   ====================================================================

   Visual language: the shared page frame — dark band header, white
   `shadow-card` cards on the `#0c1017` band.

   The form is client-side validation only; there is no contact endpoint
   yet, so a valid submit swaps in a local confirmation panel. The social
   platform list mirrors `Footer.tsx` (kept in sync by hand — Footer is a
   server component whose internals cannot be imported into this client
   module).
   ==================================================================== */

// ---------------------------------------------------------------
// Form state & validation
// ---------------------------------------------------------------

interface ContactFormState {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

type ContactField = keyof ContactFormState;
type ContactErrors = Partial<Record<ContactField, string>>;

const INITIAL_CONTACT_FORM: ContactFormState = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactField(field: ContactField, value: string): string | undefined {
  if (value.trim() === "") {
    return "This field is required.";
  }
  if (field === "email" && !EMAIL_PATTERN.test(value.trim())) {
    return "Enter a valid email address.";
  }
  return undefined;
}

// ---------------------------------------------------------------
// Shared input classes
// ---------------------------------------------------------------

const FIELD_ERROR_CLASSES = "mt-1.5 text-caption text-state-error-600";

function fieldClasses(hasError: boolean): string {
  const base =
    "w-full rounded-lg border bg-white px-4 py-2.5 text-body text-ink-900 placeholder:text-ink-400";
  const invalid = hasError ? "border-state-error-600" : "border-ink-300";

  return `${base} ${invalid} ${FOCUS_RING}`;
}

// ---------------------------------------------------------------
// Contact form card
// ---------------------------------------------------------------

interface FieldProps {
  id: keyof ContactFormState;
  label: string;
  value: string;
  error: string | undefined;
  touched: boolean;
  onChange: (field: ContactField, value: string) => void;
  onBlur: (field: ContactField) => void;
}

function TextField(props: FieldProps): ReactElement {
  const { id, label, value, error, touched, onChange, onBlur } = props;
  const showError = touched && error !== undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-caption font-semibold text-ink-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={id === "email" ? "email" : "text"}
        value={value}
        onChange={(event): void => onChange(id, event.target.value)}
        onBlur={(): void => onBlur(id)}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
        className={`mt-1.5 ${fieldClasses(showError)}`}
      />
      {showError ? (
        <p id={`${id}-error`} className={FIELD_ERROR_CLASSES}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MessageField(props: FieldProps): ReactElement {
  const { id, label, value, error, touched, onChange, onBlur } = props;
  const showError = touched && error !== undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-caption font-semibold text-ink-700">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        rows={5}
        value={value}
        onChange={(event): void => onChange(id, event.target.value)}
        onBlur={(): void => onBlur(id)}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
        className={`mt-1.5 ${fieldClasses(showError)}`}
      />
      {showError ? (
        <p id={`${id}-error`} className={FIELD_ERROR_CLASSES}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ContactForm(): ReactElement {
  const [form, setForm] = useState<ContactFormState>(INITIAL_CONTACT_FORM);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = useCallback(
    (field: ContactField, value: string): void => {
      setForm((current) => ({ ...current, [field]: value }));
      // Re-validate live once the field has been visited.
      setErrors((current) => {
        if (touched[field] !== true) {
          return current;
        }
        return { ...current, [field]: validateContactField(field, value) };
      });
    },
    [touched],
  );

  const handleBlur = useCallback((field: ContactField): void => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: validateContactField(field, form[field]),
    }));
  }, [form]);

  // TODO(api): POST to /api/v1/contact once the endpoint lands.
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();

      const nextErrors: ContactErrors = {};
      for (const field of Object.keys(form) as ContactField[]) {
        const error = validateContactField(field, form[field]);
        if (error !== undefined) {
          nextErrors[field] = error;
        }
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setTouched({ fullName: true, email: true, subject: true, message: true });
        return;
      }

      // No API call — the endpoint does not exist yet. Local success only.
      setSubmitted(true);
    },
    [form],
  );

  const handleReset = useCallback((): void => {
    setForm(INITIAL_CONTACT_FORM);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, []);

  if (submitted) {
    return (
      <article
        aria-label="Message received"
        className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-card sm:p-10"
      >
        <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-12 w-12 text-state-success-600" />
        <h2 className="mt-4 text-heading-4 text-ink-900">Message queued</h2>
        <p className="mt-2 max-w-sm text-body-sm leading-relaxed text-ink-600">
          Thanks — your message has been queued. We aim to reply within two working days.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING}`}
        >
          Send another message
        </button>
      </article>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Contact form"
      className="rounded-2xl bg-white p-6 shadow-card sm:p-8"
    >
      <h2 className="text-heading-4 text-ink-900">Send us a message</h2>
      <p className="mt-1 text-body-sm text-ink-500">
        All fields are required. We usually reply within two working days.
      </p>

      <div className="mt-6 space-y-5">
        <TextField
          id="fullName"
          label="Full name"
          value={form.fullName}
          error={errors.fullName}
          touched={touched.fullName === true}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <TextField
          id="email"
          label="Email"
          value={form.email}
          error={errors.email}
          touched={touched.email === true}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <TextField
          id="subject"
          label="Subject"
          value={form.subject}
          error={errors.subject}
          touched={touched.subject === true}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <MessageField
          id="message"
          label="Message"
          value={form.message}
          error={errors.message}
          touched={touched.message === true}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>

      <button
        type="submit"
        disabled={submitted}
        className={`mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent-300 px-6 py-2.5 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 disabled:opacity-60 sm:w-auto ${FOCUS_RING}`}
      >
        Send message
      </button>
    </form>
  );
}

// ---------------------------------------------------------------
// Contact details (right column)
// ---------------------------------------------------------------

interface DetailCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

function DetailCard(props: DetailCardProps): ReactElement {
  const { icon: Icon, title, children } = props;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-body font-bold text-ink-900">{title}</h3>
      <div className="mt-1.5 text-body-sm text-ink-600">{children}</div>
    </article>
  );
}

/** Keep in sync with SOCIAL_LINKS in `Footer.tsx` (same platforms & hrefs). */
const SOCIAL_LINKS: Array<{ label: string; href: string; path: string }> = [
  {
    label: "FityatulHaq on Facebook",
    href: "https://facebook.com/fityatulhaq",
    path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  },
  {
    label: "FityatulHaq on TikTok",
    href: "https://tiktok.com/@fityatulhaq",
    path: "M9 12a4 4 0 104 4V4a5 5 0 005 5",
  },
  {
    label: "FityatulHaq on Instagram",
    href: "https://instagram.com/fityatulhaq",
    path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
  },
  {
    label: "FityatulHaq on YouTube",
    href: "https://youtube.com/@fityatulhaq",
    path: "M22.54 6.42a2.78 2.78 0 00-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  },
];

function ContactDetails(): ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-heading-4 text-white">Contact details</h2>
      <DetailCard icon={Mail} title="General enquiries">
        <a
          href="mailto:hello@fityatulhaq.org"
          className={`rounded-sm font-medium text-brand-700 transition duration-fast ease-standard hover:text-brand-600 ${FOCUS_RING}`}
        >
          hello@fityatulhaq.org
        </a>
      </DetailCard>

      <DetailCard icon={LifeBuoy} title="Member support">
        <a
          href="mailto:support@fityatulhaq.org"
          className={`rounded-sm font-medium text-brand-700 transition duration-fast ease-standard hover:text-brand-600 ${FOCUS_RING}`}
        >
          support@fityatulhaq.org
        </a>
      </DetailCard>

      <DetailCard icon={MapPin} title="Office">
        <p>12 Community Way, Springfield</p>
      </DetailCard>

      <DetailCard icon={Phone} title="Phone">
        <a
          href="tel:+15550123456"
          className={`rounded-sm font-medium text-brand-700 transition duration-fast ease-standard hover:text-brand-600 ${FOCUS_RING}`}
        >
          +1 (555) 012-3456
        </a>
      </DetailCard>

      {/* Map placeholder — deliberately no embed or iframe. */}
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-500/40 bg-white/5 p-5 text-ink-300">
        <MapPin aria-hidden="true" strokeWidth={1.75} className="h-6 w-6 shrink-0 text-accent-300" />
        <p className="text-body-sm">Map coming soon</p>
      </div>

      <article className="rounded-2xl bg-white p-5 shadow-card">
        <h3 className="text-body font-bold text-ink-900">Follow FityatulHaq</h3>
        <ul className="mt-3 flex gap-2">
          {SOCIAL_LINKS.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${social.label} — opens in a new tab`}
                className={`flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700 transition duration-fast ease-standard hover:bg-brand-100 ${FOCUS_RING}`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={social.path} />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function ContactPage(): ReactElement {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c1017]">
      {/* ── Header band ──────────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-caption text-ink-400">
            <Link
              href="/"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              Home
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-200">
              Contact
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            Questions about membership, programmes or partnerships — we would love to hear
            from you.
          </p>
        </div>
      </header>

      {/* ── Two-column body ──────────────────────────────────────────── */}
      <section aria-label="Contact options" className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
          <ContactForm />
          <ContactDetails />
        </div>
      </section>
    </div>
  );
}
