import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

export const metadata: Metadata = {
  title: "บอร์ดดูแลเยาวชน",
  description: "พื้นที่สนทนาสำหรับหัวข้อดูแลเยาวชน พี่เลี้ยง และผู้ปกครอง",
};

/**
 * `/webboard/youth-care` stub — placeholder so the header dropdown and footer
 * links resolve while the real board is built. Pure server component: no
 * hooks, no data fetching.
 */
export default function YouthCareForumPage(): ReactElement {
  return (
    <AuthAwareShell
      title="Youth Care Forum"
      description="A discussion space for youth care topics, mentors and guardians."
    >
      <article className="mx-auto max-w-prose">
        <section className="mt-8 space-y-4">
          <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <span className="text-heading-4 text-ink-900">Thread title placeholder</span>
              <span className="text-body-sm text-ink-500">No replies yet</span>
            </div>
          </div>
          <p className="mt-4 text-center text-body-sm text-ink-500">
            Threads will appear once users begin posting.
          </p>
        </section>

        <nav className="mt-8" aria-label="Back to home">
          <Link
            href="/"
            className="text-body-sm font-medium text-brand-700 underline-offset-4 transition duration-fast ease-standard motion-reduce:transition-none hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            &larr; Back to Home
          </Link>
        </nav>
      </article>
    </AuthAwareShell>
  );
}
