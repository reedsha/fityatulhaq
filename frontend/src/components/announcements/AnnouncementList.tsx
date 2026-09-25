"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useCallback, useMemo, useState, type ReactElement } from "react";

import {
  ALL_CATEGORY,
  ANNOUNCEMENTS,
  type AnnouncementItem,
} from "@/lib/announcementData";
import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import { formatDate } from "@/lib/validation";

/* ====================================================================
   ANNOUNCEMENTS ARCHIVE — /announcements
   ====================================================================

   Visual language: dashboard Section 5's announcements sidebar grown into
   a full page — the lime `#b2f35e` panel with `white/40` rows sits on the
   `#0c1017` dark band beneath the `bg-brand-950` header band, so the page
   reads as one continuous dashboard surface.

   Data layer: the mock array lives in `@/lib/announcementData` so the
   `/announcements/[slug]` route shell (a server component) can read the
   same source for `generateMetadata` — client-module exports cannot be
   read from the server. Swapping to a fetch call later requires zero
   component changes beyond that module.

   Site chrome (header, skip link, footer) is supplied by the route shell
   in `app/announcements/page.tsx` via `AuthAwareShell`; this file renders
   content only, so it must not introduce a second `<main>`.
   ==================================================================== */

// ---------------------------------------------------------------
// Category filter chips
// ---------------------------------------------------------------

// Filter values are derived from the data and compared by identity, so they
// live in one place rather than as repeated string literals.
const WITH_PDF = "มีไฟล์ PDF";
const TEXT_ONLY = "ข้อความเท่านั้น";

interface FilterChipsProps {
  filters: string[];
  active: string;
  onSelect: (filter: string) => void;
}

function FilterChips(props: FilterChipsProps): ReactElement {
  const { filters, active, onSelect } = props;

  return (
    <nav aria-label="กรองประกาศ" className="hide-scrollbar overflow-x-auto">
      <ul className="flex min-w-max items-center gap-2">
        {filters.map((filter) => {
          const isActive = filter === active;
          return (
            <li key={filter}>
              <button
                type="button"
                onClick={() => onSelect(filter)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-1.5 text-caption font-medium transition duration-fast ease-standard motion-reduce:transition-none ${
                  isActive
                    ? "border-accent-300 bg-accent-300 text-brand-950"
                    : "border-ink-700 bg-white/5 text-ink-300 hover:border-accent-300 hover:text-accent-300"
                } ${FOCUS_RING_DARK}`}
              >
                {filter}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------
// Announcement row — a `white/40` card on the lime panel
// ---------------------------------------------------------------

function AnnouncementRow({ item }: { item: AnnouncementItem }): ReactElement {
  const hasPdf = item.pdfUrl !== undefined;

  return (
    <li>
      <Link
        href={`/announcements/${item.id}`}
        className={`group flex items-start gap-3 rounded-xl bg-white/40 p-3 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-white/60 focus-visible:bg-white/60 ${FOCUS_RING}`}
      >
        <div className="min-w-0 flex-1">
          {/* Reference number left, date right — the dashboard row rhythm. */}
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-md bg-white/60 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-gray-700">
              {item.refNumber}
            </span>
            <time dateTime={item.date} className="shrink-0 text-[10px] text-gray-600">
              {formatDate(item.date)}
            </time>
          </div>

          <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-snug text-gray-900">
            {item.title}
          </p>
        </div>

        {hasPdf ? (
          <FileText
            aria-hidden="true"
            strokeWidth={1.75}
            className="h-4 w-4 shrink-0 text-gray-500 transition duration-fast ease-standard group-hover:text-brand-600 motion-reduce:transition-none"
          />
        ) : null}
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function AnnouncementList(): ReactElement {
  // Category list derived from the data, preserving first-seen order.
  const filters = useMemo((): string[] => {
    const seen = new Set<string>([ALL_CATEGORY]);
    for (const item of ANNOUNCEMENTS) {
      seen.add(item.pdfUrl !== undefined ? WITH_PDF : TEXT_ONLY);
    }
    return Array.from(seen);
  }, []);

  const [activeFilter, setActiveFilter] = useState<string>(ALL_CATEGORY);

  const visibleItems = useMemo((): AnnouncementItem[] => {
    if (activeFilter === ALL_CATEGORY) {
      return ANNOUNCEMENTS;
    }
    if (activeFilter === WITH_PDF) {
      return ANNOUNCEMENTS.filter((item) => item.pdfUrl !== undefined);
    }
    return ANNOUNCEMENTS.filter((item) => item.pdfUrl === undefined);
  }, [activeFilter]);

  const handleSelect = useCallback((filter: string): void => {
    setActiveFilter(filter);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c1017]">
      {/* ── Header band ──────────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Breadcrumb */}
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
            <span aria-current="page" className="text-ink-200">
              ประกาศ
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            ประกาศ
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            ประกาศอย่างเป็นทางการ เอกสารประชาสัมพันธ์พร้อมเลขที่อ้างอิง และเอกสารที่เผยแพร่จากคณะกรรมการ
          </p>
        </div>
      </header>

      {/* ── Filter chips bar ─────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 border-y border-ink-800/40 bg-brand-950/95 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FilterChips filters={filters} active={activeFilter} onSelect={handleSelect} />
        </div>
      </div>

      {/* ── Lime announcements panel ─────────────────────────────────── */}
      <section aria-label="รายการประกาศ" className="flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-[#b2f35e] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-ink-900">ประกาศอย่างเป็นทางการ</h2>
              <span className="text-caption font-bold text-ink-900/60">
                {`${String(visibleItems.length)} ประกาศ`}
              </span>
            </div>

            {/* Client-side filtering gives sighted users instant feedback; this
                announces the same change to screen readers. */}
            <p aria-live="polite" className="sr-only">
              {`แสดง ${String(visibleItems.length)} ประกาศภายใต้ ${activeFilter}`}
            </p>

            {visibleItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-body-sm text-ink-500">
                ไม่มีประกาศที่ตรงกับตัวกรองนี้ โปรดกลับมาอีกครั้ง
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {visibleItems.map((item) => (
                  <AnnouncementRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
