import type { Metadata } from "next";
import type { ReactElement } from "react";

import AnnouncementList from "@/components/announcements/AnnouncementList";
import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

/**
 * Route shell for `/announcements`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the interactive archive (filter state) lives in
 * `@/components/announcements/AnnouncementList` and is composed here.
 * `contained={false}` lets the dark header band reach the viewport edges while
 * the shell still supplies the site chrome, the `#main-content` skip-link
 * target and the footer.
 */
export const metadata: Metadata = {
  title: "ประกาศ",
  description: "ประกาศอย่างเป็นทางการและข่าวสารเร่งด่วนจากคณะกรรมการ",
};

export default function AnnouncementsRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <AnnouncementList />
    </AuthAwareShell>
  );
}
