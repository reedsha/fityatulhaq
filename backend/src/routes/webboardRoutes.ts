import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as moderationController from "../controllers/webboardModerationController";
import * as webboardController from "../controllers/webboardController";
import { optionalAuthenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { ROLES } from "../types";

/**
 * Webboard route table — SRS §5.3 (reads are public, writes are member-only)
 * and §7 (the queue is CONTENT_MODERATOR-only).
 *
 * The role gate is applied here and nowhere else, which is what lets the
 * controllers and services be written without a role check in them.
 *
 * `requireRole` composes its own `authenticate` as the first element of the
 * tuple it returns, so each protected route verifies the JWT exactly once.
 */

const router = Router();

const DEFAULT_WRITE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_WRITE_RATE_LIMIT_MAX_ATTEMPTS = 5;

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * §7.3 — "จำกัดจำนวนโพสต์/คอมเมนต์ต่อนาทีต่อบัญชี": a per-account budget, not a
 * per-IP one, so one household or campus NAT cannot exhaust a member's quota.
 *
 * That is why this limiter sits *after* the role gate rather than in front of
 * it, unlike the credential limiters in `authRoutes`. The trade-off is
 * deliberate: an unauthenticated flood still costs a signature verification,
 * but no state, and the alternative — keying on `req.ip` — would throttle the
 * wrong people.
 *
 * Reactions are not limited. A reaction is a unique `(member, target)` row, so
 * it cannot be inflated by repetition, and there is nothing here for a flood to
 * achieve beyond the member's own request cost.
 */
const writeLimiter = rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: readPositiveInt(
    process.env.WEBBOARD_WRITE_RATE_LIMIT_WINDOW_MS,
    DEFAULT_WRITE_RATE_LIMIT_WINDOW_MS,
  ),
  max: readPositiveInt(
    process.env.WEBBOARD_WRITE_RATE_LIMIT_MAX,
    DEFAULT_WRITE_RATE_LIMIT_MAX_ATTEMPTS,
  ),
  // No IP fallback: the role gate above guarantees `req.user`, so the bucket is
  // always the account. The constant only exists to keep the generator total.
  keyGenerator: (req) => req.user?.id ?? "unauthenticated",
});

/** §6.4 — posting, commenting and reporting are member actions. */
const MEMBER_ONLY = [...requireRole(ROLES.MEMBER, ROLES.CONTENT_MODERATOR)];

/** §7.1/§7.2 — approving, rejecting, hiding and closing reports are staff work. */
const MODERATOR_ONLY = [...requireRole(ROLES.CONTENT_MODERATOR)];

// ---------------------------------------------------------------------------
// Reads — public, with the caller attached when a session exists
// ---------------------------------------------------------------------------

/** §5.3.1 — hub cards plus recent threads across both boards. */
router.get("/overview", optionalAuthenticate, webboardController.getOverview);

/** §5.3.3 — the tag catalogue the general board filters by. */
router.get("/tags", webboardController.listTags);

/** §5.3.2 / §5.3.3 — one board's threads. */
router.get("/boards/:board/threads", optionalAuthenticate, webboardController.listThreads);

/** §5.3.4 — a thread with its nested replies. */
router.get(
  "/boards/:board/threads/:postId",
  optionalAuthenticate,
  webboardController.getThread,
);

// ---------------------------------------------------------------------------
// Writes — member only, rate limited per account
// ---------------------------------------------------------------------------

/** §5.3.2 / §5.3.3 — start a thread (the board rides in the body). */
router.post(
  "/threads",
  ...MEMBER_ONLY,
  writeLimiter,
  webboardController.createThread,
);

/** §5.3.4 — reply to a thread. */
router.post(
  "/boards/:board/threads/:postId/comments",
  ...MEMBER_ONLY,
  writeLimiter,
  webboardController.createComment,
);

// Reactions: `PUT` likes, `DELETE` unlikes, both idempotent.
router.put(
  "/threads/:postId/reaction",
  ...MEMBER_ONLY,
  webboardController.likeThread,
);
router.delete(
  "/threads/:postId/reaction",
  ...MEMBER_ONLY,
  webboardController.unlikeThread,
);
router.put(
  "/comments/:commentId/reaction",
  ...MEMBER_ONLY,
  webboardController.likeComment,
);
router.delete(
  "/comments/:commentId/reaction",
  ...MEMBER_ONLY,
  webboardController.unlikeComment,
);

/** §7.2 — report a thread or a comment. */
router.post("/reports", ...MEMBER_ONLY, writeLimiter, webboardController.createReport);

// ---------------------------------------------------------------------------
// Moderation — CONTENT_MODERATOR only
// ---------------------------------------------------------------------------

/** §7.1 + §7.2 — pending threads and open reports. */
router.get("/moderation/queue", ...MODERATOR_ONLY, moderationController.getQueue);

/** §7.1/§7.2 — approve, reject, hide or restore a thread. */
router.patch(
  "/moderation/threads/:postId",
  ...MODERATOR_ONLY,
  moderationController.moderateThread,
);

/** §7.1/§7.2 — the same decisions for a reply. */
router.patch(
  "/moderation/comments/:commentId",
  ...MODERATOR_ONLY,
  moderationController.moderateComment,
);

/** §7.1 — the team's official answer. */
router.post(
  "/moderation/threads/:postId/answers",
  ...MODERATOR_ONLY,
  moderationController.postOfficialAnswer,
);

/** §7.2 — close a report as dismissed or actioned. */
router.patch(
  "/moderation/reports/:reportId",
  ...MODERATOR_ONLY,
  moderationController.resolveReport,
);

export default router;
