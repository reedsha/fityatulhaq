"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { useCallback, useMemo, useState, type ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import { NEWS_ITEMS, type NewsItem } from "@/lib/newsData";
import { formatDate } from "@/lib/validation";

/* ====================================================================
   NEWS ARCHIVE — /news
   ====================================================================

   Visual language: dashboard Section 5 exactly — dark-band header and
   filter rail (`bg-brand-950`), article grid on the `#0c1017` dark band
   with white `shadow-card` cards, `blue-50/blue-700` department badges
   and `blue-100 → slate-200` cover placeholders.

   Data layer: the mock array lives in `@/lib/newsData` so the
   `/news/[slug]` route shell (a server component) can read the same
   source for `generateMetadata` — client-module exports cannot be read
   from the server. Swapping to a fetch call later requires zero
   component changes beyond that module.

   Site chrome (header, skip link, footer) is supplied by the route shell
   in `app/news/page.tsx` via `AuthAwareShell`; this file renders content
   only, so it must not introduce a second `<main>`.
   ==================================================================== */

const ALL_DEPARTMENT = "All Departments";

// ---------------------------------------------------------------
// Department filter chips
// ---------------------------------------------------------------

interface DepartmentChipsProps {
  departments: string[];
  active: string;
  onSelect: (dept: string) => void;
}

function DepartmentChips(props: DepartmentChipsProps): ReactElement {
  const { departments, active, onSelect } = props;

  return (
    <nav aria-label="Filter news by department" className="hide-scrollbar overflow-x-auto">
      <ul className="flex min-w-max items-center gap-2">
        {departments.map((dept) => {
          const isActive = dept === active;
          return (
            <li key={dept}>
              <button
                type="button"
                onClick={() => onSelect(dept)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-1.5 text-caption font-medium transition duration-fast ease-standard motion-reduce:transition-none ${
                  isActive
                    ? "border-accent-300 bg-accent-300 text-brand-950"
                    : "border-ink-700 bg-white/5 text-ink-300 hover:border-accent-300 hover:text-accent-300"
                } ${FOCUS_RING_DARK}`}
              >
                {dept}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------
// News card
// ---------------------------------------------------------------

function NewsCard({ item }: { item: NewsItem }): ReactElement {
  const coverUrl = item.coverUrl;

  return (
    <Link
      href={`/news/${item.id}`}
      className={`group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-card transition duration-fast ease-standard motion-reduce:transition-none hover:shadow-card-hover focus-visible:shadow-card-hover ${FOCUS_RING}`}
    >
      {/* Cover image */}
      <div className="aspect-video w-full overflow-hidden bg-blue-100">
        {coverUrl !== undefined && !coverUrl.startsWith("linear-gradient") ? (
          <img
            src={coverUrl}
            alt={`Cover image for ${item.title}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-slow ease-entrance group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-slate-200"
            role="img"
            aria-label={`Placeholder illustration for ${item.title}`}
          >
            <Newspaper aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-blue-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          {item.department}
        </span>

        <h2 className="mt-2 line-clamp-2 text-xs font-bold leading-snug text-gray-900 group-hover:text-brand-700">
          {item.title}
        </h2>

        <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-gray-500">
          {item.excerpt}
        </p>

        <p className="mt-auto pt-3 text-[10px] text-gray-400">
          <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
          {" · "}
          {item.authorName}
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function NewsPage(): ReactElement {
  // Derive unique department list preserving insertion order.
  const departments = useMemo((): string[] => {
    const seen = new Set<string>([ALL_DEPARTMENT]);
    for (const item of NEWS_ITEMS) {
      seen.add(item.department);
    }
    return Array.from(seen);
  }, []);

  // Article count per department, in the same insertion order as the chips.
  const departmentCounts = useMemo((): Map<string, number> => {
    const counts = new Map<string, number>();
    for (const item of NEWS_ITEMS) {
      counts.set(item.department, (counts.get(item.department) ?? 0) + 1);
    }
    return counts;
  }, []);

  const [activeDepartment, setActiveDepartment] = useState<string>(ALL_DEPARTMENT);

  const visibleItems = useMemo((): NewsItem[] => {
    if (activeDepartment === ALL_DEPARTMENT) {
      return NEWS_ITEMS;
    }
    return NEWS_ITEMS.filter((item) => item.department === activeDepartment);
  }, [activeDepartment]);

  const handleSelect = useCallback((dept: string): void => {
    setActiveDepartment(dept);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c1017]">
      {/* ── Header band ──────────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Base gradient — darkens the band toward the grid below. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        {/* Accent glow — token-based stand-in for the reference's soft radial
            highlight. A raw colour literal here would escape the palette. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-caption text-ink-400">
            <Link
              href="/"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              Home
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-200">
              News
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            News &amp; Updates
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            Latest updates, stories and events from across every department of the organisation.
          </p>
        </div>
      </header>

      {/* ── Filter chips bar ─────────────────────────────────────────── */}
      {/* `top-16` clears the sticky site header (h-16) so the bar parks
          directly beneath it instead of sliding under it. */}
      <div className="sticky top-16 z-30 border-y border-ink-800/40 bg-brand-950/95 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <DepartmentChips
            departments={departments}
            active={activeDepartment}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {/* ── Card grid ────────────────────────────────────────────────── */}
      <section
        aria-label="News articles"
        className="flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          {/* Section label — the blue pill the dashboard's news grid carries. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white">
              Latest news
            </span>

            {/* Article counts per department (insertion order = chip order). */}
            <ul className="flex flex-wrap items-center gap-2" aria-label="Articles per department">
              {departments
                .filter((dept) => dept !== ALL_DEPARTMENT)
                .map((dept) => (
                  <li
                    key={dept}
                    className="rounded-full bg-white/5 px-3 py-1 text-caption text-ink-300 ring-1 ring-white/10"
                  >
                    {dept}
                    <span className="ml-1.5 font-bold text-accent-300">
                      {departmentCounts.get(dept) ?? 0}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Client-side filtering gives sighted users instant feedback; this
              announces the same change to screen readers. */}
          <p aria-live="polite" className="sr-only">
            {`${String(visibleItems.length)} article${visibleItems.length === 1 ? "" : "s"} shown under ${activeDepartment}.`}
          </p>

          {visibleItems.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-body-sm text-ink-500">
              No news in this department yet. Check back soon.
            </p>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <li key={item.id}>
                  <NewsCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
