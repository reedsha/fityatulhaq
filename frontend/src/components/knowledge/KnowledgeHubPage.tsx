"use client";

import Link from "next/link";
import {
  ArrowRight,
  Book,
  BookOpen,
  FileText,
  GraduationCap,
  Info,
  Library,
  Lightbulb,
  Lock,
  MessagesSquare,
  Tent,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledgeData";

/* ====================================================================
   KNOWLEDGE HUB — /knowledge
   ====================================================================

   Visual language: the shared page frame — dark band header, white
   `shadow-card` tiles on the `#0c1017` band, lime cross-links.

   Since M2 the tiles are real links into the ten sub-routes: guests browse
   every collection, and the members-only badge marks the three libraries
   whose download/playback/ask actions need a signed-in member (§6.4).
   ==================================================================== */

// ---------------------------------------------------------------
// Icon mapping — data carries the lucide icon NAME as a string
// ---------------------------------------------------------------

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  Tent,
  FileText,
  Library,
  BookOpen,
  Lightbulb,
  MessagesSquare,
  Book,
  Video,
};

const FALLBACK_ICON: LucideIcon = Book;

// ---------------------------------------------------------------
// Category tile (non-interactive)
// ---------------------------------------------------------------

function CategoryTile({ category }: { category: (typeof KNOWLEDGE_CATEGORIES)[number] }): ReactElement {
  const Icon = CATEGORY_ICONS[category.icon] ?? FALLBACK_ICON;

  return (
    <Link
      href={`/knowledge/${category.slug}`}
      aria-label={`${category.name} collection`}
      className={`group flex h-full flex-col rounded-2xl bg-white p-5 shadow-card transition duration-fast ease-standard motion-reduce:transition-none hover:shadow-card-hover ${FOCUS_RING}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-heading-4 text-ink-900 transition duration-fast ease-standard motion-reduce:transition-none group-hover:text-brand-700">
        {category.name}
      </h3>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{category.blurb}</p>

      {/* Footer row — members-only badge (when applicable) + browse affordance. */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {category.membersOnly ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
            <Lock aria-hidden="true" className="h-3 w-3" />
            Members-only
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-0.5 text-[10px] font-semibold text-ink-500">
          Browse
          <ArrowRight
            aria-hidden="true"
            className="h-3 w-3 transition-transform duration-fast ease-standard motion-reduce:transition-none group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function KnowledgeHubPage(): ReactElement {
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
              Knowledge
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Knowledge Hub
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            Courses, camps, libraries and archives — open for every guest to browse.
            Members unlock downloads, playback and asking.
          </p>
        </div>
      </header>

      {/* ── Member note ──────────────────────────────────────────────── */}
      <section aria-label="Membership note" className="px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start gap-3 rounded-2xl border-l-4 border-state-info-500 bg-white p-5 shadow-card">
            <Info aria-hidden="true" strokeWidth={1.75} className="h-5 w-5 shrink-0 text-state-info-600" />
            <p className="text-body-sm leading-relaxed text-ink-700">
              Items marked Members-only unlock when you sign in. Guest access arrives with
              the full hub.
            </p>
          </div>
        </div>
      </section>

      {/* ── Category grid (non-interactive tiles) ────────────────────── */}
      <section aria-label="Knowledge categories" className="px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {KNOWLEDGE_CATEGORIES.map((category) => (
              <li key={category.id}>
                <CategoryTile category={category} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── While you wait — cross-links to real routes ──────────────── */}
      <section aria-label="While you wait" className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-heading-3 text-white">While you wait</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Link
              href="/webboard/youth-care"
              className={`group flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-card transition duration-fast ease-standard motion-reduce:transition-none hover:shadow-card-hover ${FOCUS_RING}`}
            >
              <span>
                <span className="block text-body font-bold text-ink-900 group-hover:text-brand-700">
                  Ask in Youth Care
                </span>
                <span className="mt-0.5 block text-caption text-ink-500">
                  Get answers from members on the webboard.
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-ink-400 transition duration-fast ease-standard group-hover:text-brand-600 motion-reduce:transition-none"
              />
            </Link>

            <Link
              href="/news"
              className={`group flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-card transition duration-fast ease-standard motion-reduce:transition-none hover:shadow-card-hover ${FOCUS_RING}`}
            >
              <span>
                <span className="block text-body font-bold text-ink-900 group-hover:text-brand-700">
                  Read the latest news
                </span>
                <span className="mt-0.5 block text-caption text-ink-500">
                  Programme updates from across the organisation.
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-ink-400 transition duration-fast ease-standard group-hover:text-brand-600 motion-reduce:transition-none"
              />
            </Link>

            <Link
              href="/knowledge/recommended"
              className={`group flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-card transition duration-fast ease-standard motion-reduce:transition-none hover:shadow-card-hover ${FOCUS_RING}`}
            >
              <span>
                <span className="block text-body font-bold text-ink-900 group-hover:text-brand-700">
                  Curated picks
                </span>
                <span className="mt-0.5 block text-caption text-ink-500">
                  The committee's favourite reads, talks and recordings.
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-ink-400 transition duration-fast ease-standard group-hover:text-brand-600 motion-reduce:transition-none"
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
