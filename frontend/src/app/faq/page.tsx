import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import FaqPage from "@/components/faq/FaqPage";

/**
 * Route shell for `/faq`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the searchable archive lives in `@/components/faq/FaqPage`
 * and is composed here. `contained={false}` lets the dark header band reach
 * the viewport edges while the shell still supplies the site chrome, the
 * `#main-content` skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about joining FityatulHaq, our programmes, and your member account.",
};

export default function FaqRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <FaqPage />
    </AuthAwareShell>
  );
}
