import type { Request } from "express";

/**
 * User roles — mirrors the Prisma `UserRole` enum so consumers of the API
 * layer never have to reach into the generated client just for literals.
 */
export const ROLES = {
  GUEST: "GUEST",
  MEMBER: "MEMBER",
  CONTENT_MODERATOR: "CONTENT_MODERATOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * OTP purposes — mirrors the Prisma `OtpPurpose` enum.
 */
export const OTP_PURPOSES = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

export type OtpPurposeValue = (typeof OTP_PURPOSES)[keyof typeof OTP_PURPOSES];

/**
 * A short-lived storage URL handed to the browser by `POST /assets/sign`.
 *
 * `expiresAt` is a Unix timestamp in milliseconds. It is never later than the
 * TTL the signing side actually minted, so a client can time a refresh without
 * following a link that has already died.
 */
export interface SignedUrlResponse {
  signedUrl: string;
  expiresAt: number;
}

/**
 * Identity attached to the request once the access token is verified.
 */
export interface UserPayload {
  id: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Webboard — SRS §5.3 (boards, threads, comments, reactions) + §7 (moderation)
//
// Every literal set below mirrors a Prisma enum so consumers of the API layer
// never reach into the generated client just for values.
// ---------------------------------------------------------------------------

/** The two boards §5.3 defines. */
export const BOARDS = {
  YOUTH_CARE: "YOUTH_CARE",
  GENERAL: "GENERAL",
} as const;

export type BoardKey = (typeof BOARDS)[keyof typeof BOARDS];

/** Registration-time validation for `requireRole`-style argument checking. */
export const BOARD_KEYS: readonly BoardKey[] = [BOARDS.YOUTH_CARE, BOARDS.GENERAL];

export const MODERATION_STATUSES = {
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  HIDDEN: "HIDDEN",
} as const;

export type ModerationStatusValue =
  (typeof MODERATION_STATUSES)[keyof typeof MODERATION_STATUSES];

export const REPORT_REASONS = {
  PROFANITY: "PROFANITY",
  ADVERTISING: "ADVERTISING",
  PERSONAL_INFO: "PERSONAL_INFO",
  SPAM: "SPAM",
  OTHER: "OTHER",
} as const;

export type ReportReasonValue = (typeof REPORT_REASONS)[keyof typeof REPORT_REASONS];

export const REPORT_STATUSES = {
  OPEN: "OPEN",
  DISMISSED: "DISMISSED",
  ACTIONED: "ACTIONED",
} as const;

export type ReportStatusValue = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

/** §7.1/§7.2 moderator decisions on a thread. */
export const MODERATION_ACTIONS = {
  APPROVE: "approve",
  REJECT: "reject",
  HIDE: "hide",
  RESTORE: "restore",
} as const;

export type ModerationAction = (typeof MODERATION_ACTIONS)[keyof typeof MODERATION_ACTIONS];

/** A reply awaiting review. Youth Care pre-moderates replies as well as questions. */
export interface PendingCommentView {
  id: string;
  threadId: string;
  threadTitle: string;
  board: BoardKey;
  body: string;
  anonymous: boolean;
  isOfficial: boolean;
  author: MemberAuthorView;
  createdAt: string;
}

/** `PATCH /webboard/moderation/comments/:commentId` result. */
export interface ModeratedCommentView {
  id: string;
  moderation: ModerationStatusValue;
}

/** `PATCH /webboard/moderation/threads/:postId` result. */
export interface ModeratedThreadView {
  id: string;
  moderation: ModerationStatusValue;
}

/** `PATCH /webboard/moderation/reports/:reportId` result. */
export interface ResolvedReportView {
  id: string;
  status: ReportStatusValue;
}

/** §5.3.4 "กดถูกใจ (Like/Reaction)" — one kind ships in Web 1. */
export const REACTION_TYPES = {
  LIKE: "LIKE",
} as const;

export type ReactionTypeValue = (typeof REACTION_TYPES)[keyof typeof REACTION_TYPES];

/** §5.3.3 sort menu: ล่าสุด / ยอดนิยม / ตอบมากที่สุด. */
export const THREAD_SORTS = {
  LATEST: "latest",
  POPULAR: "popular",
  MOST_REPLIED: "most-replied",
} as const;

export type ThreadSort = (typeof THREAD_SORTS)[keyof typeof THREAD_SORTS];

/** §5.3.2 status toggle on the Youth Care board. */
export const YOUTH_CARE_FILTERS = {
  ALL: "all",
  UNANSWERED: "unanswered",
  ANSWERED: "answered",
} as const;

export type YouthCareFilter =
  (typeof YOUTH_CARE_FILTERS)[keyof typeof YOUTH_CARE_FILTERS];

// ---------------------------------------------------------------------------
// Notifications — §3.3 (header bell) + §5.4.5 (notifications tab)
// ---------------------------------------------------------------------------

/** Why a notification exists; mirrors the Prisma `NotificationType` enum. */
export const NOTIFICATION_TYPES = {
  YOUTH_CARE_ANSWERED: "YOUTH_CARE_ANSWERED",
} as const;

export type NotificationTypeValue =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** The thread a notification points at — just enough to render a link. */
export interface NotificationThreadView {
  id: string;
  board: BoardKey;
  title: string;
}

/** One row in the notifications tab (§5.4.5); the bell counts the unread ones. */
export interface NotificationView {
  id: string;
  type: NotificationTypeValue;
  /** Null while unread. */
  readAt: string | null;
  createdAt: string;
  thread: NotificationThreadView;
}

/** `GET /notifications/unread-count` — the header bell's badge (§3.3). */
export interface UnreadNotificationCountView {
  count: number;
}

/** `PATCH /notifications/:notificationId/read` result. */
export interface ReadNotificationView {
  id: string;
  readAt: string;
}

/** A member as the general board renders them. */
export interface MemberAuthorView {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

/**
 * Who wrote an item.
 *
 * A discriminated union on purpose: the `anonymous` branch has no field that
 * could carry an id, name or username, so §7.1 ("never show the asker") is
 * enforced by the type rather than by remembering to strip a field.
 */
export type AuthorView =
  | { kind: "member"; member: MemberAuthorView }
  | { kind: "anonymous"; code: string };

/** A thread as a list renders it. */
export interface ThreadSummaryView {
  id: string;
  board: BoardKey;
  title: string;
  excerpt: string;
  author: AuthorView;
  tags: string[];
  /** Youth Care only: the team has posted an official answer (§5.3.2). */
  isAnswered: boolean;
  commentCount: number;
  likeCount: number;
  likedByViewer: boolean;
  createdAt: string;
}

/** A comment, already nested: `replies` holds the same shape one level deeper. */
export interface CommentView {
  id: string;
  parentId: string | null;
  body: string;
  author: AuthorView;
  /** The Youth Care team's official answer (§7.1). */
  isOfficial: boolean;
  likeCount: number;
  likedByViewer: boolean;
  createdAt: string;
  replies: CommentView[];
}

/**
 * `POST .../comments` — the new comment plus where it landed.
 *
 * `comment` is null while the item is PENDING, mirroring `CreatedThreadView`:
 * a pre-moderated Youth Care reply has no public representation to hand back.
 */
export interface CreatedCommentView {
  id: string;
  moderation: ModerationStatusValue;
  comment: CommentView | null;
}

/** Everything a list query needs, already normalised by the controller. */
export interface ThreadListQuery {
  board: BoardKey;
  sort: ThreadSort;
  filter: YouthCareFilter;
  /** §5.3.3 tag slug filter; null means "every tag". */
  tag: string | null;
  page: number;
  limit: number;
  skip: number;
  /** Resolved caller, or null for a signed-out reader. */
  viewerId: string | null;
}

/** §5.3.4 — a thread with its full reply tree. */
export interface ThreadDetailView extends ThreadSummaryView {
  body: string;
  comments: CommentView[];
}

/** One board's activity, for the `/webboard` hub cards (§5.3.1). */
export interface BoardSummaryView {
  key: BoardKey;
  threadCount: number;
  commentCount: number;
  latestAt: string | null;
}

/** `GET /webboard` payload — the two cards plus recent threads across both. */
export interface BoardOverviewView {
  boards: BoardSummaryView[];
  latestThreads: ThreadSummaryView[];
}

/** `PUT`/`DELETE .../reaction` — the caller's new state plus the fresh total. */
export interface ReactionResultView {
  liked: boolean;
  likeCount: number;
}

/**
 * `POST /webboard/threads` — the id plus the moderation state it landed in.
 *
 * The thread itself is not echoed: a PENDING Youth Care thread has no public
 * representation yet (§7.1), so the client must key off `moderation` rather
 * than navigate to it.
 */
export interface CreatedThreadView {
  id: string;
  board: BoardKey;
  title: string;
  moderation: ModerationStatusValue;
}

/** A thread awaiting review. Moderators DO see the author (§7.1 records it). */
export interface PendingThreadView {
  id: string;
  board: BoardKey;
  title: string;
  body: string;
  tags: string[];
  anonymous: boolean;
  author: MemberAuthorView;
  createdAt: string;
}

/** A report whose target is a thread or a comment. */
export type ReportTargetView =
  | { type: "thread"; id: string; title: string; body: string; board: BoardKey }
  | { type: "comment"; id: string; threadId: string; body: string; board: BoardKey };

export interface ReportEntryView {
  id: string;
  reason: ReportReasonValue;
  detail: string | null;
  status: ReportStatusValue;
  createdAt: string;
  reporter: MemberAuthorView;
  target: ReportTargetView;
  /** Author of the reported item — needed to judge and to restrict (§7.3). */
  reportedAuthor: MemberAuthorView;
}

/** `GET /webboard/moderation/queue` — §7.1 approvals plus §7.2 reports. */
export interface ModerationQueueView {
  pendingThreads: PendingThreadView[];
  pendingComments: PendingCommentView[];
  openReports: ReportEntryView[];
  /** Totals so the queue can show "showing N of M" per list. */
  pendingThreadTotal: number;
  pendingCommentTotal: number;
  openReportTotal: number;
}

/**
 * `GET /webboard/me/threads` — one of the caller's own threads (§5.4.5).
 *
 * Unlike `ThreadSummaryView` this carries no `author` (the reader *is* the
 * author) and it does **not** filter to PUBLISHED: §7.1 routes the author's
 * view of their own pending Youth Care question through `/profile/activities`,
 * which is the whole reason the tab exists. `moderation` + `moderationNote`
 * are therefore part of the payload rather than hidden.
 */
export interface MyThreadView {
  id: string;
  board: BoardKey;
  title: string;
  excerpt: string;
  moderation: ModerationStatusValue;
  /** Why a moderator rejected or hid it; null unless someone did (§7.1). */
  moderationNote: string | null;
  isAnswered: boolean;
  commentCount: number;
  likeCount: number;
  createdAt: string;
}

/** `GET /webboard/me/comments` — one of the caller's own replies (§5.4.5). */
export interface MyCommentView {
  id: string;
  threadId: string;
  threadTitle: string;
  board: BoardKey;
  excerpt: string;
  moderation: ModerationStatusValue;
  moderationNote: string | null;
  /** The Youth Care team's official answer (§7.1). */
  isOfficial: boolean;
  likeCount: number;
  createdAt: string;
}

/**
 * Use this when a handler must be explicit about requiring an authenticated
 * caller; plain `Request` is enough elsewhere thanks to the global augmentation
 * below.
 */
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}