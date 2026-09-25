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
  { value: "฿25", label: "สนับสนุนอุปกรณ์การเรียนหนึ่งภาคการศึกษาสำหรับสมาชิกหนึ่งคน" },
  { value: "฿100", label: "ส่งสมาชิกเยาวชนเข้าร่วมค่ายฤดูร้อนประจำปี" },
  { value: "฿500", label: "จัดหาหนังสือให้ห้องสมุดดิจิทัลตลอดทั้งปี" },
];

// ---------------------------------------------------------------
// Copy-to-clipboard with transient confirmation
// ---------------------------------------------------------------

type BankDetailKey = "accountName" | "sortCode" | "accountNumber" | "reference";

const BANK_DETAILS: Array<{ key: BankDetailKey; label: string; value: string }> = [
  { key: "accountName", label: "ชื่อบัญชี", value: "FityatulHaq Foundation" },
  { key: "sortCode", label: "รหัสสาขา", value: "00-00-00" },
  { key: "accountNumber", label: "เลขที่บัญชี", value: "00000000" },
  { key: "reference", label: "รหัสอ้างอิง", value: "โปรดระบุหมายเลขสมาชิกของคุณ" },
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
      <h3 className="text-heading-4 text-ink-900">โอนเงินผ่านธนาคาร</h3>
      <p className="mt-1 text-body-sm text-ink-500">
        โอนเงินโดยตรง แล้วส่งแบบฟอร์มหลักฐานการโอนด้านล่าง เพื่อให้เราขอบคุณคุณได้
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
                aria-label={`คัดลอก${detail.label}`}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-caption font-semibold text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-50 ${FOCUS_RING}`}
              >
                {isCopied ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {isCopied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
          );
        })}
      </dl>

      {/* Announces the copy result to screen readers. */}
      <p aria-live="polite" className="sr-only">
        {copiedKey !== null ? "คัดลอกไปยังคลิปบอร์ดแล้ว" : ""}
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
      <h3 className="text-heading-4 text-brand-800">สแกนเพื่อบริจาค</h3>
      <div className="mt-5 flex h-48 w-48 items-center justify-center rounded-xl border border-brand-200 bg-white">
        <QrCode aria-hidden="true" strokeWidth={1.25} className="h-16 w-16 text-ink-400" />
      </div>
      <p className="mt-4 max-w-xs text-caption leading-relaxed text-brand-700">
        ตัวอย่างคิวอาร์โค้ด — เหรัญญิกจะจัดส่งก่อนเปิดใช้งานจริง
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
    return "กรุณากรอกข้อมูลในช่องนี้";
  }
  if (field === "email" && !EMAIL_PATTERN.test(value.trim())) {
    return "กรุณากรอกอีเมลให้ถูกต้อง";
  }
  if (field === "amount") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return "กรุณากรอกจำนวนเงินที่มากกว่าศูนย์";
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
      setReceiptError("ไฟล์หลักฐานต้องเป็น PNG, JPEG หรือ PDF เท่านั้น");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_RECEIPT_BYTES) {
      setReceipt(null);
      setReceiptError("ไฟล์หลักฐานต้องมีขนาดไม่เกิน 5 MB");
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
        aria-label="ได้รับหลักฐานการโอนแล้ว"
        className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-card sm:p-10"
      >
        <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-12 w-12 text-state-success-600" />
        <h2 className="mt-4 text-heading-4 text-ink-900">ได้รับหลักฐานแล้ว</h2>
        <p className="mt-2 max-w-sm text-body-sm leading-relaxed text-ink-600">
          ขอบคุณ {form.donorName.trim()} หลักฐานการโอนของคุณถูกส่งให้เหรัญญิกตรวจสอบแล้ว
          ใบเสร็จจะถูกส่งไปที่ {form.email.trim()}
        </p>
        <button
          type="button"
          onClick={handleReset}
          className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING}`}
        >
          ส่งหลักฐานอีกครั้ง
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
      aria-label="แบบฟอร์มหลักฐานการโอน"
      className="rounded-2xl bg-white p-6 shadow-card sm:p-8"
    >
      <h2 className="text-heading-4 text-ink-900">ส่งหลักฐานการโอนของคุณ</h2>
      <p className="mt-1 text-body-sm text-ink-500">
        โอนแล้วใช่ไหม ส่งรายละเอียดให้เรา เพื่อให้เหรัญญิกยืนยันการบริจาคของคุณ
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="proof-name" className="block text-caption font-semibold text-ink-700">
            ชื่อผู้บริจาค
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
            อีเมล
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
            จำนวนเงิน
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
            รหัสอ้างอิง / หมายเลขสมาชิก <span className="font-normal text-ink-400">(ไม่บังคับ)</span>
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
          หลักฐานการโอน <span className="font-normal text-ink-400">(ไม่บังคับ — PNG, JPEG หรือ PDF ขนาดไม่เกิน 5 MB)</span>
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
          {receipt !== null ? `แนบไฟล์แล้ว: ${receipt.name}` : "ยังไม่ได้แนบไฟล์"}
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
        ส่งหลักฐานการโอน
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
          <nav aria-label="เส้นทางนำทาง" className="text-caption text-ink-400">
            <Link
              href="/"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              หน้าแรก
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-200">
              บริจาค
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            สนับสนุนงานของเรา
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            ทุกการบริจาคจะถูกนำไปใช้กับโครงการสำหรับสมาชิกเยาวชนโดยตรง ทั้งอุปกรณ์การเรียน
            ค่าย กิจกรรมพี่เลี้ยง และการบริการชุมชน ไม่ว่าจะมากหรือน้อย ล้วนมีความหมาย
          </p>
        </div>
      </header>

      {/* ── Impact strip ─────────────────────────────────────────────── */}
      <section aria-label="การบริจาคของคุณสนับสนุนอะไร" className="px-4 pt-10 sm:px-6 lg:px-8">
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
      <section aria-label="ช่องทางการบริจาค" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-heading-3 text-white">ช่องทางการบริจาค</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BankTransferCard />
            <QrCard />
          </div>
        </div>
      </section>

      {/* ── Proof of transfer ────────────────────────────────────────── */}
      <section aria-label="หลักฐานการโอน" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ProofForm />
        </div>
      </section>

      {/* ── Closing note ─────────────────────────────────────────────── */}
      <section
        aria-label="ขอบคุณ"
        className="mt-12 bg-accent-300 px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-heading-4 text-ink-900">ขอบคุณที่ร่วมยืนเคียงข้างเยาวชนของเรา</h2>
          <p className="mx-auto mt-2 max-w-xl text-body-sm leading-relaxed text-brand-950/80">
            ทุกการบริจาคจะถูกบันทึกในบัญชีของเหรัญญิก และได้รับการตอบรับภายในสองวันทำการ
          </p>
          <Link
            href="/about"
            className={`mt-5 inline-flex items-center justify-center rounded-full bg-brand-950 px-5 py-2 text-caption font-bold text-accent-300 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-800 ${FOCUS_RING}`}
          >
            เรียนรู้เพิ่มเติมเกี่ยวกับงานของเรา
          </Link>
        </div>
      </section>
    </div>
  );
}
