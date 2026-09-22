"use client";

import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { useCallback, useMemo, useState, type ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import { FAQ_ENTRIES, type FaqEntry } from "@/lib/faqData";

/* ====================================================================
   FAQ — /faq
   ====================================================================

   Visual language: the /news frame — dark band header, sticky `top-16`
   filter rail (here carrying the search box and category chips), results
   on the `#0c1017` band as white `shadow-card` accordions.

   Accordion items toggle independently; each panel is conditionally
   rendered (no hidden-content tricks) and labelled by its question button.
   ==================================================================== */

const ALL_CATEGORIES = "All Categories";

// ---------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------

function FaqItem({ entry }: { entry: FaqEntry }): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const buttonId = `faq-button-${entry.id}`;
  const panelId = `faq-panel-${entry.id}`;

  return (
    <li>
      <article className="rounded-xl bg-white shadow-card">
        <button
          type="button"
          id={buttonId}
          onClick={(): void => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition duration-fast ease-standard motion-reduce:transition-none hover:bg-ink-50 ${
            isOpen ? "rounded-t-xl" : "rounded-xl"
          } ${FOCUS_RING}`}
        >
          <span className="text-body font-semibold text-ink-900">{entry.question}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-fast ease-standard motion-reduce:transition-none ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen ? (
          <div
            role="region"
            id={panelId}
            aria-labelledby={buttonId}
            className="border-t border-ink-200 px-5 pb-5 pt-4"
          >
            <p className="text-body-sm leading-relaxed text-ink-600">{entry.answer}</p>
          </div>
        ) : null}
      </article>
    </li>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function FaqPage(): ReactElement {
  // Category list derived from the data, preserving first-seen order.
  const categories = useMemo((): string[] => {
    const seen = new Set<string>([ALL_CATEGORIES]);
    for (const entry of FAQ_ENTRIES) {
      seen.add(entry.category);
    }
    return Array.from(seen);
  }, []);

  const [query, setQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);

  // Search and category chips combine with AND.
  const visibleEntries = useMemo((): FaqEntry[] => {
    const needle = query.trim().toLowerCase();

    return FAQ_ENTRIES.filter((entry) => {
      if (activeCategory !== ALL_CATEGORIES && entry.category !== activeCategory) {
        return false;
      }
      if (needle === "") {
        return true;
      }
      return (
        entry.question.toLowerCase().includes(needle) ||
        entry.answer.toLowerCase().includes(needle)
      );
    });
  }, [query, activeCategory]);

  const handleClear = useCallback((): void => {
    setQuery("");
    setActiveCategory(ALL_CATEGORIES);
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
              FAQ
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            Quick answers about joining, our programmes and your member account.
          </p>
        </div>
      </header>

      {/* ── Sticky search + filter rail ──────────────────────────────── */}
      <div className="sticky top-16 z-30 border-y border-ink-800/40 bg-brand-950/95 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <Search
              aria-hidden="true"
              strokeWidth={2}
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            />
            <label htmlFor="faq-search" className="sr-only">
              Search questions
            </label>
            <input
              id="faq-search"
              type="search"
              placeholder="Search questions…"
              value={query}
              onChange={(event): void => setQuery(event.target.value)}
              className={`w-full rounded-full border border-ink-300 bg-white py-2 pl-10 pr-4 text-body-sm text-ink-900 placeholder:text-ink-400 ${FOCUS_RING}`}
            />
          </div>

          <nav aria-label="Filter FAQ by category" className="hide-scrollbar mt-2 overflow-x-auto">
            <ul className="flex min-w-max items-center gap-2">
              {categories.map((category) => {
                const isActive = category === activeCategory;
                return (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={(): void => setActiveCategory(category)}
                      aria-pressed={isActive}
                      className={`rounded-full border px-4 py-1.5 text-caption font-medium transition duration-fast ease-standard motion-reduce:transition-none ${
                        isActive
                          ? "border-accent-300 bg-accent-300 text-brand-950"
                          : "border-ink-700 bg-white/5 text-ink-300 hover:border-accent-300 hover:text-accent-300"
                      } ${FOCUS_RING_DARK}`}
                    >
                      {category}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────── */}
      <section aria-label="Frequently asked questions" className="flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p aria-live="polite" className="sr-only">
            {`${String(visibleEntries.length)} answers shown`}
          </p>

          {visibleEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center">
              <p className="text-body-sm text-ink-500">No answers match your search.</p>
              <button
                type="button"
                onClick={handleClear}
                className={`mt-4 inline-flex items-center justify-center rounded-full bg-accent-300 px-4 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING}`}
              >
                Clear search
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleEntries.map((entry) => (
                <FaqItem key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Still stuck? CTA ─────────────────────────────────────────── */}
      <section aria-label="Still need help" className="bg-accent-300 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-heading-4 text-ink-900">Still stuck?</h2>
          <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-brand-950/80">
            If your question is not answered here, the team will reply within two working
            days.
          </p>
          <Link
            href="/contact"
            className={`mt-5 inline-flex items-center justify-center rounded-full bg-brand-950 px-5 py-2 text-caption font-bold text-accent-300 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-800 ${FOCUS_RING}`}
          >
            Contact the support team
          </Link>
        </div>
      </section>
    </div>
  );
}
