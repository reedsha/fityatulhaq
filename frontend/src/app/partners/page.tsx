import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import PartnersPage from "@/components/partners/PartnersPage";

/**
 * Route shell for `/partners`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the page content lives in `@/components/partners/PartnersPage`
 * and is composed here. `contained={false}` lets the dark header band reach
 * the viewport edges while the shell still supplies the site chrome, the
 * `#main-content` skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "Our Partners",
  description:
    "The schools, community organisations and youth networks FityatulHaq works with.",
};

export default function PartnersRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <PartnersPage />
    </AuthAwareShell>
  );
}
