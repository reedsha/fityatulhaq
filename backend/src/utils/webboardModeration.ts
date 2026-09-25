import { createAppError } from "../middleware/errorFormatter";
import {
  MODERATION_ACTIONS,
  MODERATION_STATUSES,
  type ModerationAction,
  type ModerationStatusValue,
} from "../types";

/**
 * The moderation decision table, kept out of the service so it is a pure
 * function of the request: what a decision does to a row is the part worth
 * being certain about, and it is the part a query cannot express.
 */

const PUBLISHED = MODERATION_STATUSES.PUBLISHED;
const HIDDEN = MODERATION_STATUSES.HIDDEN;
const REJECTED = MODERATION_STATUSES.REJECTED;

export interface ModerationDecisionInput {
  action: ModerationAction;
  reason: string | null;
}

export interface ModerationOutcome {
  moderation: ModerationStatusValue;
  note: string | null;
}

/**
 * Maps a decision onto the resulting row state.
 *
 * A rejection must carry a reason — §7.1 has staff reject *and* explain, and
 * the reason is what the author is shown. Approving clears any earlier note, so
 * a thread that is reinstated cannot keep displaying a stale objection.
 *
 * `hide` and `restore` are the §7.2 pair for post-moderated content: nothing
 * was wrong enough to refuse it, but it is out of public view (or back in it).
 */
export function resolveModerationOutcome(input: ModerationDecisionInput): ModerationOutcome {
  const note = input.reason !== null && input.reason.trim() !== "" ? input.reason.trim() : null;

  switch (input.action) {
    case MODERATION_ACTIONS.APPROVE:
      return { moderation: PUBLISHED, note: null };
    case MODERATION_ACTIONS.RESTORE:
      return { moderation: PUBLISHED, note };
    case MODERATION_ACTIONS.HIDE:
      return { moderation: HIDDEN, note };
    case MODERATION_ACTIONS.REJECT:
      if (note === null) {
        throw createAppError(
          "MODERATION_REASON_REQUIRED",
          "A reason is required when rejecting content",
          400,
        );
      }

      return { moderation: REJECTED, note };
  }
}
