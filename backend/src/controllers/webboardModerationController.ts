import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { formatAuthResponse, toHttpError } from "../middleware/errorFormatter";
import * as moderationService from "../services/webboardModerationService";
import { MODERATION_ACTIONS, REPORT_STATUSES } from "../types";
import { readIdParam, requireUserId } from "../utils/webboardParams";
import { parsePagination } from "../utils/webboardQuery";
import { parseBody } from "../utils/validation";

/**
 * The moderation queue — SRS §7.1 (Youth Care approvals), §7.2 (reports, hide).
 *
 * Every route here is mounted behind `requireRole(ROLES.CONTENT_MODERATOR)`, so
 * no handler re-checks a role. The moderator's id is always taken from the
 * verified token, never from the body, so an action cannot be attributed to
 * someone else.
 */

export const moderationActionSchema = z.object({
  action: z.enum([
    MODERATION_ACTIONS.APPROVE,
    MODERATION_ACTIONS.REJECT,
    MODERATION_ACTIONS.HIDE,
    MODERATION_ACTIONS.RESTORE,
  ]),
  reason: z.string().trim().max(500, "reason maximum 500 characters").optional(),
});

/**
 * A report can only be closed, never re-opened: `OPEN` is the absence of a
 * decision, and it is what the queue filters on.
 */
export const resolveReportSchema = z.object({
  status: z.enum([REPORT_STATUSES.DISMISSED, REPORT_STATUSES.ACTIONED]),
});

export const officialAnswerSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "body is required")
    .max(5000, "body maximum 5000 characters"),
});

const QUEUE_FALLBACK = {
  code: "WEBBOARD_QUEUE_FAILED",
  message: "Unable to load the moderation queue",
} as const;

const MODERATION_FALLBACK = {
  code: "WEBBOARD_MODERATE_FAILED",
  message: "Unable to apply the moderation decision",
} as const;

const RESOLVE_REPORT_FALLBACK = {
  code: "WEBBOARD_REPORT_RESOLVE_FAILED",
  message: "Unable to resolve the report",
} as const;

const ANSWER_FALLBACK = {
  code: "WEBBOARD_ANSWER_FAILED",
  message: "Unable to post the official answer",
} as const;

/** §7.1 + §7.2 — pending threads and open reports, oldest first. */
export async function getQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const queue = await moderationService.listQueue({ page, limit, skip });

    res.status(200).json(
      formatAuthResponse(queue, {
        page,
        limit,
        // The three lists are paginated independently with this same page/limit,
        // so the queue is as long as its longest list. The obvious sum would
        // claim pages that can never contain anything.
        total: Math.max(
          queue.pendingThreadTotal,
          queue.pendingCommentTotal,
          queue.openReportTotal,
        ),
      }),
    );
  } catch (error) {
    next(toHttpError(error, QUEUE_FALLBACK));
  }
}

/** Approve, reject, hide or restore a thread. */
export async function moderateThread(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(moderationActionSchema, req.body);

    const updated = await moderationService.moderateThread({
      postId: readIdParam(req.params.postId, "thread"),
      moderatorId: requireUserId(req),
      action: input.action,
      reason: input.reason ?? null,
    });

    res.status(200).json(formatAuthResponse(updated));
  } catch (error) {
    next(toHttpError(error, MODERATION_FALLBACK));
  }
}

/** Approve, reject, hide or restore a reply. */
export async function moderateComment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(moderationActionSchema, req.body);

    const updated = await moderationService.moderateComment({
      commentId: readIdParam(req.params.commentId, "comment"),
      moderatorId: requireUserId(req),
      action: input.action,
      reason: input.reason ?? null,
    });

    res.status(200).json(formatAuthResponse(updated));
  } catch (error) {
    next(toHttpError(error, MODERATION_FALLBACK));
  }
}

/** Close a report as dismissed or actioned. */
export async function resolveReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(resolveReportSchema, req.body);

    const updated = await moderationService.resolveReport({
      reportId: readIdParam(req.params.reportId, "report"),
      moderatorId: requireUserId(req),
      status: input.status,
    });

    res.status(200).json(formatAuthResponse(updated));
  } catch (error) {
    next(toHttpError(error, RESOLVE_REPORT_FALLBACK));
  }
}

/** §7.1 — the Youth Care team's official answer. */
export async function postOfficialAnswer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(officialAnswerSchema, req.body);

    const created = await moderationService.postOfficialAnswer({
      postId: readIdParam(req.params.postId, "thread"),
      moderatorId: requireUserId(req),
      body: input.body,
    });

    res.status(201).json(formatAuthResponse(created));
  } catch (error) {
    next(toHttpError(error, ANSWER_FALLBACK));
  }
}
