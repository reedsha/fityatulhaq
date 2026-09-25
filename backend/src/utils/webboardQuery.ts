import {
  THREAD_SORTS,
  YOUTH_CARE_FILTERS,
  type ThreadSort,
  type YouthCareFilter,
} from "../types";

/**
 * Pure query-shaping helpers for the webboard list endpoints.
 *
 * Kept out of the service so the whole of it is testable without a database:
 * these decide what the API accepts, and a bad default here is a silently wrong
 * page rather than an error.
 */

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export const DEFAULT_PAGE_SIZE = 10;

/** §5.3 lists are browsed by hand; a 50-row page is already unusual. */
export const MAX_PAGE_SIZE = 50;

/**
 * Reads an integer that may have arrived as a query string. Anything that is
 * not a positive integer — absent, empty, `"abc"`, `"0"`, `"-3"` — is treated
 * as absent so a malformed link degrades to page 1 instead of erroring.
 */
function readPositiveInt(raw: unknown): number | null {
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Normalises `?page=`/`?limit=` into a `skip`/`take` pair.
 *
 * `limit` is clamped rather than rejected: a caller asking for 5000 rows gets
 * the maximum page instead of an error, which keeps a stale bookmark working.
 */
export function parsePagination(
  query: { page?: unknown; limit?: unknown },
  defaultLimit: number = DEFAULT_PAGE_SIZE,
): Pagination {
  const page = readPositiveInt(query.page) ?? 1;
  const requestedLimit = readPositiveInt(query.limit) ?? defaultLimit;
  const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);

  return { page, limit, skip: (page - 1) * limit };
}

/** §5.3.3 sort menu. An unknown value falls back to the default ordering. */
export function resolveThreadSort(raw: unknown): ThreadSort {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (value === THREAD_SORTS.POPULAR) {
    return THREAD_SORTS.POPULAR;
  }

  if (value === THREAD_SORTS.MOST_REPLIED) {
    return THREAD_SORTS.MOST_REPLIED;
  }

  return THREAD_SORTS.LATEST;
}

/** §5.3.2 "รอตอบ / ทีมงานตอบแล้ว" toggle. Unknown values mean "show all". */
export function resolveYouthCareFilter(raw: unknown): YouthCareFilter {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (value === YOUTH_CARE_FILTERS.ANSWERED) {
    return YOUTH_CARE_FILTERS.ANSWERED;
  }

  if (value === YOUTH_CARE_FILTERS.UNANSWERED) {
    return YOUTH_CARE_FILTERS.UNANSWERED;
  }

  return YOUTH_CARE_FILTERS.ALL;
}

const EXCERPT_LENGTH = 180;

/** Fraction of the budget a space must sit at to be worth cutting on. */
const MIN_WORD_BOUNDARY_RATIO = 0.6;

/**
 * Builds the list preview: whitespace collapsed, hard-bounded, with an ellipsis
 * only when something was actually dropped.
 */
export function toExcerpt(body: string, maxLength: number = EXCERPT_LENGTH): string {
  const collapsed = body.replace(/\s+/g, " ").trim();

  if (collapsed.length <= maxLength) {
    return collapsed;
  }

  const slice = collapsed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");

  // Prefer the last whole word, but only when the space is late enough that
  // cutting there is still an excerpt rather than a fragment. Thai text has no
  // spaces, so there the hard cut simply stands.
  const cut = lastSpace > maxLength * MIN_WORD_BOUNDARY_RATIO ? slice.slice(0, lastSpace) : slice;

  return `${cut.trimEnd()}…`;
}
