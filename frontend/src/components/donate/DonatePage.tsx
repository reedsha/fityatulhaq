"use client";

import Link from "next/link";
import { Check, CheckCircle2, Copy, QrCode } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";

/* ====================================================================
   DONATE — /donate
   ====================================================================

   Visual language: the shared page frame — dark band header, white
   `shadow-card` cards on the `#0c1017` band, lime accents.

   SAFETY: every bank detail below is an obviously-placeholder value
   (00-00-00 / 00000000) supplied for layout only. Do not replace them
   with anything that looks like a real account. The QR block is a
   placeholder — no QR is generated and no external service is called.
   There is no donations endpoint yet: nothing is uploaded, nothing is
   fetched, and a valid submit only swaps in a local confirmation panel.
   ==================================================================== */

// ---------------------------------------------------------------
// Impact strip
// ---------------------------------------------------------------

const IMPACT_TILES: Array<{ value: string; label: string }> = [
  { value: "£25", label: "funds a term of study materials for one member" },
  { value: "£100", label: "sends a young member to the annual summer camp" },
  { value: "£500", label: "stocks the digital library for a whole year" },
];

// ---------------------------------------------------------------
// Copy-to-clipboard with transient confirmation
// ---------------------------------------------------------------

type BankDetailKey = "accountName" | "sortCode" | "accountNumber" | "reference";

const BANK_DETAILS: Array<{ key: BankDetailKey; label: string; value: string }> = [
  { key: "accountName", label: "Account name", value: "FityatulHaq Foundation" },
  { key: "sortCode", label: "Sort code", value: "00-00-00" },
  { key: "accountNumber", label: "Account no.", value: "00000000" },
  { key: "reference", label: "Reference", value: "Please use your membership number" },
];

function BankTransferCard(): ReactElement {
  const [copiedKey, setCopiedKey] = useState<BankDetailKey | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  // Clear the pending "Copied" timeout on unmount so the state update
  // never fires after the card is gone.
  useEffect(
    (): (() => void) => {
      return (): void => {
        if (copyTimeoutRef.current !== null) {
          window.clearTimeout(copyTimeoutRef.current);
        }
      };
    },
    [],
  );

  const handleCopy = useCallback((key: BankDetailKey, value: string): void => {
    void navigator.clipboard?.writeText(value).catch((error: unknown): void => {
      console.warn("Failed to copy the bank detail", error);
    });

    setCopiedKey(key);
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout((): void => {
      setCopiedKey(null);
    }, 2000);
  }, []);

  return (
    <article className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <h3 className="text-heading-4 text-ink-900">Bank transfer</h3>
      <p className="mt-1 text-body-sm text-ink-500">
        Transfer directly, then submit the proof form below so we can thank you.
      </p>

      <dl className="mt-6 space-y-4">
        {BANK_DETAILS.map((detail) => {
          const isCopied = copiedKey === detail.key;

          return (
            <div
              key={detail.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 px-4 py-3"
            >
              <div className="min-w-0">
                <dt className="text-caption font-semibold uppercase tracking-wider text-ink-500">
                  {detail.label}
                </dt>
                <dd className="mt-0.5 break-all font-mono text-body-sm font-semibold text-ink-900">
                  {detail.value}
                </dd>
              </div>
              <button
                type="button"
                onClick={(): void => handleCopy(detail.key, detail.value)}
                aria-label={`Copy ${detail.label.toLowerCase()}`}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-caption font-semibold text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-50 ${FOCUS_RING}`}
              >
                {isCopied ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>
          );
        })}
      </dl>

      {/* Announces the copy result to screen readers. */}
      <p aria-live="polite" className="sr-only">
        {copiedKey !== null ? "Copied to clipboard." : ""}
      </p>
    </article>
  );
}

// ---------------------------------------------------------------
// QR placeholder card
// ---------------------------------------------------------------

function QrCard(): ReactElement {
  return (
    <article className="flex flex-col items-center rounded-2xl bg-brand-50 p-6 text-center shadow-card sm:p-8">
      <h3 className="text-heading-4 text-brand-800">Scan to give</h3>
      <div className="mt-5 flex h-48 w-48 items-center justify-center rounded-xl border border-brand-200 bg-white">
        <QrCode aria-hidden="true" strokeWidth={1.25} className="h-16 w-16 text-ink-400" />
      </div>
      <p className="mt-4 max-w-xs text-caption leading-relaxed text-brand-700">
        QR code placeholder — supplied by the treasurer before launch.
      </p>
    </article>
  );
}

// ---------------------------------------------------------------
// Proof of transfer form
// ---------------------------------------------------------------

interface ProofFormState {
  donorName: string;
  email: string;
  amount: string;
  reference: string;
}

type ProofField = Exclude<keyof ProofFormState, "reference">;
type ProofErrors = Partial<Record<ProofField | "receipt", string>>;

const INITIAL_PROOF_FORM: ProofFormState = {
  donorName: "",
  email: "",
  amount: "",
  reference: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_RECEIPT_TYPES: string[] = ["image/png", "image/jpeg", "application/pdf"];
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

function validateProofField(field: ProofField, value: string): string | undefined {
  if (value.trim() === "") {
    return "This field is required.";
  }
  if (field === "email" && !EMAIL_PATTERN.test(value.trim())) {
    return "Enter a valid email address.";
  }
  if (field === "amount") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return "Enter an amount greater than zero.";
    }
  }
  return undefined;
}

function ProofForm(): ReactElement {
  const [form, setForm] = useState<ProofFormState>(INITIAL_PROOF_FORM);
  const [errors, setErrors] = useState<ProofErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ProofField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | undefined>(undefined);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = useCallback(
    (field: keyof ProofFormState, value: string): void => {
      setForm((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (field === "reference" || touched[field] !== true) {
          return current;
        }
        return { ...current, [field]: validateProofField(field, value) };
      });
    },
    [touched],
  );

  const handleBlur = useCallback(
    (field: ProofField): void => {
      setTouched((current) => ({ ...current, [field]: true }));
      setErrors((current) => ({
        ...current,
        [field]: validateProofField(field, form[field]),
      }));
    },
    [form],
  );

  const handleReceiptChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;

    if (file === null) {
      setReceipt(null);
      setReceiptError(undefined);
      return;
    }

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setReceipt(null);
      setReceiptError("The receipt must be a PNG, JPEG or PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_RECEIPT_BYTES) {
      setReceipt(null);
      setReceiptError("The receipt must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setReceipt(file);
    setReceiptError(undefined);
  }, []);

  // TODO(api): POST to /api/v1/donations/proof once the endpoint lands.
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();

      const nextErrors: ProofErrors = {};
      for (const field of ["donorName", "email", "amount"] as ProofField[]) {
        const error = validateProofField(field, form[field]);
        if (error !== undefined) {
          nextErrors[field] = error;
        }
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setTouched({ donorName: true, email: true, amount: true });
        return;
      }

      // No upload, no fetch — the endpoint does not exist yet.
      setSubmitted(true);
    },
    [form],
  );

  const handleReset = useCallback((): void => {
    setForm(INITIAL_PROOF_FORM);
    setErrors({});
    setTouched({});
    setReceipt(null);
    setReceiptError(undefined);
    setSubmitted(false);
    if (receiptInputRef.current !== null) {
      receiptInputRef.current.value = "";
    }
  }, []);

  if (submitted) {
    return (
      <article
        aria-label="Proof of transfer received"
        className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-card sm:p-10"
      >
        <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-12 w-12 text-state-success-600" />
        <h2 className="mt-4 text-heading-4 text-ink-900">Proof received</h2>
        <p className="mt-2 max-w-sm text-body-sm leading-relaxed text-ink-600">
          Thank you, {form.donorName.trim()}. Your proof of transfer has been queued for the
          treasurer to confirm. A receipt will be sent to {form.email.trim()}.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING}`}
        >
          Submit another receipt
        </button>
      </article>
    );
  }

  const inputClasses = (hasError: boolean): string => {
    const base =
      "mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-body text-ink-900 placeholder:text-ink-400";
    return `${base} ${hasError ? "border-state-error-600" : "border-ink-300"} ${FOCUS_RING}`;
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Proof of transfer form"
      className="rounded-2xl bg-white p-6 shadow-card sm:p-8"
    >
      <h2 className="text-heading-4 text-ink-900">Submit your proof of transfer</h2>
      <p className="mt-1 text-body-sm text-ink-500">
        Already given? Send us the details so the treasurer can confirm your donation.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="proof-name" className="block text-caption font-semibold text-ink-700">
            Donor name
          </label>
          <input
            id="proof-name"
            name="donorName"
            type="text"
            value={form.donorName}
            onChange={(event): void => handleChange("donorName", event.target.value)}
            onBlur={(): void => handleBlur("donorName")}
            aria-invalid={touched.donorName === true && errors.donorName !== undefined}
            aria-describedby={
              touched.donorName === true && errors.donorName !== undefined
                ? "proof-name-error"
                : undefined
            }
            className={inputClasses(touched.donorName === true && errors.donorName !== undefined)}
          />
          {touched.donorName === true && errors.donorName !== undefined ? (
            <p id="proof-name-error" className="mt-1.5 text-caption text-state-error-600">
              {errors.donorName}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="proof-email" className="block text-caption font-semibold text-ink-700">
            Email
          </label>
          <input
            id="proof-email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event): void => handleChange("email", event.target.value)}
            onBlur={(): void => handleBlur("email")}
            aria-invalid={touched.email === true && errors.email !== undefined}
            aria-describedby={
              touched.email === true && errors.email !== undefined ? "proof-email-error" : undefined
            }
            className={inputClasses(touched.email === true && errors.email !== undefined)}
          />
          {touched.email === true && errors.email !== undefined ? (
            <p id="proof-email-error" className="mt-1.5 text-caption text-state-error-600">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="proof-amount" className="block text-caption font-semibold text-ink-700">
            Amount
          </label>
          <input
            id="proof-amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event): void => handleChange("amount", event.target.value)}
            onBlur={(): void => handleBlur("amount")}
            aria-invalid={touched.amount === true && errors.amount !== undefined}
            aria-describedby={
              touched.amount === true && errors.amount !== undefined
                ? "proof-amount-error"
                : undefined
            }
            className={inputClasses(touched.amount === true && errors.amount !== undefined)}
          />
          {touched.amount === true && errors.amount !== undefined ? (
            <p id="proof-amount-error" className="mt-1.5 text-caption text-state-error-600">
              {errors.amount}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="proof-reference"
            className="block text-caption font-semibold text-ink-700"
          >
            Reference / membership number <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="proof-reference"
            name="reference"
            type="text"
            value={form.reference}
            onChange={(event): void => handleChange("reference", event.target.value)}
            className={inputClasses(false)}
          />
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="proof-receipt"
          className="block text-caption font-semibold text-ink-700"
        >
          Receipt <span className="font-normal text-ink-400">(optional — PNG, JPEG or PDF, up to 5 MB)</span>
        </label>
        <input
          id="proof-receipt"
          name="receipt"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          ref={receiptInputRef}
          onChange={handleReceiptChange}
          aria-invalid={receiptError !== undefined}
          aria-describedby={receiptError !== undefined ? "proof-receipt-error" : "proof-receipt-hint"}
          className={`mt-1.5 block w-full rounded-lg border bg-white px-4 py-2.5 text-body-sm text-ink-700 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-1.5 file:text-caption file:font-semibold file:text-brand-700 ${
            receiptError !== undefined ? "border-state-error-600" : "border-ink-300"
          } ${FOCUS_RING}`}
        />
        <p id="proof-receipt-hint" className="mt-1.5 text-caption text-ink-500">
          {receipt !== null ? `Attached: ${receipt.name}` : "No file attached yet."}
        </p>
        {receiptError !== undefined ? (
          <p id="proof-receipt-error" className="mt-1.5 text-caption text-state-error-600">
            {receiptError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitted}
        className={`mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent-300 px-6 py-2.5 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 disabled:opacity-60 sm:w-auto ${FOCUS_RING}`}
      >
        Submit proof of transfer
      </button>
    </form>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function DonatePage(): ReactElement {
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
              Donate
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Support Our Work
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            Every donation goes straight into programmes for young members — study materials,
            camps, mentoring and community service. Gifts of every size matter.
          </p>
        </div>
      </header>

      {/* ── Impact strip ─────────────────────────────────────────────── */}
      <section aria-label="What your gift funds" className="px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3">
          {IMPACT_TILES.map((tile) => (
            <article key={tile.value} className="rounded-2xl bg-white p-6 shadow-card">
              <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-accent-300" />
              <p className="mt-4 text-3xl font-extrabold text-brand-700">{tile.value}</p>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{tile.label}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Giving methods ───────────────────────────────────────────── */}
      <section aria-label="Ways to give" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-heading-3 text-white">Ways to give</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BankTransferCard />
            <QrCard />
          </div>
        </div>
      </section>

      {/* ── Proof of transfer ────────────────────────────────────────── */}
      <section aria-label="Proof of transfer" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ProofForm />
        </div>
      </section>

      {/* ── Closing note ─────────────────────────────────────────────── */}
      <section
        aria-label="Thank you"
        className="mt-12 bg-accent-300 px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-heading-4 text-ink-900">Thank you for standing with our youth</h2>
          <p className="mx-auto mt-2 max-w-xl text-body-sm leading-relaxed text-brand-950/80">
            Every gift is recorded in the treasurer's books and acknowledged within two
            working days.
          </p>
          <Link
            href="/about"
            className={`mt-5 inline-flex items-center justify-center rounded-full bg-brand-950 px-5 py-2 text-caption font-bold text-accent-300 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-800 ${FOCUS_RING}`}
          >
            Learn more about our work
          </Link>
        </div>
      </section>
    </div>
  );
}
