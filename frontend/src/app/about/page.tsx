import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import AboutPage from "@/components/about/AboutPage";

/**
 * Route shell for `/about`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the page content lives in `@/components/about/AboutPage` and
 * is composed here. `contained={false}` lets the dark header band reach the
 * viewport edges while the shell still supplies the site chrome, the
 * `#main-content` skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "About Us",
  description:
    "FityatulHaq — who we are: our mission, vision, history and the work we do for young people.",
};

export default function AboutRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <AboutPage />
    </AuthAwareShell>
  );
}
