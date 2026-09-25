import { ANNOUNCEMENTS } from "@/lib/announcementData";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledgeData";
import {
  BIOGRAPHIES,
  BOOKS,
  CAMPS,
  COURSES,
  ENCYCLOPEDIA_ENTRIES,
  PAPERS,
  QA_ENTRIES,
  VIDEOS,
  YOUTH_ADVICE_ARTICLES,
} from "@/lib/knowledgeItemsData";
import { NEWS_ITEMS } from "@/lib/newsData";
import { PARTNERS } from "@/lib/partnerData";

/**
 * Unified site search (§5.2.12).
 *
 * **Client-side on purpose.** Every searchable item lives in a plain, server-safe
 * mock module — the backend has no content tables at all, so there is nothing for
 * a search endpoint to query. Building the index from those modules is therefore
 * the only coherent option today, and it keeps the page a guest can reach without
 * a session from needing one.
 *
 * Webboard threads are deliberately absent. §5.2.12 names "กระทู้" among the
 * categories, but threads are live database rows rendered client-side (debt D21),
 * so indexing them needs a backend text search endpoint that M2/M4 never built.
 * Recorded as debt rather than faked with the mock board content — which does not
 * exist, because a forum's is user-generated (M4 decision).
 *
 * Member-only items are indexed and shown (§5.2.12: "แสดงเนื้อหาสมาชิกให้เห็นว่ามีอยู่
 * (พร้อมล็อก)") with a lock badge; the caller routes a guest through the login
 * return flow rather than hiding the row.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The route this index serves. Named here so the header link cannot drift. */
export const SEARCH_PATH = "/search";

export const SEARCH_TYPES = {
  NEWS: "news",
  ANNOUNCEMENT: "announcement",
  COURSE: "course",
  CAMP: "camp",
  ACADEMIC: "academic",
  ENCYCLOPEDIA: "encyclopedia",
  BIOGRAPHY: "biography",
  ADVICE: "advice",
  QA: "qa",
  BOOK: "book",
  VIDEO: "video",
  PARTNER: "partner",
} as const;

export type SearchType = (typeof SEARCH_TYPES)[keyof typeof SEARCH_TYPES];

/** Badge labels, in the order the filter chips and the groups render. */
export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  [SEARCH_TYPES.NEWS]: "ข่าวสาร",
  [SEARCH_TYPES.ANNOUNCEMENT]: "ประกาศ",
  [SEARCH_TYPES.COURSE]: "หลักสูตร",
  [SEARCH_TYPES.CAMP]: "ค่าย",
  [SEARCH_TYPES.ACADEMIC]: "งานวิชาการ",
  [SEARCH_TYPES.ENCYCLOPEDIA]: "สารานุกรม",
  [SEARCH_TYPES.BIOGRAPHY]: "ชีวประวัติ",
  [SEARCH_TYPES.ADVICE]: "คำแนะนำเยาวชน",
  [SEARCH_TYPES.QA]: "มุมถาม–ตอบ",
  [SEARCH_TYPES.BOOK]: "หนังสือ",
  [SEARCH_TYPES.VIDEO]: "วิดีโอ",
  [SEARCH_TYPES.PARTNER]: "พันธมิตร",
};

/** The filter order; also the group order in the results. */
export const SEARCH_TYPE_ORDER: readonly SearchType[] = [
  SEARCH_TYPES.NEWS,
  SEARCH_TYPES.ANNOUNCEMENT,
  SEARCH_TYPES.COURSE,
  SEARCH_TYPES.CAMP,
  SEARCH_TYPES.ACADEMIC,
  SEARCH_TYPES.ENCYCLOPEDIA,
  SEARCH_TYPES.BIOGRAPHY,
  SEARCH_TYPES.ADVICE,
  SEARCH_TYPES.QA,
  SEARCH_TYPES.BOOK,
  SEARCH_TYPES.VIDEO,
  SEARCH_TYPES.PARTNER,
];

export interface SearchEntry {
  /** Unique across types; the React key is `type:id`. */
  id: string;
  type: SearchType;
  title: string;
  /** One line of context under the title. */
  snippet: string;
  href: string;
  /** §6.4 — members-only collections show a lock instead of hiding. */
  membersOnly: boolean;
  /** Extra text that is searched but never rendered (tags, authors, refs). */
  keywords: string[];
}

export interface SearchGroup {
  type: SearchType;
  label: string;
  /** The capped page of results, ranked title-match first. */
  items: SearchEntry[];
  /**
   * How many entries matched before the per-group cap was applied. Equal to
   * `items.length` unless the group was truncated — the UI uses the difference to
   * say "showing N of M" rather than silently dropping the rest.
   */
  total: number;
}

// ---------------------------------------------------------------------------
// Building the index
// ---------------------------------------------------------------------------

/** Category slugs that §6.4 gates behind membership (mirrors `knowledgeData`). */
const MEMBERS_ONLY_CATEGORIES = new Set(
  KNOWLEDGE_CATEGORIES.filter((category) => category.membersOnly).map(
    (category) => category.slug,
  ),
);

function knowledgeHref(slug: string): string {
  return `/knowledge/${slug}`;
}

function buildEntries(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const item of NEWS_ITEMS) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.NEWS,
      title: item.title,
      snippet: item.excerpt,
      href: `/news/${item.id}`,
      membersOnly: false,
      keywords: [item.department, item.authorName],
    });
  }

  for (const item of ANNOUNCEMENTS) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.ANNOUNCEMENT,
      title: item.title,
      snippet: item.refNumber,
      href: `/announcements/${item.id}`,
      membersOnly: false,
      keywords: [item.refNumber],
    });
  }

  for (const item of COURSES) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.COURSE,
      title: item.title,
      snippet: item.description,
      href: knowledgeHref("courses"),
      membersOnly: false,
      keywords: [item.difficulty],
    });
  }

  for (const item of CAMPS) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.CAMP,
      title: item.title,
      snippet: item.summary,
      href: knowledgeHref("camps"),
      membersOnly: false,
      keywords: [item.location, item.season],
    });
  }

  for (const item of PAPERS) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.ACADEMIC,
      title: item.title,
      snippet: item.abstract,
      href: knowledgeHref("academic"),
      membersOnly: MEMBERS_ONLY_CATEGORIES.has("academic"),
      keywords: [item.authors, ...item.tags],
    });
  }

  for (const item of ENCYCLOPEDIA_ENTRIES) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.ENCYCLOPEDIA,
      title: item.title,
      snippet: item.summary,
      href: knowledgeHref("encyclopedia"),
      membersOnly: false,
      keywords: item.tags,
    });
  }

  for (const item of BIOGRAPHIES) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.BIOGRAPHY,
      title: item.name,
      snippet: item.summary,
      href: knowledgeHref("biography"),
      membersOnly: false,
      keywords: [item.field],
    });
  }

  for (const item of YOUTH_ADVICE_ARTICLES) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.ADVICE,
      title: item.title,
      snippet: item.paragraphs[0] ?? "",
      href: knowledgeHref("youth-advice"),
      membersOnly: false,
      keywords: [item.topic],
    });
  }

  for (const item of QA_ENTRIES) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.QA,
      title: item.question,
      snippet: item.answer,
      href: knowledgeHref("qa"),
      membersOnly: false,
      keywords: [],
    });
  }

  for (const item of BOOKS) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.BOOK,
      title: item.title,
      snippet: item.abstract,
      href: knowledgeHref("books"),
      membersOnly: MEMBERS_ONLY_CATEGORIES.has("books"),
      keywords: [item.author],
    });
  }

  for (const item of VIDEOS) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.VIDEO,
      title: item.title,
      snippet: item.description,
      href: knowledgeHref("videos"),
      membersOnly: MEMBERS_ONLY_CATEGORIES.has("videos"),
      keywords: [item.topic],
    });
  }

  for (const item of PARTNERS) {
    entries.push({
      id: item.id,
      type: SEARCH_TYPES.PARTNER,
      title: item.name,
      snippet: item.description,
      href: "/partners",
      membersOnly: false,
      keywords: [item.category],
    });
  }

  return entries;
}

export const SEARCH_ENTRIES: readonly SearchEntry[] = buildEntries();

/**
 * Lowercased haystacks, computed once at module load: the full searchable text
 * per entry, and the title alone for ranking.
 *
 * Two maps rather than one because `includes()` cannot express relevance — the
 * title is kept separate so a title match can be ordered above a body match
 * without a second pass over the data.
 */
function haystackOf(entry: SearchEntry, parts: readonly string[]): string {
  return parts.join("\n").toLowerCase();
}

const HAYSTACKS: Map<string, string> = new Map(
  SEARCH_ENTRIES.map((entry) => [
    `${entry.type}:${entry.id}`,
    haystackOf(entry, [entry.title, entry.snippet, ...entry.keywords]),
  ]),
);

const TITLE_HAYSTACKS: Map<string, string> = new Map(
  SEARCH_ENTRIES.map((entry) => [`${entry.type}:${entry.id}`, haystackOf(entry, [entry.title])]),
);

function keyOf(entry: SearchEntry): string {
  return `${entry.type}:${entry.id}`;
}

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

/** Result cap per group, so one type cannot bury the rest. */
const MAX_PER_GROUP = 8;

export const MIN_SEARCH_QUERY_LENGTH = 2;

/**
 * Splits a query into lowercase tokens on whitespace.
 *
 * Thai is written without word spaces, so a conjunction of tokens is a poor
 * model in general — but a query that *does* contain spaces is a user asking for
 * all of those words, and AND-ing them is the least surprising reading. A
 * single-token query (the common case) is unaffected.
 */
function tokenise(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

/**
 * Runs the query and returns non-empty groups in `SEARCH_TYPE_ORDER`.
 *
 * An empty (or too-short) query returns `[]` rather than everything: §5.2.12
 * describes a search page, and dumping the whole index on first paint would make
 * the empty state indistinguishable from a broken one.
 */
export function searchContent(
  query: string,
  types: readonly SearchType[] = SEARCH_TYPE_ORDER,
): SearchGroup[] {
  const tokens = tokenise(query);

  if (tokens.length === 0 || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return [];
  }

  const allowed = new Set(types);
  const groups: SearchGroup[] = [];

  for (const type of SEARCH_TYPE_ORDER) {
    if (!allowed.has(type)) {
      continue;
    }

    const matches = SEARCH_ENTRIES.filter((entry) => entry.type === type).filter((entry) => {
      const haystack = HAYSTACKS.get(keyOf(entry)) ?? "";

      return tokens.every((token) => haystack.includes(token));
    });

    if (matches.length === 0) {
      continue;
    }

    // Title matches first, then insertion order. `Array.prototype.sort` is
    // stable, so entries that rank equally keep the source module's order — which
    // is chronological for news and announcements, the order a reader expects.
    const ranked = [...matches].sort((left, right) => rankOf(left, tokens) - rankOf(right, tokens));

    groups.push({
      type,
      label: SEARCH_TYPE_LABELS[type],
      items: ranked.slice(0, MAX_PER_GROUP),
      total: ranked.length,
    });
  }

  return groups;
}

/** 0 when every token appears in the title, 1 otherwise — lower sorts first. */
function rankOf(entry: SearchEntry, tokens: readonly string[]): number {
  const title = TITLE_HAYSTACKS.get(keyOf(entry)) ?? "";

  return tokens.every((token) => title.includes(token)) ? 0 : 1;
}

/**
 * Total matching rows across groups — what the results summary announces.
 *
 * Counts `total`, not the displayed page, so the announcement reports how many
 * results exist rather than how many fit under the per-group cap.
 */
export function countResults(groups: readonly SearchGroup[]): number {
  return groups.reduce((total, group) => total + group.total, 0);
}
