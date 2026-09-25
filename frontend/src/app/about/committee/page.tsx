import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import CommitteePage from "@/components/about/CommitteePage";

/**
 * Route shell for `/about/committee`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the page content lives in `@/components/about/CommitteePage`
 * and is composed here. `contained={false}` lets the dark header band reach
 * the viewport edges while the shell still supplies the site chrome, the
 * `#main-content` skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "คณะกรรมการของเรา",
  description: "สมาชิกที่ได้รับเลือกให้บริหารงาน FityatulHaq ในวาระปัจจุบัน",
};

export default function CommitteeRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <CommitteePage />
    </AuthAwareShell>
  );
}
