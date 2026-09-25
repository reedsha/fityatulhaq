import type { Metadata } from "next";
import type { ReactElement } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  description: "เข้าสู่ระบบบัญชี FityatulHaq ของคุณ",
};

/** `/login` — server shell; the interactive part lives in `LoginForm`. */
export default function LoginPage(): ReactElement {
  return <LoginForm />;
}
