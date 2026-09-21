import type { Metadata } from "next";
import { Suspense, type ReactElement } from "react";

import { AuthCardFallback } from "@/components/auth/AuthCard";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the verification code we emailed you to finish setting up your account.",
};

/**
 * `/register/success` — post-registration landing page.
 *
 * The form reads `?identifier=<email>` from the URL, so it is wrapped in a
 * Suspense boundary: `useSearchParams` forces client-side rendering of the page
 * shell during static generation.
 */
export default function RegisterSuccessPage(): ReactElement {
  return (
    <Suspense fallback={<AuthCardFallback />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
