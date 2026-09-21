import type { Metadata } from "next";
import type { ReactElement } from "react";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Register for a FityatulHaq account to follow announcements, events and community activities.",
};

/** `/register` — server shell; the interactive part lives in `RegisterForm`. */
export default function RegisterPage(): ReactElement {
  return <RegisterForm />;
}
