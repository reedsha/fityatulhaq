import type { Metadata } from "next";
import { Suspense, type ReactElement } from "react";

import { AuthCardFallback } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Create a new password",
  description: "Choose a new password for your FityatulHaq account.",
};

/**
 * `/reset-password` — final step of the reset flow. The identifier and code
 * arrive as query parameters and are validated by the backend on submit.
 */
export default function ResetPasswordPage(): ReactElement {
  return (
    <Suspense fallback={<AuthCardFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
