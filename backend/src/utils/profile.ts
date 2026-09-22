import { createAppError } from "../middleware/errorFormatter";

/**
 * Input normalisation shared by the flows that write to a `User` row.
 *
 * Both the registration and the profile-update path accept the same optional
 * columns, so the rules for "absent", "empty" and "present" live here once
 * instead of drifting apart between the two services.
 */

/**
 * Trims a free-text value.
 *
 * - `undefined` means the caller did not mention the field: the column is left alone.
 * - An empty (or whitespace-only) string means "clear it": mapped to `null`.
 * - Anything else is the trimmed value.
 */
export function normaliseOptionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Parses an ISO 8601 date of birth.
 *
 * `undefined` and empty strings both clear the column, which lets the same
 * helper serve registration (where the field is optional) and profile updates
 * (where an emptied date input must blank the stored value).
 */
export function parseBirthDate(rawBirthDate: string | undefined): Date | null {
  if (rawBirthDate === undefined || rawBirthDate.trim() === "") {
    return null;
  }

  const parsed = new Date(rawBirthDate);

  if (Number.isNaN(parsed.getTime())) {
    throw createAppError(
      "INVALID_BIRTH_DATE",
      "birthDate must be a valid ISO 8601 date",
      400,
    );
  }

  return parsed;
}
