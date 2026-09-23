import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthCard, AuthLink } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน",
  description: "ข้อกำหนดที่ใช้บังคับเมื่อคุณใช้งาน FityatulHaq",
};

/**
 * Placeholder for the terms the register form links to. The real copy is part of
 * the legal content work and is not written yet.
 */
export default function TermsPage(): ReactElement {
  return (
    <AuthCard
      title="ข้อกำหนดการใช้งาน"
      subtitle="หน้านี้เป็นเพียงหน้าตัวอย่าง"
      footer={
        <>
          พร้อมดำเนินการต่อ? <AuthLink href="/register">กลับไปหน้าสมัครสมาชิก</AuthLink>
        </>
      }
    >
      <p className="text-body-sm text-ink-600">
        ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวฉบับเต็มอยู่ระหว่างการจัดทำ
        เมื่อคุณสร้างบัญชี คุณตกลงที่จะใช้ FityatulHaq อย่างเหมาะสม: ไม่คุกคาม
        ไม่ส่งสแปม และไม่เผยแพร่ข้อมูลส่วนตัวของสมาชิก
      </p>

      <p className="mt-4 text-body-sm text-ink-600">
        เมื่อเอกสารฉบับจริงพร้อมเผยแพร่ จะมาแทนที่ข้อความนี้
      </p>
    </AuthCard>
  );
}
