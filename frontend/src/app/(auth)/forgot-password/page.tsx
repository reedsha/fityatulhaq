import type { Metadata } from "next";
import type { ReactElement } from "react";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a verification code to reset your FityatulHaq password.",
};

/** `/forgot-password` — step 1 of the reset flow. */
export default function ForgotPasswordPage(): ReactElement {
  return <ForgotPasswordForm />;
}
