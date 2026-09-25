import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import { WebboardHub } from "@/components/webboard/WebboardHub";

export const metadata: Metadata = {
  title: "เว็บบอร์ด",
  description: "บอร์ดสนทนาชุมชนสำหรับสมาชิก FityatulHaq — ตั้งคำถาม แลกเปลี่ยนประสบการณ์",
};

/**
 * `/webboard` — SRS §5.3.1. Server shell for the hub; the board cards, activity
 * counts and recent threads come from `GET /webboard/overview` in the client,
 * where the session (and therefore the "you liked this" state) is available.
 */
export default function WebboardPage(): ReactElement {
  return (
    <AuthAwareShell
      title="เว็บบอร์ด"
      description="รวมบอร์ดสนทนาสำหรับสมาชิก — ตั้งคำถาม แลกเปลี่ยนประสบการณ์ และติดตามคำตอบจากทีมงาน"
    >
      <WebboardHub />
    </AuthAwareShell>
  );
}
