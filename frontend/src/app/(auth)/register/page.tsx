import type { Metadata } from "next";
import type { ReactElement } from "react";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description:
    "สมัครบัญชี FityatulHaq เพื่อติดตามประกาศ กิจกรรม และข่าวสารของชุมชน",
};

/** `/register` — server shell; the interactive part lives in `RegisterForm`. */
export default function RegisterPage(): ReactElement {
  return <RegisterForm />;
}
