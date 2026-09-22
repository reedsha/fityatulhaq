"use client";

import { FileText } from "lucide-react";
import type { ReactElement } from "react";

import { SectionHeading } from "@/components/home/SectionHeading";
import { SkeletonSection } from "@/components/home/Skeleton";
import { formatDate } from "@/lib/validation";

export interface AnnouncementItem {
  id: string;
  refNumber: string;
  title: string;
  publishedAt: string;
  /** Where the official document lives; mock data points at the listing page. */
  href?: string;
  downloadUrl?: string;
}

export interface AnnouncementsSectionProps {
  announcements: AnnouncementItem[];
  /** Shown under the list when more announcements exist than are displayed. */
  onViewAll?: () => void;
  isLoading?: boolean;
}

/** The homepage is a digest, not the archive. */
const MAX_VISIBLE = 5;

/**
 * Official announcements.
 *
 * Visually quieter than the news grid on purpose: these are formal notices, so
 * they read as a ruled list of documents rather than cards.
 */
export function AnnouncementsSection({
  announcements,
  onViewAll,
  isLoading = false,
}: AnnouncementsSectionProps): ReactElement {
  if (isLoading) {
    return (
      <section aria-label="Official announcements">
        <SkeletonSection count={3} cardClassName="h-16" label="official announcements" />
      </section>
    );
  }

  const visible = announcements.slice(0, MAX_VISIBLE);
  const hasMore = announcements.length > MAX_VISIBLE;

  return (
    <section aria-label="Official announcements">
      <SectionHeading title="Official Announcements" />

      {visible.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-body-sm text-ink-500">
          No announcements have been published yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {visible.map((announcement) => (
            <li key={announcement.id}>
              <a
                href={announcement.href ?? "/announcements"}
                className="group flex items-start gap-3 rounded-r-lg border-l-4 border-brand-700 bg-white px-5 py-4 transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-ink-400 transition group-hover:text-brand-700"
                />

                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-caption text-ink-500">
                    {announcement.refNumber}
                  </span>

                  <span className="mt-0.5 block truncate text-body-sm font-semibold text-ink-900 sm:text-body">
                    {announcement.title}
                  </span>
                </span>

                <time
                  dateTime={announcement.publishedAt}
                  className="shrink-0 pt-1 text-caption text-ink-400"
                >
                  {formatDate(announcement.publishedAt)}
                </time>
              </a>
            </li>
          ))}
        </ul>
      )}

      {hasMore && onViewAll !== undefined ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={onViewAll}
            className="text-body-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            More announcements →
          </button>
        </div>
      ) : null}
    </section>
  );
}
