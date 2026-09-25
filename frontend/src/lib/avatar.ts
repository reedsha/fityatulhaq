/**
 * Member initials for avatar fallbacks.
 *
 * Shared by the profile uploader (the large circle) and the header's account
 * controls (the small circle) so the two can never disagree about how a name is
 * abbreviated. Latin names give two letters (`Ahmad bin Abdullah` → `AA`); Thai
 * names carry no spaces and therefore resolve to a single letter. Partner
 * monograms are a different concern (first letters of the two leading words) and
 * keep their own helper.
 *
 * The initial is taken by code point rather than by UTF-16 unit, so a name that
 * opens with a non-BMP character cannot be cut in half.
 */
export function initialsOf(fullName: string): string {
  const parts = fullName
    .trim()
    .split(" ")
    .filter((part) => part.length > 0);

  const initialOf = (part: string): string => Array.from(part)[0] ?? "";

  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] ?? "" : "";

  return `${initialOf(first)}${initialOf(last)}`.toUpperCase() || "?";
}
