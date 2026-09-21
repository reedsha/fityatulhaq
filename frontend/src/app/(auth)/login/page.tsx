import type { Metadata } from "next";
import type { ReactElement } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your FityatulHaq account.",
};

/** `/login` — server shell; the interactive part lives in `LoginForm`. */
export default function LoginPage(): ReactElement {
  return <LoginForm />;
}
