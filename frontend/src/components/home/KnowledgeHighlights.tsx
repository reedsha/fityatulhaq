"use client";

import { ChevronRight, Clock } from "lucide-react";
import type { ReactElement } from "react";

import { SectionHeading } from "@/components/home/SectionHeading";
import { SkeletonSection } from "@/components/home/Skeleton";

export type KnowledgeCategory =
  | "courses"
  | "camps"
  | "books"
  | "encyclopedia"
  | "videos"
  | string;

export interface KnowledgeCardData {
  id: string;
  title: string;
  category: KnowledgeCategory;
  coverUrl?: string;
  duration?: string;
  level?: string;
}

export interface KnowledgeHighlightsProps {
  items: KnowledgeCardData[];
  onViewAll: () => void;
  isLoading?: boolean;
}

/** Featured row size; everything after it renders as a compact row. */
const FEATURED_COUNT = 3;

/**
 * Pastel treatment per category. An unknown category falls back to the neutral
 * slate pair rather than rendering with no classes at all.
 */
const CATEGORY_STYLES: Record<string, { badge: string; gradient: string }> = {
  courses: { badge: "bg-brand-50 text-brand-700", gradient: "from-brand-500 to-brand-700" },
  camps: { badge: "bg-state-info-50 text-state-info-700", gradient: "from-state-info-500 to-state-info-700" },
  books: { badge: "bg-state-warning-50 text-state-warning-700", gradient: "from-state-warning-400 to-state-warning-600" },
  encyclopedia: { badge: "bg-accent-50 text-accent-700", gradient: "from-accent-500 to-accent-700" },
  videos: { badge: "bg-tertiary-50 text-tertiary-700", gradient: "from-tertiary-500 to-tertiary-700" },
};

const FALLBACK_STYLE = { badge: "bg-ink-100 text-ink-700", gradient: "from-ink-500 to-ink-700" };

function styleFor(category: string): { badge: string; gradient: string } {
  return CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
}

function isGradient(imageUrl: string | undefined): boolean {
  return (
    imageUrl !== undefined &&
    (imageUrl.startsWith("linear-gradient") || imageUrl.startsWith("radial-gradient"))
  );
}

function CategoryBadge({ category }: { category: string }): ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium capitalize ${styleFor(category).badge}`}
    >
      {category}
    </span>
  );
}

/** Cover area shared by both card sizes: gradient placeholder or a real image. */
function Cover({
  coverUrl,
  title,
  category,
  className,
}: {
  coverUrl?: string;
  title: string;
  category: string;
  className: string;
}): ReactElement {
  if (isGradient(coverUrl)) {
    return (
      <div
        role="img"
        aria-label={`Illustration for ${title}`}
        style={{ backgroundImage: coverUrl }}
        className={className}
      />
    );
  }

  if (coverUrl !== undefined) {
    return (
      <img
        src={coverUrl}
        alt={`Cover image for ${title}`}
        loading="lazy"
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Illustration for ${title}`}
      className={`${className} bg-gradient-to-br ${styleFor(category).gradient}`}
    />
  );
}

/**
 * Knowledge highlights.
 *
 * The first three items lead as large covers; the remainder become compact rows,
 * so a short list still fills the section without awkward gaps.
 */
export function KnowledgeHighlights({
  items,
  onViewAll,
  isLoading = false,
}: KnowledgeHighlightsProps): ReactElement {
  if (isLoading) {
    return (
      <section aria-label="Explore and learn">
        <SkeletonSection label="knowledge highlights" />
      </section>
    );
  }

  const featured = items.slice(0, FEATURED_COUNT);
  const compact = items.slice(FEATURED_COUNT);

  return (
    <section aria-label="Explore and learn">
      <SectionHeading
        title="Explore & Learn"
        action={
          <p className="text-body-sm text-ink-500">
            Access courses, encyclopedias, books, and exclusive resources.
          </p>
        }
      />

      {items.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-body-sm text-ink-500">
          The knowledge hub is being stocked. Please check back soon.
        </p>
      ) : (
        <>
          {featured.length > 0 ? (
            <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {featured.map((item) => (
                <li key={item.id}>
                  <a
                    href="/knowledge"
                    className="group block overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card transition duration-300 ease-out hover:scale-[1.02] hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Cover
                        coverUrl={item.coverUrl}
                        title={item.title}
                        category={item.category}
                        className="absolute inset-0 h-full w-full"
                      />

                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-transparent"
                      />

                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                        <h3 className="text-heading-4 text-white [text-shadow:0_1px_3px_rgba(15,23,42,0.8)]">
                          {item.title}
                        </h3>

                        {item.level !== undefined ? (
                          <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-caption font-medium text-ink-700">
                            {item.level}
                          </span>
                        ) : null}
                      </div>

                      <div className="absolute left-4 top-4">
                        <CategoryBadge category={item.category} />
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {compact.length > 0 ? (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {compact.map((item) => (
                <li key={item.id}>
                  <a
                    href="/knowledge"
                    className="group flex items-center gap-4 rounded-lg border border-ink-200 bg-white p-3 transition hover:border-brand-600 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                  >
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded">
                      <Cover
                        coverUrl={item.coverUrl}
                        title={item.title}
                        category={item.category}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-body-sm font-semibold text-ink-900">
                        {item.title}
                      </h3>

                      <div className="mt-1.5">
                        <CategoryBadge category={item.category} />
                      </div>

                      {item.duration !== undefined ? (
                        <p className="mt-1.5 flex items-center gap-1 text-caption text-ink-400">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {item.duration}
                        </p>
                      ) : null}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <div className="mt-8">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Browse all knowledge
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
