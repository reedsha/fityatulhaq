import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import { ModerationQueue } from "@/components/webboard/ModerationQueue";
import { MODERATION_PATH } from "@/lib/webboardApi";

export const metadata: Metadata = {
  title: "ตรวจสอบเนื้อหา",
  description: "อนุมัติคำถามของบอร์ดดูแลเยาวชน และตรวจสอบรายงานเนื้อหา",
};

/**
 * `/webboard/moderation` — SRS §7.1/§7.2.
 *
 * A Web 1 stand-in for the moderation screens §8.1 places in Web 2; see the
 * component for why. `requireAuth` answers a signed-out visitor with the login
 * prompt, and the queue itself refuses a member whose role is not
 * CONTENT_MODERATOR, so the role check exists in both the UI and the routes.
 */
export default function ModerationPage(): ReactElement {
  return (
    <AuthAwareShell
      title="ตรวจสอบเนื้อหา"
      description="อนุมัติหรือปฏิเสธคำถามในบอร์ดดูแลเยาวชน และจัดการรายงานเนื้อหาที่ไม่เหมาะสม"
      requireAuth
      returnTo={MODERATION_PATH}
    >
      <ModerationQueue />
    </AuthAwareShell>
  );
}
