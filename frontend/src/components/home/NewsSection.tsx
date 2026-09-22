"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactElement } from "react";

import { SectionHeading } from "@/components/home/SectionHeading";
import { SkeletonSection } from "@/components/home/Skeleton";
import { formatDate } from "@/lib/validation";

export interface NewsCardData {
  id: string;
  title: string;
  excerpt: string;
  coverUrl?: string;
  department: string;
  publishedAt: string;
  authorName: string;
}

export interface NewsSectionProps {
  newsItems: NewsCardData[];
  onViewAll: () => void;
  /** Shows the section skeleton instead of the grid while data is in flight. */
  isLoading?: boolean;
}

/** How many cards the homepage shows before handing off to the archive page. */
const MAX_VISIBLE_CARDS = 6;

const ALL_FILTER = "All";

function isGradient(imageUrl: string | undefined): boolean {
  return (
    imageUrl !== undefined &&
    (imageUrl.startsWith("linear-gradient") || imageUrl.startsWith("radial-gradient"))
  );
}

/**
 * Latest news.
 *
 * Filtering is client-side over the cards already handed to the component; the
 * department tabs only ever list departments that actually appear in the data,
 * so an empty filter cannot be selected.
 */
export function NewsSection({
  newsItems,
  onViewAll,
  isLoading = false,
}: NewsSectionProps): ReactElement {
  const [activeDepartment, setActiveDepartment] = useState<string>(ALL_FILTER);

  const departments = useMemo((): string[] => {
    const seen = new Set<string>();

    for (const item of newsItems) {
      seen.add(item.department);
    }

    return [ALL_FILTER, ...Array.from(seen)];
  }, [newsItems]);

  const visibleItems = useMemo((): NewsCardData[] => {
    const filtered =
      activeDepartment === ALL_FILTER
        ? newsItems
        : newsItems.filter((item) => item.department === activeDepartment);

    return filtered.slice(0, MAX_VISIBLE_CARDS);
  }, [activeDepartment, newsItems]);

  if (isLoading) {
    return (
      <section aria-label="Latest news">
        <SkeletonSection label="the latest news" />
      </section>
    );
  }

  const hasMore = newsItems.length > MAX_VISIBLE_CARDS;

  return (
    <section aria-label="Latest news">
      <SectionHeading
        title="Latest News"
        action={
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            View All
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        }
      />

      <nav
        aria-label="Filter news by department"
        className="hide-scrollbar -mx-4 mt-6 overflow-x-auto px-4"
      >
        <ul className="flex w-max items-center gap-2">
          {departments.map((department) => {
            const isActive = department === activeDepartment;

            return (
              <li key={department}>
                <button
                  type="button"
                  onClick={(): void => setActiveDepartment(department)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-4 py-1.5 text-body-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                    isActive
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-600 hover:text-brand-700"
                  }`}
                >
                  {department}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {visibleItems.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-body-sm text-ink-500">
          No news in this department yet. Check back soon, or pick another department.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {visibleItems.map((item) => {
            const gradient = isGradient(item.coverUrl);

            return (
              <li key={item.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card transition duration-200 hover:shadow-card-hover focus-within:shadow-card-hover">
                  <div className="aspect-video w-full overflow-hidden bg-ink-100">
                    {gradient ? (
                      <div
                        role="img"
                        aria-label={`Illustration for ${item.title}`}
                        style={{ backgroundImage: item.coverUrl }}
                        className="h-full w-full"
                      />
                    ) : item.coverUrl !== undefined ? (
                      <img
                        src={item.coverUrl}
                        alt={`Cover image for ${item.title}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        role="img"
                        aria-label={`Illustration for ${item.title}`}
                        className="h-full w-full bg-gradient-to-br from-brand-50 via-brand-100 to-ink-200"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-caption font-medium text-brand-700">
                      {item.department}
                    </span>

                    <h3 className="mt-3 line-clamp-2 text-heading-4 text-ink-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-body-sm leading-relaxed text-ink-500">
                      {item.excerpt}
                    </p>

                    <p className="mt-auto pt-4 text-caption text-ink-400">
                      <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                      {" · "}
                      {item.authorName}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore ? (
        <div className="mt-8 text-right">
          <button
            type="button"
            onClick={onViewAll}
            className="text-body-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            More news →
          </button>
        </div>
      ) : null}
    </section>
  );
}
