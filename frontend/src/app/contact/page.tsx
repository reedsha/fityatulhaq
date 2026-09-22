import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import ContactPage from "@/components/contact/ContactPage";

/**
 * Route shell for `/contact`.
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the page content lives in `@/components/contact/ContactPage`
 * and is composed here. `contained={false}` lets the dark header band reach
 * the viewport edges while the shell still supplies the site chrome, the
 * `#main-content` skip-link target and the footer.
 */
export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with FityatulHaq — general enquiries, member support, or visit us in Springfield.",
};

export default function ContactRoute(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <ContactPage />
    </AuthAwareShell>
  );
}
