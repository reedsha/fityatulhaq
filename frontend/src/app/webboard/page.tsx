import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

export const metadata: Metadata = {
  title: "เว็บบอร์ด",
  description: "บอร์ดสนทนาชุมชนสำหรับสมาชิก FityatulHaq",
};

/**
 * `/webboard` stub — placeholder so the header, footer and homepage links
 * resolve while the real forum hub is built. Pure server component: no hooks,
 * no data fetching.
 */
export default function WebboardPage(): ReactElement {
  return (
    <AuthAwareShell
      title="เว็บบอร์ด"
      description="บอร์ดสนทนาชุมชน — ถามคำถามและแลกเปลี่ยนประสบการณ์"
    >
      <article className="mx-auto max-w-prose">
        <section className="mt-8 space-y-4">
          <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <span className="text-heading-4 text-ink-900">ตัวอย่างหัวข้อกระทู้</span>
              <span className="text-body-sm text-ink-500">ยังไม่มีการตอบกลับ</span>
            </div>
          </div>
          <p className="mt-4 text-center text-body-sm text-ink-500">
            กระทู้จะปรากฏขึ้นเมื่อสมาชิกเริ่มตั้งกระทู้
          </p>
        </section>

        <nav className="mt-8" aria-label="กลับไปหน้าแรก">
          <Link
            href="/"
            className="text-body-sm font-medium text-brand-700 underline-offset-4 transition duration-fast ease-standard motion-reduce:transition-none hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            &larr; กลับไปหน้าแรก
          </Link>
        </nav>
      </article>
    </AuthAwareShell>
  );
}
