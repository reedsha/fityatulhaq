"use client";

import Link from "next/link";
import { useCallback, type ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import type { NewsItem } from "@/lib/newsData";
import { formatDate } from "@/lib/validation";

/* ====================================================================
   NEWS ARTICLE — /news/[slug]
   ====================================================================

   Visual language: the /news listing's dark band (`bg-brand-950` +
   gradient) carries the article header, and the body sits on a white
   `shadow-card` card over the band — the dashboard Section 5 card
   treatment at reading width.

   The site `<main>` landmark is supplied by the route shell via
   `AuthAwareShell` → `PageShell`; this component renders content only.
   ==================================================================== */

interface NewsDetailProps {
  article: NewsItem;
}

const SHARE_PLATFORMS = ["Facebook", "Twitter", "Copy Link"] as const;
type SharePlatform = (typeof SHARE_PLATFORMS)[number];

export default function NewsDetail(props: NewsDetailProps): ReactElement {
  const { article } = props;

  const shareUrl = useCallback(
    (platform: SharePlatform): void => {
      const encodedUrl = encodeURIComponent(window.location.href);
      const encodedTitle = encodeURIComponent(article.title);

      if (platform === "Facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank", "noopener,noreferrer");
        return;
      }
      if (platform === "Twitter") {
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, "_blank", "noopener,noreferrer");
        return;
      }

      // Copy Link
      void navigator.clipboard
        ?.writeText(window.location.href)
        .catch((error: unknown): void => {
          console.warn("Failed to copy the article link", error);
        });
    },
    [article.title],
  );

  const shareLabel = useCallback((platform: SharePlatform): string => {
    return platform === "Copy Link"
      ? "คัดลอกลิงก์บทความนี้"
      : `แบ่งปันบทความนี้บน ${platform}`;
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-950">
      {/* ── Article header band ──────────────────────────────────────── */}
      <div className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Same gradient treatment as the /news listing band. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Breadcrumb: Home / News / Article title */}
          <nav aria-label="เส้นทางนำทาง" className="text-caption text-ink-400">
            <Link
              href="/"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              หน้าแรก
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <Link
              href="/news"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              ข่าวสาร
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span
              aria-current="page"
              className="inline-block max-w-[16rem] truncate align-bottom text-ink-200"
            >
              {article.title}
            </span>
          </nav>

          <span className="mt-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
            {article.department}
          </span>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            {article.title}
          </h1>

          <p className="mt-3 text-body-sm text-ink-400">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            {" · "}
            by {article.authorName}
          </p>
        </div>
      </div>

      {/* ── Article body ─────────────────────────────────────────────── */}
      <section aria-label="Full article" className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-card sm:p-10">
          {/* Cover image — shown only when the article carries one. Mock data
              currently ships without covers, so the gradient header band and
              department badge carry the visual weight. */}
          {article.coverUrl !== undefined ? (
            <img
              src={article.coverUrl}
              alt={`ภาพปกสำหรับ ${article.title}`}
              className="mb-8 h-64 w-full rounded-xl object-cover"
            />
          ) : null}

          {/* Lead paragraph */}
          <p className="text-lg leading-relaxed text-ink-700">{article.excerpt}</p>

          {/* Placeholder body — replaced by rich text from the API in a
              later phase. */}
          <section aria-label="เนื้อหาบทความ" className="mt-8 border-t border-ink-200 pt-8">
            <h2 className="text-heading-4 text-ink-900">เนื้อหาบทความ</h2>
            <p className="mt-3 text-body-sm leading-relaxed text-ink-600">
              ตัวอย่างเนื้อหาบทความฉบับเต็ม ในรุ่นจริงจะถูกแสดงจากข้อความ Rich Text
              ที่จัดเก็บในฐานข้อมูล (ดูการออกแบบ API ในเฟสถัดไป) ข้อความส่วนนี้จะถูกแทนที่ด้วย
              เนื้อหาจริงเมื่อเชื่อมต่อระบบจัดการเนื้อหาเรียบร้อย
            </p>
            {Array.from({ length: 3 }, (_, index) => (
              <p key={index} className="mt-4 text-body-sm leading-relaxed text-ink-600">
                ย่อหน้าตัวอย่างสำหรับแสดงความยาวของเนื้อหาจริง ซึ่งจะมาจากฐานข้อมูลในภายหลัง
                ขณะนี้เป็นเพียงข้อความจำลองเพื่อตรวจสอบรูปแบบและระยะห่างของตัวอักษรบนหน้า
                เมื่อระบบจัดการเนื้อหาพร้อมใช้งานแล้ว ข้อความทั้งหมดจะถูกแทนที่โดยอัตโนมัติ
              </p>
            ))}
          </section>

          {/* Share */}
          <section aria-label="แบ่งปันบทความนี้" className="mt-10 border-t border-ink-200 pt-8">
            <h2 className="text-caption font-bold uppercase tracking-wider text-ink-500">
              แบ่งปันบทความนี้
            </h2>
            <div className="mt-4 flex gap-3">
              {SHARE_PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={(): void => shareUrl(platform)}
                  aria-label={shareLabel(platform)}
                  className={`inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-caption font-semibold text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-100 ${FOCUS_RING}`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </section>

          {/* Back to listings */}
          <nav aria-label="กลับไปหน้าข่าวสาร" className="mt-10">
            <Link
              href="/news"
              className={`inline-flex items-center gap-1 rounded-sm text-caption font-medium text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:text-brand-600 ${FOCUS_RING}`}
            >
              ← กลับไปหน้าข่าวสารทั้งหมด
            </Link>
          </nav>
        </article>
      </section>
    </div>
  );
}
