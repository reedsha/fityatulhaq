"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import type { ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import type { AnnouncementItem } from "@/lib/announcementData";
import { formatDate } from "@/lib/validation";

/* ====================================================================
   ANNOUNCEMENT DETAIL — /announcements/[slug]
   ====================================================================

   Visual language: mirrors NewsDetail — the listing's dark band carries
   the notice header, and the body sits on a white `shadow-card` card over
   the band. The department badge is replaced by the notice's mono
   reference-number pill, and the PDF download block appears only when the
   notice carries a `pdfUrl`.

   The site `<main>` landmark is supplied by the route shell via
   `AuthAwareShell` → `PageShell`; this component renders content only.
   ==================================================================== */

interface AnnouncementDetailProps {
  announcement: AnnouncementItem;
}

export default function AnnouncementDetail(
  props: AnnouncementDetailProps,
): ReactElement {
  const { announcement } = props;
  const hasPdf = announcement.pdfUrl !== undefined;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-950">
      {/* ── Notice header band ───────────────────────────────────────── */}
      <div className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Same gradient treatment as the /announcements listing band. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Breadcrumb: Home / Announcements / Reference number */}
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
              href="/announcements"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              ประกาศ
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span
              aria-current="page"
              className="inline-block max-w-[16rem] truncate align-bottom text-ink-200"
            >
              {announcement.refNumber}
            </span>
          </nav>

          {/* Reference number badge — mono pill as on the listing rows. */}
          <span className="mt-4 inline-flex items-center rounded-md bg-white/60 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-gray-700">
            {announcement.refNumber}
          </span>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            {announcement.title}
          </h1>

          <p className="mt-3 text-body-sm text-ink-400">
            <time dateTime={announcement.date}>{formatDate(announcement.date)}</time>
            {" · "}
            เลขที่ {announcement.refNumber}
          </p>
        </div>
      </div>

      {/* ── Notice body ──────────────────────────────────────────────── */}
      <section aria-label="ประกาศฉบับเต็ม" className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-card sm:p-10">
          {/* Lead paragraph — placeholder until the notice text arrives from
              the API in a later phase. */}
          <p className="text-lg leading-relaxed text-ink-700">
            ขอแจ้งให้สมาชิกทุกท่านทราบถึงประกาศอย่างเป็นทางการฉบับนี้ ภายใต้เลขที่อ้างอิง{" "}
            {announcement.refNumber} ข้อความฉบับเต็มของประกาศจะถูกเผยแพร่ที่นี่
            เมื่อได้รับการถ่ายโอนจากทะเบียนประกาศแล้ว
          </p>

          <section aria-label="เนื้อหาประกาศ" className="mt-8 border-t border-ink-200 pt-8">
            <p className="text-body-sm leading-relaxed text-ink-600">
              ข้อความส่วนนี้เป็นตัวอย่างเพื่อแสดงรูปแบบและระยะห่างของเนื้อหา
              เมื่อระบบจัดการเนื้อหาพร้อมใช้งาน ข้อความจริงจากฐานข้อมูลจะถูกแสดงแทนที่นี่โดยอัตโนมัติ
              ขณะนี้เป็นเพียงข้อความจำลองเพื่อตรวจสอบการแสดงผลของหน้า
            </p>
            {Array.from({ length: 3 }, (_, index) => (
              <p key={index} className="mt-4 text-body-sm leading-relaxed text-ink-600">
                ย่อหน้าตัวอย่างสำหรับแสดงความยาวของเนื้อหาประกาศฉบับจริง
                ซึ่งจะมาจากทะเบียนประกาศในเฟสถัดไป ข้อความทั้งหมดในส่วนนี้จะถูกแทนที่
                เมื่อเชื่อมต่อระบบประกาศเรียบร้อยแล้ว
              </p>
            ))}

            <p className="mt-8 border-t border-ink-200 pt-6 text-caption text-ink-500">
              ออกโดยเลขานุการคณะกรรมการ · FityatulHaq
            </p>
          </section>

          {/* PDF download block — only when a circular is attached. The mock
              hrefs point at documents that do not exist yet; that is expected
              for this phase. */}
          {hasPdf ? (
            <section
              aria-label="ดาวน์โหลดประกาศ"
              className="mt-10 flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 bg-brand-50 p-5"
            >
              <FileText
                aria-hidden="true"
                strokeWidth={1.75}
                className="h-8 w-8 shrink-0 text-brand-700"
              />
              <p className="min-w-0 flex-1 text-body-sm font-semibold text-ink-900">
                ดาวน์โหลดประกาศฉบับเต็ม (PDF)
              </p>
              <a
                href={announcement.pdfUrl}
                download
                className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING}`}
              >
                ดาวน์โหลด PDF
              </a>
            </section>
          ) : (
            <p className="mt-10 text-caption text-ink-500">
              ประกาศนี้ไม่มีไฟล์เอกสารแนบ
            </p>
          )}

          {/* Back to the listing */}
          <nav aria-label="กลับไปหน้าประกาศ" className="mt-10">
            <Link
              href="/announcements"
              className={`inline-flex items-center gap-1 rounded-sm text-caption font-medium text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:text-brand-600 ${FOCUS_RING}`}
            >
              ← กลับไปหน้าประกาศทั้งหมด
            </Link>
          </nav>
        </article>
      </section>
    </div>
  );
}
