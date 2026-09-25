import { createHmac } from "node:crypto";

import { createAppError } from "../middleware/errorFormatter";
import type { BoardKey } from "../types";

/**
 * §7.1 anonymity: the public faces of the Youth Care board.
 *
 * Two rules the rest of the codebase depends on:
 *
 *  1. The submitter is ALWAYS recorded (`Post.authorId` / `Comment.authorId`).
 *     Anonymity is a property of the *public payload*, applied here, never of
 *     the row — which is what lets §7.1 promise safety and §7.3 still restrict
 *     an account that abuses the board.
 *  2. The public pseudonym is a keyed digest, not an id. It cannot be reversed
 *     by enumerating cuid values, because the digest needs a server secret.
 *
 * Two pseudonym scopes, which is what the §5.3.2 "strict concealment" option
 * actually toggles:
 *
 *  - default  → derived from `(author, board)`: a stable pseudonym, so one
 *               member's questions read as one recurring voice.
 *  - strict   → derived from `(author, board, item)`: a fresh pseudonym per
 *               item, so nothing links two posts by the same person.
 *
 * Both hide the name and the username absolutely; neither is weaker than §7.1
 * requires.
 */

/** Characters in the displayed code, e.g. `#4F2A9C`. */
const CODE_LENGTH = 6;

/**
 * Separate from `JWT_SECRET` when one is configured, so rotating a session
 * secret does not silently rewrite every pseudonym on the board. The fallback
 * keeps the boot contract unchanged — `JWT_SECRET` is already mandatory.
 */
function getAnonymitySecret(): string {
  const secret = process.env.ANONYMITY_SECRET ?? process.env.JWT_SECRET;

  if (!secret) {
    throw createAppError(
      "MISSING_ENV_VAR",
      "ANONYMITY_SECRET (or JWT_SECRET) is not configured",
      500,
    );
  }

  return secret;
}

export interface AuthorCodeInput {
  authorId: string;
  board: BoardKey;
  /** The thread/comment id; only consulted in strict mode. */
  itemId: string;
  /** §5.3.2 "ต้องการปกปิดตัวตนอย่างเข้มงวด". */
  anonymous: boolean;
}

/**
 * Builds the `#XXXXXX` code shown in place of an identity.
 *
 * Returns the bare code without the `#` or any wording: the label
 * ("ผู้ใช้นิรนาม #…") is presentation and belongs to the frontend.
 */
export function deriveAuthorCode(input: AuthorCodeInput): string {
  const scope = input.anonymous
    ? `${input.authorId}|${input.board}|item:${input.itemId}`
    : `${input.authorId}|${input.board}`;

  // `:` cannot appear in a cuid, so the scoped forms cannot collide.
  const digest = createHmac("sha256", getAnonymitySecret()).update(scope).digest("hex");

  return digest.slice(0, CODE_LENGTH).toUpperCase();
}
