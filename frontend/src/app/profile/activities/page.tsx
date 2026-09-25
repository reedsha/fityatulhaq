import type { Metadata } from "next";
import type { ReactElement } from "react";

import { ActivitiesPage } from "@/components/activities/ActivitiesPage";
import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

/**
 * Route shell for `/profile/activities` (§5.4.5 + §7.1).
 *
 * Thin by necessity, like the other route shells: `export const metadata` is only
 * honoured in a server component, so the interactive tabbed view lives in
 * `@/components/activities/ActivitiesPage` and is composed here. The member gate
 * belongs to the shell — a guest sees the log-in prompt instead of the tabs, and
 * the M1.5 `?next=` flow returns them to this exact page afterwards.
 *
 * `AuthAwareShell` renders `title` as the page `<h1>`, so `ActivitiesPage` must
 * not render a second one.
 */
export const metadata: Metadata = {
  title: "กิจกรรมของฉัน",
  description: "ติดตามกระทู้ คำถาม ความคิดเห็น และการแจ้งเตือนของคุณใน FityatulHaq",
};

export default function ProfileActivitiesRoute(): ReactElement {
  return (
    <AuthAwareShell
      title="กิจกรรมของฉัน"
      description="รวมกิจกรรมทั้งหมดของคุณไว้ในที่เดียว"
      requireAuth
      returnTo="/profile/activities"
    >
      <ActivitiesPage />
    </AuthAwareShell>
  );
}
