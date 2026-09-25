import type { Metadata } from "next";
import type { ReactElement } from "react";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "รีเซ็ตรหัสผ่าน",
  description: "ขอรหัสยืนยันเพื่อรีเซ็ตรหัสผ่านบัญชี FityatulHaq ของคุณ",
};

/** `/forgot-password` — step 1 of the reset flow. */
export default function ForgotPasswordPage(): ReactElement {
  return <ForgotPasswordForm />;
}
