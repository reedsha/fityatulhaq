import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import NewsPage from "@/components/news/NewsPage";

/**
 * Route shell for `/news`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the interactive archive (filter state) lives in
 * `@/components/news/NewsPage` and is composed here. `contained={false}` lets
 * the dark header band reach the viewport edges while the shell still supplies
 * the site chrome, the `#main-content` skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "News",
  description: "Latest updates, stories and events from across FityatulHaq.",
};

export default function NewsRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <NewsPage />
    </AuthAwareShell>
  );
}
