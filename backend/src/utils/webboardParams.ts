import type { Request } from "express";

import { createAppError } from "../middleware/errorFormatter";
import type { BoardKey } from "../types";
import { isBoardKey } from "./webboardTaxonomy";

/**
 * Readers for the webboard request shapes, shared by the public and the
 * moderation controllers so a param is validated identically on both.
 *
 * All four are total: they either return a usable value or throw the
 * application error the caller should answer with, which keeps the controllers
 * free of `undefined` branching.
 */

/** Longest id the API will look up, matching the assets endpoint's bound. */
export const MAX_ID_LENGTH = 200;

/** What a missing id is *of* — the 404 has to name the right resource. */
export type MissingResource = "thread" | "comment" | "report" | "notification";

const NOT_FOUND: Record<MissingResource, { code: string; message: string }> = {
  thread: { code: "THREAD_NOT_FOUND", message: "Thread not found" },
  comment: { code: "COMMENT_NOT_FOUND", message: "Comment not found" },
  report: { code: "REPORT_NOT_FOUND", message: "Report not found" },
  notification: { code: "NOTIFICATION_NOT_FOUND", message: "Notification not found" },
};

export function readIdParam(raw: unknown, resource: MissingResource): string {
  if (typeof raw !== "string" || raw.trim() === "" || raw.length > MAX_ID_LENGTH) {
    const { code, message } = NOT_FOUND[resource];

    throw createAppError(code, message, 404);
  }

  return raw.trim();
}

export function readBoardParam(raw: unknown): BoardKey {
  if (!isBoardKey(raw)) {
    throw createAppError("BOARD_NOT_FOUND", "Unknown board", 404);
  }

  return raw;
}

/**
 * Reads the caller id a write requires. Still needed even though the routes
 * authenticate: this is the second half of the guard, so a write can never
 * proceed on an empty id if the middleware order is ever changed.
 */
export function requireUserId(req: Request): string {
  const userId = req.user?.id ?? "";

  if (userId.length === 0) {
    throw createAppError("UNAUTHORIZED", "Authentication required", 401);
  }

  return userId;
}

export function readOptionalQueryString(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
}
