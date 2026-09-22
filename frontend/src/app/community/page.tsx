import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import CommunityPage from "@/components/community/CommunityPage";

/**
 * Route shell for `/community`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the programmes page lives in
 * `@/components/community/CommunityPage` and is composed here.
 * `contained={false}` lets the dark header band reach the viewport edges
 * while the shell still supplies the site chrome, the `#main-content`
 * skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "Community",
  description:
    "The programmes of FityatulHaq — Fit Family, TMYDA, the Women's Office and the Volunteers Network — and how to get involved.",
};

export default function CommunityRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <CommunityPage />
    </AuthAwareShell>
  );
}
