import type { Metadata } from "next";
import { Suspense, type ReactElement } from "react";

import { AuthCardFallback } from "@/components/auth/AuthCard";
import { VerifyResetCodeForm } from "@/components/auth/VerifyResetCodeForm";

export const metadata: Metadata = {
  title: "กรอกรหัสยืนยัน",
  description: "กรอกรหัสยืนยันที่เราส่งไปทางอีเมลเพื่อรีเซ็ตรหัสผ่าน",
};

/**
 * `/forgot-password/sent` — step 2 of the reset flow: confirmation that the code
 * was dispatched, plus the field that redeems it.
 *
 * Reads `?identifier=<email>`, so it needs a Suspense boundary for the same
 * reason as the register success screen.
 */
export default function ForgotPasswordSentPage(): ReactElement {
  return (
    <Suspense fallback={<AuthCardFallback />}>
      <VerifyResetCodeForm />
    </Suspense>
  );
}
