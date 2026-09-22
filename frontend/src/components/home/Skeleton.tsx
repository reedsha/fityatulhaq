import type { ReactElement } from "react";

export interface SkeletonBlockProps {
  /** Tailwind sizing classes, e.g. `"h-4 w-full"` or `"h-48 w-full rounded-xl"`. */
  className?: string;
}

/**
 * Placeholder block shown while a section's data is loading.
 *
 * Deliberately a dumb primitive: each section knows the shape of its own
 * content, so it composes these into a layout that mirrors the real cards
 * rather than stretching one generic bar across the page.
 */
export function SkeletonBlock({ className = "" }: SkeletonBlockProps): ReactElement {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-md bg-ink-200 ${className}`} />
  );
}

export interface SkeletonSectionProps {
  /** Number of placeholder cards to lay out. */
  count?: number;
  /** Classes for each card placeholder, matching the real card's footprint. */
  cardClassName?: string;
  label: string;
}

/**
 * A section-sized loading state: a heading bar plus a row of card placeholders.
 * Announced to assistive technology as loading, so the wait is not silent.
 */
export function SkeletonSection({
  count = 3,
  cardClassName = "h-64",
  label,
}: SkeletonSectionProps): ReactElement {
  return (
    <div role="status" className="animate-pulse">
      <SkeletonBlock className="h-7 w-48" />

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <SkeletonBlock key={index} className={cardClassName} />
        ))}
      </div>

      <span className="sr-only">Loading {label}</span>
    </div>
  );
}
