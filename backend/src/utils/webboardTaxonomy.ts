import { BOARDS, BOARD_KEYS, type BoardKey } from "../types";

/**
 * The two code-defined webboard catalogues: board behaviour and board tags.
 *
 * Both live in code rather than in tables because the PRD fixes them — §5.3
 * names exactly two boards, and §8.1 gives Web 2 no "manage boards" or "manage
 * tags" module, so there is nothing an administrator could add later. This
 * mirrors how the knowledge categories are defined in the frontend.
 */

/**
 * Per-board behaviour. Keeping the rules in one table rather than scattering
 * `board === BOARDS.YOUTH_CARE` checks across the services is what makes the
 * two regimes auditable side by side.
 */
export interface BoardRules {
  /** True → new items start as PENDING and wait for a moderator (§7.1). */
  isPreModerated: boolean;
  /** §5.3.3 tags the general board only; Youth Care has no category chips. */
  allowsTags: boolean;
  /**
   * True → public payloads carry a pseudonym instead of an identity (§7.1).
   * Youth Care is anonymous for every post and comment, always.
   */
  isAnonymous: boolean;
  /** True → the §5.3.2 \"รอตอบ / ทีมงานตอบแล้ว\" toggle applies. */
  hasAnswerStatus: boolean;
}

export const BOARD_RULES: Record<BoardKey, BoardRules> = {
  [BOARDS.YOUTH_CARE]: {
    isPreModerated: true,
    allowsTags: false,
    isAnonymous: true,
    hasAnswerStatus: true,
  },
  [BOARDS.GENERAL]: {
    isPreModerated: false,
    allowsTags: true,
    isAnonymous: false,
    hasAnswerStatus: false,
  },
};

/** Narrows an arbitrary string (a route param, a query value) to a board key. */
export function isBoardKey(value: unknown): value is BoardKey {
  return typeof value === "string" && (BOARD_KEYS as readonly string[]).includes(value);
}

export interface BoardTag {
  /** Stable machine key — what is stored on `Post.tags`. */
  slug: string;
  /** Thai label rendered on the chip. */
  label: string;
}

/**
 * §5.3.3 \"หมวดหมู่ (แท็ก)\" — a small, general-purpose set for the open board.
 * Slugs are English machine keys (the same convention the knowledge content
 * uses: Thai is display, slugs key the lookups).
 */
export const BOARD_TAGS: readonly BoardTag[] = [
  { slug: "general", label: "พูดคุยทั่วไป" },
  { slug: "introductions", label: "แนะนำตัว" },
  { slug: "questions", label: "ถาม-ตอบ" },
  { slug: "events", label: "กิจกรรม" },
  { slug: "resources", label: "แหล่งความรู้" },
  { slug: "feedback", label: "ข้อเสนอแนะ" },
];

const TAG_BY_SLUG = new Map(BOARD_TAGS.map((tag) => [tag.slug, tag]));

export function isKnownTagSlug(slug: string): boolean {
  return TAG_BY_SLUG.has(slug);
}

/** Display label for a stored slug, falling back to the slug itself. */
export function tagLabel(slug: string): string {
  return TAG_BY_SLUG.get(slug)?.label ?? slug;
}

/**
 * Validates and de-duplicates a client-supplied tag list.
 *
 * Unknown slugs are rejected rather than silently dropped: a caller that sends
 * one has a bug, and quietly discarding it would make the mistake invisible.
 */
export function resolveTagSlugs(raw: readonly string[]): string[] {
  const seen = new Set<string>();

  for (const slug of raw) {
    if (!isKnownTagSlug(slug)) {
      throw new Error(`Unknown webboard tag: ${slug}`);
    }

    seen.add(slug);
  }

  return Array.from(seen);
}
