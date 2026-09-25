import { prisma } from "../config/database";
import { createAppError } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import {
  MODERATION_STATUSES,
  REPORT_STATUSES,
  type BoardKey,
  type CreatedCommentView,
  type MemberAuthorView,
  type ModeratedCommentView,
  type ModeratedThreadView,
  type ModerationAction,
  type ModerationQueueView,
  type PendingCommentView,
  type PendingThreadView,
  type ReportEntryView,
  type ReportReasonValue,
  type ReportStatusValue,
  type ResolvedReportView,
} from "../types";
import { resolveModerationOutcome } from "../utils/webboardModeration";
import {
  AUTHOR_SELECT,
  createComment,
  projectMemberAuthor,
  type AuthorRow,
} from "./webboardService";

/**
 * The staff side of the board — SRS §7.1 (Youth Care pre-moderation), §7.2
 * (report queue, hide) and §7.3's restriction, which the write path derives.
 *
 * Every function here assumes the caller already passed
 * `requireRole(ROLES.CONTENT_MODERATOR)`; none of them re-checks a role, so the
 * route table is the single place that decides who may moderate.
 *
 * Where this differs from the PRD, deliberately: §8.1 puts the Youth Care and
 * general moderation screens in Web 2, and §8.2 has Web 2 read Web 1's
 * webboard data over an API. That integration is M6. Until it lands, the queue
 * below is the Web 1 stand-in so the pre-moderation gate of §7.1 is operable
 * rather than decorative.
 */

const PENDING = MODERATION_STATUSES.PENDING;
const PUBLISHED = MODERATION_STATUSES.PUBLISHED;

export interface ModerationQueueQuery {
  page: number;
  limit: number;
  skip: number;
}

interface PendingThreadRow {
  id: string;
  board: BoardKey;
  title: string;
  body: string;
  tags: string[];
  anonymous: boolean;
  createdAt: Date;
  author: AuthorRow;
}

interface ReportTargetPostRow {
  id: string;
  title: string;
  body: string;
  authorId: string;
  board: BoardKey;
  author: AuthorRow;
}

interface PendingCommentRow {
  id: string;
  body: string;
  anonymous: boolean;
  isOfficial: boolean;
  createdAt: Date;
  author: AuthorRow;
  post: { id: string; title: string; board: BoardKey };
}

interface ReportTargetCommentRow {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  author: AuthorRow;
  post: { board: BoardKey };
}

interface ReportRow {
  id: string;
  reason: ReportReasonValue;
  detail: string | null;
  status: ReportStatusValue;
  createdAt: Date;
  reporter: AuthorRow;
  post: ReportTargetPostRow | null;
  comment: ReportTargetCommentRow | null;
}

function projectPendingThread(row: PendingThreadRow): PendingThreadView {
  return {
    id: row.id,
    board: row.board,
    title: row.title,
    body: row.body,
    tags: row.tags,
    anonymous: row.anonymous,
    author: projectMemberAuthor(row.author),
    createdAt: row.createdAt.toISOString(),
  };
}

function projectPendingComment(row: PendingCommentRow): PendingCommentView {
  return {
    id: row.id,
    threadId: row.post.id,
    threadTitle: row.post.title,
    board: row.post.board,
    body: row.body,
    anonymous: row.anonymous,
    isOfficial: row.isOfficial,
    author: projectMemberAuthor(row.author),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * A report always resolves to exactly one target: the two `postId` /
 * `commentId` columns are nullable, but a report can never outlive its target
 * because both relations cascade on delete. A row that somehow carries neither
 * is skipped with a warning rather than 500-ing the whole queue.
 */
function projectReport(row: ReportRow): ReportEntryView | null {
  const reporter: MemberAuthorView = projectMemberAuthor(row.reporter);
  const base = {
    id: row.id,
    reason: row.reason,
    detail: row.detail,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    reporter,
  };

  if (row.post !== null) {
    return {
      ...base,
      target: {
        type: "thread",
        id: row.post.id,
        title: row.post.title,
        body: row.post.body,
        board: row.post.board,
      },
      reportedAuthor: projectMemberAuthor(row.post.author),
    };
  }

  if (row.comment !== null) {
    return {
      ...base,
      target: {
        type: "comment",
        id: row.comment.id,
        threadId: row.comment.postId,
        body: row.comment.body,
        board: row.comment.post.board,
      },
      reportedAuthor: projectMemberAuthor(row.comment.author),
    };
  }

  logger.warn(`[WEBBOARD_MODERATION] Report ${row.id} has no target; skipping it.`);

  return null;
}

/**
 * The review queue.
 *
 * Oldest first in both lists: this is a work list where a member is waiting on
 * a decision, so it drains in order rather than showing the newest first.
 */
export async function listQueue(query: ModerationQueueQuery): Promise<ModerationQueueView> {
  const [pendingRows, pendingTotal, commentRows, commentTotal, reportRows, reportTotal] =
    await Promise.all([
      prisma.post.findMany({
        where: { moderation: PENDING },
        orderBy: { createdAt: "asc" },
        skip: query.skip,
        take: query.limit,
        include: { author: { select: AUTHOR_SELECT } },
      }),
      prisma.post.count({ where: { moderation: PENDING } }),
      // Only replies on threads that are already public: a reply to a question
      // that is itself still waiting would be a second row for one decision.
      prisma.comment.findMany({
        where: { moderation: PENDING, post: { moderation: PUBLISHED } },
        orderBy: { createdAt: "asc" },
        skip: query.skip,
        take: query.limit,
        include: {
          author: { select: AUTHOR_SELECT },
          post: { select: { id: true, title: true, board: true } },
        },
      }),
      prisma.comment.count({
        where: { moderation: PENDING, post: { moderation: PUBLISHED } },
      }),
      prisma.report.findMany({
        where: { status: REPORT_STATUSES.OPEN },
        orderBy: { createdAt: "asc" },
        skip: query.skip,
        take: query.limit,
        include: {
          reporter: { select: AUTHOR_SELECT },
          post: {
            select: {
              id: true,
              title: true,
              body: true,
              authorId: true,
              board: true,
              author: { select: AUTHOR_SELECT },
            },
          },
          comment: {
            select: {
              id: true,
              postId: true,
              body: true,
              authorId: true,
              author: { select: AUTHOR_SELECT },
              // The board, so the queue can link a moderator to the thread a
              // reported comment lives in.
              post: { select: { board: true } },
            },
          },
        },
      }),
      prisma.report.count({ where: { status: REPORT_STATUSES.OPEN } }),
    ]);

  return {
    pendingThreads: (pendingRows as PendingThreadRow[]).map(projectPendingThread),
    pendingComments: (commentRows as PendingCommentRow[]).map(projectPendingComment),
    openReports: (reportRows as ReportRow[])
      .map(projectReport)
      .filter((entry): entry is ReportEntryView => entry !== null),
    pendingThreadTotal: pendingTotal,
    pendingCommentTotal: commentTotal,
    openReportTotal: reportTotal,
  };
}

export interface ModerateThreadInput {
  postId: string;
  moderatorId: string;
  action: ModerationAction;
  reason: string | null;
}

export async function moderateThread(input: ModerateThreadInput): Promise<ModeratedThreadView> {
  const existing = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { id: true },
  });

  if (existing === null) {
    throw createAppError("THREAD_NOT_FOUND", "Thread not found", 404);
  }

  const outcome = resolveModerationOutcome({ action: input.action, reason: input.reason });

  const updated = await prisma.post.update({
    where: { id: input.postId },
    data: {
      moderation: outcome.moderation,
      moderationNote: outcome.note,
      moderatedById: input.moderatorId,
      moderatedAt: new Date(),
    },
    select: { id: true, moderation: true },
  });

  logger.info(
    `[WEBBOARD_MODERATION] ${input.action} by ${input.moderatorId} on thread ${updated.id} -> ${updated.moderation}`,
  );

  return { id: updated.id, moderation: updated.moderation };
}

export interface ModerateCommentInput {
  commentId: string;
  moderatorId: string;
  action: ModerationAction;
  reason: string | null;
}

/**
 * Approve, reject, hide or restore a reply.
 *
 * The same decision table as a thread, so the two cannot diverge, and the same
 * audit columns: whose decision it was, when, and the reason. A rejected reply's
 * reason has no reader yet — no screen lists a member's own replies until
 * `/profile/activities` in M5 — but recording it now is what makes that screen
 * possible, and an audit trail that starts late cannot be backfilled.
 */
export async function moderateComment(
  input: ModerateCommentInput,
): Promise<ModeratedCommentView> {
  const existing = await prisma.comment.findUnique({
    where: { id: input.commentId },
    select: { id: true },
  });

  if (existing === null) {
    throw createAppError("COMMENT_NOT_FOUND", "Comment not found", 404);
  }

  const outcome = resolveModerationOutcome({ action: input.action, reason: input.reason });

  const updated = await prisma.comment.update({
    where: { id: input.commentId },
    data: {
      moderation: outcome.moderation,
      moderationNote: outcome.note,
      moderatedById: input.moderatorId,
      moderatedAt: new Date(),
    },
    select: { id: true, moderation: true },
  });

  logger.info(
    `[WEBBOARD_MODERATION] ${input.action} by ${input.moderatorId} on comment ${updated.id} -> ${updated.moderation}`,
  );

  return { id: updated.id, moderation: updated.moderation };
}

export interface ResolveReportInput {
  reportId: string;
  moderatorId: string;
  status: ReportStatusValue;
}

/**
 * Closes a report as dismissed or actioned.
 *
 * `ACTIONED` is not just bookkeeping: `webboardService` counts actioned reports
 * per author to apply §7.3's temporary posting restriction, so this is the
 * switch that arms it.
 */
export async function resolveReport(input: ResolveReportInput): Promise<ResolvedReportView> {
  const existing = await prisma.report.findUnique({
    where: { id: input.reportId },
    select: { id: true },
  });

  if (existing === null) {
    throw createAppError("REPORT_NOT_FOUND", "Report not found", 404);
  }

  const updated = await prisma.report.update({
    where: { id: input.reportId },
    data: {
      status: input.status,
      resolvedById: input.moderatorId,
      resolvedAt: new Date(),
    },
    select: { id: true, status: true },
  });

  logger.info(
    `[WEBBOARD_MODERATION] Report ${updated.id} resolved as ${updated.status} by ${input.moderatorId}`,
  );

  return { id: updated.id, status: updated.status };
}

export interface OfficialAnswerInput {
  postId: string;
  moderatorId: string;
  body: string;
}

/**
 * §7.1 — the Youth Care team's official answer.
 *
 * Delegates to the comment writer with `official: true`, which is what marks
 * the reply, stamps `answeredAt`, and publishes the question if it was still
 * waiting. The board is read from the thread so the caller does not have to
 * repeat it (and cannot disagree with it).
 */
export async function postOfficialAnswer(
  input: OfficialAnswerInput,
): Promise<CreatedCommentView> {
  const thread = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { board: true },
  });

  if (thread === null) {
    throw createAppError("THREAD_NOT_FOUND", "Thread not found", 404);
  }

  return createComment({
    board: thread.board,
    postId: input.postId,
    authorId: input.moderatorId,
    body: input.body,
    parentId: null,
    anonymous: false,
    official: true,
  });
}
