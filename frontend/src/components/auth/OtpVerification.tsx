"use client";

import { useEffect, useState, type ReactElement } from "react";

import { FormField } from "@/components/auth/FormField";
import { OTP_CODE_LENGTH } from "@/lib/validation";

/** Seconds the resend control stays locked after a code is requested. */
export const RESEND_COOLDOWN_SECONDS = 30;

export interface OtpVerificationProps {
  /** Current code value, owned by the parent form's state. */
  value: string;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  /** Requests a fresh code. The countdown restarts once it settles. */
  onResend: () => void | Promise<void>;
  error?: string;
  disabled?: boolean;
}

/**
 * The 6-digit code input plus a rate-limited resend control, shared by the
 * email-verification screen and the password-reset flow.
 *
 * The countdown starts on mount because a code has just been issued, and every
 * resend starts it again — including a failed one, so a broken request cannot be
 * hammered. The button is `type="button"` so it never submits the form it sits in.
 */
export function OtpVerification(props: OtpVerificationProps): ReactElement {
  const { value, onChange, onBlur, onResend, error, disabled = false } = props;

  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const isCountingDown = secondsLeft > 0;

  useEffect((): (() => void) | undefined => {
    if (!isCountingDown) {
      return undefined;
    }

    const timer = window.setInterval((): void => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return (): void => {
      window.clearInterval(timer);
    };
  }, [isCountingDown]);

  const canResend = !isCountingDown && !isResending && !disabled;

  const handleResend = (): void => {
    setIsResending(true);

    void Promise.resolve(onResend())
      .catch((): void => {
        // The parent surfaces the failure; the cooldown still restarts below.
      })
      .finally((): void => {
        setSecondsLeft(RESEND_COOLDOWN_SECONDS);
        setIsResending(false);
      });
  };

  return (
    <div className="space-y-3">
      <FormField
        id="code"
        name="code"
        label="Verification code"
        type="text"
        inputMode="numeric"
        maxLength={OTP_CODE_LENGTH}
        value={value}
        error={error}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete="one-time-code"
        placeholder="123456"
        hint={`Enter the ${OTP_CODE_LENGTH}-digit code we emailed you.`}
        required
        disabled={disabled}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
        <span className="text-ink-600">Didn&apos;t receive the code?</span>

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend}
          className="font-medium text-brand-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline"
        >
          {isResending
            ? "Sending a new code..."
            : canResend
              ? "Resend code"
              : `Resend in ${String(secondsLeft)}s`}
        </button>
      </div>
    </div>
  );
}
