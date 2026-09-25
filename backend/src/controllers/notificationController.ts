import type { NextFunction, Request, Response } from "express";

import { formatAuthResponse, toHttpError } from "../middleware/errorFormatter";
import * as notificationService from "../services/notificationService";
import { parsePagination } from "../utils/webboardQuery";
import { readIdParam, requireUserId } from "../utils/webboardParams";

/**
 * Notification endpoints — §3.3 (the bell's badge) and §5.4.5 (the tab).
 *
 * Every route is member-only (the route table applies the gate), so nothing here
 * re-checks a role. Each handler scopes its query to `requireUserId(req)`, which
 * is why there is no view of anyone else's feed to protect.
 */

const LIST_FALLBACK = {
  code: "NOTIFICATIONS_LIST_FAILED",
  message: "Unable to load the notifications",
} as const;

const COUNT_FALLBACK = {
  code: "NOTIFICATIONS_COUNT_FAILED",
  message: "Unable to count the unread notifications",
} as const;

const READ_FALLBACK = {
  code: "NOTIFICATION_READ_FAILED",
  message: "Unable to mark the notification read",
} as const;

/** §5.4.5 — one page of the caller's notifications, newest first. */
export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const result = await notificationService.listNotifications({
      userId: requireUserId(req),
      skip,
      take: limit,
    });

    res
      .status(200)
      .json(formatAuthResponse(result.notifications, { page, limit, total: result.total }));
  } catch (error) {
    next(toHttpError(error, LIST_FALLBACK));
  }
}

/** §3.3 — the number the bell's red dot carries. */
export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const count = await notificationService.countUnread(requireUserId(req));
    res.status(200).json(formatAuthResponse({ count }));
  } catch (error) {
    next(toHttpError(error, COUNT_FALLBACK));
  }
}

/** §5.4.5 — mark one notification read. Idempotent. */
export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationService.markRead(
      requireUserId(req),
      readIdParam(req.params.notificationId, "notification"),
    );

    res.status(200).json(formatAuthResponse(result));
  } catch (error) {
    next(toHttpError(error, READ_FALLBACK));
  }
}
