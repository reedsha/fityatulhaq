import { Router } from "express";

import * as notificationController from "../controllers/notificationController";
import { requireRole } from "../middleware/requireRole";
import { ROLES } from "../types";

/**
 * Notification route table — §3.3 (bell) and §5.4.5 (tab).
 *
 * Every route is member-only: a notification belongs to exactly one account, so
 * there is no public or guest view. `requireRole` composes its own
 * `authenticate`, so each route verifies the JWT exactly once.
 *
 * No write limiter: marking a notification read is an idempotent update on a row
 * the caller already owns, and cannot be inflated by repetition.
 */

const router = Router();

const MEMBER_ONLY = [...requireRole(ROLES.MEMBER, ROLES.CONTENT_MODERATOR)];

/** §5.4.5 — the caller's own notifications, paginated. */
router.get("/", ...MEMBER_ONLY, notificationController.listNotifications);

/** §3.3 — the bell's badge. Declared before `/:notificationId/read` so the
 *  literal segment is never mistaken for the param. */
router.get("/unread-count", ...MEMBER_ONLY, notificationController.getUnreadCount);

/** §5.4.5 — mark one read. */
router.patch("/:notificationId/read", ...MEMBER_ONLY, notificationController.markRead);

export default router;
