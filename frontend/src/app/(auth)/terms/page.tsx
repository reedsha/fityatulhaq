import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthCard, AuthLink } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน",
  description: "ข้อกำหนดที่ใช้บังคับเมื่อคุณใช้งาน FityatulHaq",
};

/**
 * Placeholder for the terms the register form links to. The real copy is part of
 * the legal content work and is not written yet.
 */
export default function TermsPage(): ReactElement {
  return (
    <AuthCard
      title="Terms of Service"
      subtitle="This page is a placeholder."
      footer={
        <>
          Ready to continue? <AuthLink href="/register">Back to registration</AuthLink>
        </>
      }
    >
      <p className="text-body-sm text-ink-600">
        The full terms of service and privacy policy are still being prepared. By creating an
        account you agree to use FityatulHaq respectfully: no harassment, no spam, and no
        redistribution of members&apos; personal details.
      </p>

      <p className="mt-4 text-body-sm text-ink-600">
        Once the published copy is available it will replace this notice.
      </p>
    </AuthCard>
  );
}
