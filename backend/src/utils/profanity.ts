/**
 * §7.3 "Basic Profanity Filter" (ระบบตรวจจับคำหยาบเบื้องต้น).
 *
 * Deliberately a *preliminary* screen, as the PRD words it: it rejects the
 * obvious cases before a post is stored, so the moderation queue is not the only
 * thing standing between the board and abuse. It is not a classifier and it does
 * not try to defeat deliberate evasion (leet spellings, spaced-out letters).
 *
 * Matching is a plain substring scan for both scripts, which is why the lists
 * below are curated rather than scraped:
 *
 *  - Thai has no word delimiters to anchor on, so substring is the only option;
 *    the list therefore holds only distinctive terms. Two otherwise-obvious
 *    candidates were removed for exactly this reason: "สัด" hides inside
 *    "สัดส่วน" (proportion) and "แม่ง" inside "แม่งาน" (foreman) — a rejection
 *    there would block a member writing about work, with no way to rephrase.
 *  - Latin terms are matched as substrings too, so that compounds are caught —
 *    "shithead", "bullshit" and "motherfucker" all contain a listed term, and a
 *    word-boundary rule would miss every one of them. That only works while
 *    every listed term is also free of innocent superstrings, which is why
 *    "retard" is excluded (it would reject "fire retardant") while "retarded"
 *    is kept. The known residual collision is the place name "Scunthorpe",
 *    accepted as the price of catching compounds; the failure mode is a
 *    rejection the author can edit and resubmit, never silent data loss.
 */

/** Thai insults, kept to terms that do not hide inside ordinary words. */
const THAI_TERMS: readonly string[] = [
  "ควย",
  "เย็ด",
  "เหี้ย",
  "ระยำ",
  "ตอแหล",
  "ชาติหมา",
  "ไอ้สัตว์",
  "ไอ้เวร",
  "อีดอก",
  "ไอ้หมา",
];

/** Latin terms, each free of innocent English superstrings. */
const LATIN_TERMS: readonly string[] = [
  "fuck",
  "fucked",
  "fucker",
  "fucking",
  "shit",
  "shitty",
  "bitch",
  "bitches",
  "bastard",
  "asshole",
  "assholes",
  "cunt",
  "whore",
  "slut",
  "nigger",
  "faggot",
  "retarded",
];

const ALL_TERMS: readonly string[] = [...THAI_TERMS, ...LATIN_TERMS];

/**
 * Folds away the casing and the invisible characters that are the cheapest way
 * to walk a naive filter — `f​uck` with a zero-width space in the middle, a
 * right-to-left mark, or plain `FUCK`.
 *
 * The class covers the zero-width and directional formatting marks
 * (U+200B–U+200F), the word joiner, the BOM, and the soft hyphen.
 */
export function normaliseForFilter(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u00AD\u200B-\u200F\u2060\uFEFF]/g, "");
}

/**
 * Returns the distinct terms the text tripped, or an empty array when it is
 * clean. The matches are returned rather than a boolean so the caller can log
 * what was caught without logging the whole submission.
 */
export function findProfanityTerms(text: string): string[] {
  const normalised = normaliseForFilter(text);
  const matched = new Set<string>();

  for (const term of ALL_TERMS) {
    if (normalised.includes(term)) {
      matched.add(term);
    }
  }

  return Array.from(matched);
}

export function isCleanText(text: string): boolean {
  return findProfanityTerms(text).length === 0;
}
