import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import DonatePage from "@/components/donate/DonatePage";

/**
 * Route shell for `/donate`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the page content lives in `@/components/donate/DonatePage`
 * and is composed here. `contained={false}` lets the dark header band reach
 * the viewport edges while the shell still supplies the site chrome, the
 * `#main-content` skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "Support Our Work",
  description:
    "Give to FityatulHaq — every donation funds study materials, camps and community service for young members.",
};

export default function DonateRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <DonatePage />
    </AuthAwareShell>
  );
}
