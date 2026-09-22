"use client";

import { Loader2 } from "lucide-react";
import type { ReactElement } from "react";

export interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  isSubmitting: boolean;
}

/** Submit control that disables itself and shows a spinner while in flight. */
export function SubmitButton(props: SubmitButtonProps): ReactElement {
  const { label, loadingLabel = "Please wait", isSubmitting } = props;

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? (
        <>
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
