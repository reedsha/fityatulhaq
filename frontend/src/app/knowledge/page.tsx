import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import KnowledgeHubPage from "@/components/knowledge/KnowledgeHubPage";

/**
 * Route shell for `/knowledge`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the hub preview lives in
 * `@/components/knowledge/KnowledgeHubPage` and is composed here.
 * `contained={false}` lets the dark header band reach the viewport edges
 * while the shell still supplies the site chrome, the `#main-content`
 * skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "Knowledge Hub",
  description:
    "Courses, camps, papers, books and videos for the FityatulHaq community — open to browse, with member-only downloads and playback.",
};

export default function KnowledgeRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <KnowledgeHubPage />
    </AuthAwareShell>
  );
}
