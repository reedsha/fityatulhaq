import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { formatAuthResponse, toHttpError } from "../middleware/errorFormatter";
import * as webboardService from "../services/webboardService";
import { BOARDS, REPORT_REASONS } from "../types";
import {
  readBoardParam,
  readIdParam,
  readOptionalQueryString,
  requireUserId,
} from "../utils/webboardParams";
import { parsePagination, resolveThreadSort, resolveYouthCareFilter } from "../utils/webboardQuery";
import { BOARD_TAGS } from "../utils/webboardTaxonomy";
import { parseBody } from "../utils/validation";

/**
 * Public and member-facing webboard endpoints — SRS §5.3.
 *
 * Every read is open to guests (§5.3 is explicit that all boards are readable,
 * which supersedes the garbled redirect row in the §6.4 matrix). Every write is
 * member-only, enforced in the route table, so nothing here re-checks a role.
 *
 * The reader is attached when a session exists — the routes mount the optional
 * authenticator — which is what lets a list say "you liked this" without
 * turning a public page into a protected one.
 */

const boardSchema = z.enum([BOARDS.YOUTH_CARE, BOARDS.GENERAL]);

/** Longest id the API will look up, matching `readIdParam`'s bound. */
const MAX_ID_LENGTH = 200;

export const createThreadSchema = z.object({
  board: boardSchema,
  title: z
    .string()
    .trim()
    .min(5, "title minimum 5 characters")
    .max(150, "title maximum 150 characters"),
  body: z
    .string()
    .trim()
    .min(10, "body minimum 10 characters")
    .max(10000, "body maximum 10000 characters"),
  tags: z
    .array(z.string().trim().min(1).max(60))
    .max(5, "at most 5 tags")
    .optional()
    .default([]),
  anonymous: z.boolean().optional().default(false),
});

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "body is required")
    .max(5000, "body maximum 5000 characters"),
  parentId: z.string().trim().min(1).max(MAX_ID_LENGTH).nullish(),
  anonymous: z.boolean().optional().default(false),
});

export const createReportSchema = z.object({
  // `nullish` rather than `optional`: a client naming its target explicitly sends
  // the other id as null, and rejecting that would refuse a well-formed request.
  postId: z.string().trim().min(1).max(MAX_ID_LENGTH).nullish(),
  commentId: z.string().trim().min(1).max(MAX_ID_LENGTH).nullish(),
  reason: z.enum([
    REPORT_REASONS.PROFANITY,
    REPORT_REASONS.ADVERTISING,
    REPORT_REASONS.PERSONAL_INFO,
    REPORT_REASONS.SPAM,
    REPORT_REASONS.OTHER,
  ]),
  detail: z.string().trim().max(500, "detail maximum 500 characters").nullish(),
});

/**
 * Builds a reaction handler for one target and one direction.
 *
 * `PUT` likes and `DELETE` unlikes on the same sub-resource, so the route table
 * says which is which and no handler has to inspect `req.method`.
 */
function makeReactionHandler(
  target: "thread" | "comment",
  liked: boolean,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req, res, next): Promise<void> => {
    try {
      const id = readIdParam(req.params[target === "thread" ? "postId" : "commentId"], target);

      const result = await webboardService.setReaction({
        userId: requireUserId(req),
        postId: target === "thread" ? id : null,
        commentId: target === "comment" ? id : null,
        liked,
      });

      res.status(200).json(formatAuthResponse(result));
    } catch (error) {
      next(toHttpError(error, REACTION_FALLBACK));
    }
  };
}

const OVERVIEW_FALLBACK = {
  code: "WEBBOARD_OVERVIEW_FAILED",
  message: "Unable to load the webboard overview",
} as const;

const THREAD_LIST_FALLBACK = {
  code: "WEBBOARD_LIST_FAILED",
  message: "Unable to load the thread list",
} as const;

const THREAD_READ_FALLBACK = {
  code: "WEBBOARD_THREAD_FAILED",
  message: "Unable to load the thread",
} as const;

const THREAD_WRITE_FALLBACK = {
  code: "WEBBOARD_THREAD_CREATE_FAILED",
  message: "Unable to create the thread",
} as const;

const COMMENT_WRITE_FALLBACK = {
  code: "WEBBOARD_COMMENT_CREATE_FAILED",
  message: "Unable to create the comment",
} as const;

const REACTION_FALLBACK = {
  code: "WEBBOARD_REACTION_FAILED",
  message: "Unable to save the reaction",
} as const;

const REPORT_FALLBACK = {
  code: "WEBBOARD_REPORT_FAILED",
  message: "Unable to file the report",
} as const;

/** §5.3.3 tag catalogue, served so the board chips and the API cannot drift. */
export function listTags(_req: Request, res: Response): void {
  res.status(200).json(formatAuthResponse({ tags: BOARD_TAGS }));
}

/** §5.3.1 — the hub: two board cards plus recent threads across both. */
export async function getOverview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const overview = await webboardService.getBoardOverview(req.user?.id ?? null);
    res.status(200).json(formatAuthResponse(overview));
  } catch (error) {
    next(toHttpError(error, OVERVIEW_FALLBACK));
  }
}

/** §5.3.2 / §5.3.3 — one board's threads, filtered and sorted. */
export async function listThreads(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const board = readBoardParam(req.params.board);
    const { page, limit, skip } = parsePagination(req.query);

    const result = await webboardService.listThreads({
      board,
      sort: resolveThreadSort(req.query.sort),
      filter: resolveYouthCareFilter(req.query.filter),
      tag: readOptionalQueryString(req.query.tag),
      page,
      limit,
      skip,
      viewerId: req.user?.id ?? null,
    });

    res.status(200).json(formatAuthResponse(result.threads, { page, limit, total: result.total }));
  } catch (error) {
    next(toHttpError(error, THREAD_LIST_FALLBACK));
  }
}

/** §5.3.4 — a thread with its nested replies. */
export async function getThread(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const board = readBoardParam(req.params.board);
    const thread = await webboardService.getThread(
      board,
      readIdParam(req.params.postId, "thread"),
      req.user?.id ?? null,
    );

    res.status(200).json(formatAuthResponse(thread));
  } catch (error) {
    next(toHttpError(error, THREAD_READ_FALLBACK));
  }
}

export async function createThread(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(createThreadSchema, req.body);

    const created = await webboardService.createThread({
      board: input.board,
      authorId: requireUserId(req),
      title: input.title,
      body: input.body,
      tags: input.tags,
      anonymous: input.anonymous,
    });

    res.status(201).json(formatAuthResponse(created));
  } catch (error) {
    next(toHttpError(error, THREAD_WRITE_FALLBACK));
  }
}

export async function createComment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const board = readBoardParam(req.params.board);
    const input = parseBody(createCommentSchema, req.body);

    const created = await webboardService.createComment({
      board,
      postId: readIdParam(req.params.postId, "thread"),
      authorId: requireUserId(req),
      body: input.body,
      parentId: input.parentId ?? null,
      anonymous: input.anonymous,
      // Staff answers go through the moderation route; this one is always a
      // member reply, so the flag is never taken from the request.
      official: false,
    });

    res.status(201).json(formatAuthResponse(created));
  } catch (error) {
    next(toHttpError(error, COMMENT_WRITE_FALLBACK));
  }
}

export const likeThread = makeReactionHandler("thread", true);
export const unlikeThread = makeReactionHandler("thread", false);
export const likeComment = makeReactionHandler("comment", true);
export const unlikeComment = makeReactionHandler("comment", false);

/** §7.2 — report a thread or a comment for review. */
export async function createReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(createReportSchema, req.body);

    const created = await webboardService.createReport({
      reporterId: requireUserId(req),
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      reason: input.reason,
      detail: input.detail ?? null,
    });

    res.status(201).json(formatAuthResponse(created));
  } catch (error) {
    next(toHttpError(error, REPORT_FALLBACK));
  }
}
