import { request, requestPaginated, type PaginatedResponse } from "@/lib/api";

/**
 * Webboard transport and vocabulary.
 *
 * Thin by design, like `profileApi`: authentication, the 401/session-expiry
 * handling and envelope unwrapping all live in `lib/api`, so this module only
 * names the endpoints and the shapes they speak.
 *
 * The types mirror `backend/src/types/index.ts` field for field. `Author` in
 * particular is the same discriminated union, so a Youth Care payload cannot be
 * rendered with a byline the backend would never send.
 */

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const BOARDS = {
  YOUTH_CARE: "YOUTH_CARE",
  GENERAL: "GENERAL",
} as const;

export type BoardKey = (typeof BOARDS)[keyof typeof BOARDS];

export const MODERATION_STATUSES = {
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  HIDDEN: "HIDDEN",
} as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[keyof typeof MODERATION_STATUSES];

export const REPORT_REASONS = {
  PROFANITY: "PROFANITY",
  ADVERTISING: "ADVERTISING",
  PERSONAL_INFO: "PERSONAL_INFO",
  SPAM: "SPAM",
  OTHER: "OTHER",
} as const;

export type ReportReason = (typeof REPORT_REASONS)[keyof typeof REPORT_REASONS];

/**
 * Thai labels for the report reasons of §7.2. A typed `Record` keyed by the
 * union, so adding a reason to `REPORT_REASONS` fails to compile until it has a
 * label — the same pattern the knowledge sections use for their chips.
 */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  [REPORT_REASONS.PROFANITY]: "ถ้อยคำหยาบคาย",
  [REPORT_REASONS.ADVERTISING]: "โฆษณาเชิงพาณิชย์",
  [REPORT_REASONS.PERSONAL_INFO]: "เปิดเผยข้อมูลส่วนบุคคลของผู้อื่น",
  [REPORT_REASONS.SPAM]: "สแปมหรือเนื้อหาซ้ำ",
  [REPORT_REASONS.OTHER]: "อื่น ๆ",
};

export const THREAD_SORTS = {
  LATEST: "latest",
  POPULAR: "popular",
  MOST_REPLIED: "most-replied",
} as const;

export type ThreadSort = (typeof THREAD_SORTS)[keyof typeof THREAD_SORTS];

export const THREAD_SORT_LABELS: Record<ThreadSort, string> = {
  [THREAD_SORTS.LATEST]: "ล่าสุด",
  [THREAD_SORTS.POPULAR]: "ยอดนิยม",
  [THREAD_SORTS.MOST_REPLIED]: "ตอบมากที่สุด",
};

export const YOUTH_CARE_FILTERS = {
  ALL: "all",
  UNANSWERED: "unanswered",
  ANSWERED: "answered",
} as const;

export type YouthCareFilter = (typeof YOUTH_CARE_FILTERS)[keyof typeof YOUTH_CARE_FILTERS];

export const YOUTH_CARE_FILTER_LABELS: Record<YouthCareFilter, string> = {
  [YOUTH_CARE_FILTERS.ALL]: "ทั้งหมด",
  [YOUTH_CARE_FILTERS.UNANSWERED]: "รอตอบ",
  [YOUTH_CARE_FILTERS.ANSWERED]: "ทีมงานตอบแล้ว",
};

// ---------------------------------------------------------------------------
// Board presentation
// ---------------------------------------------------------------------------

/**
 * What each board needs to render itself.
 *
 * This is presentation, not policy: the backend decides which board is
 * pre-moderated and anonymous (`utils/webboardTaxonomy.ts`), and it enforces
 * that regardless of what this copy says. The two would only drift in the
 * direction of a missing badge or chip, never an open gate.
 */
export interface BoardMeta {
  key: BoardKey;
  /** URL segment, spelled as the routes are: `/webboard/youth-care`. */
  segment: string;
  title: string;
  description: string;
  /** §5.3.2 — shows the "รอตอบ / ทีมงานตอบแล้ว" toggle. */
  hasAnswerStatus: boolean;
  /** §5.3.3 — shows tag chips and the tag filter. */
  allowsTags: boolean;
  /** §7.1 — offers the strict-concealment option and the pseudonym byline. */
  isAnonymous: boolean;
  /** §5.3.2 says "ตั้งคำถามใหม่" where §5.3.3 says "ตั้งกระทู้ใหม่". */
  newThreadLabel: string;
  /** One line for the board card on the hub. */
  cardBlurb: string;
}

export const BOARD_META: Record<BoardKey, BoardMeta> = {
  [BOARDS.YOUTH_CARE]: {
    key: BOARDS.YOUTH_CARE,
    segment: "youth-care",
    title: "บอร์ดดูแลเยาวชน",
    description: "พื้นที่ปรึกษาปัญหาส่วนตัวและปัญหาของเยาวชนอย่างปลอดภัยและเป็นความลับ",
    hasAnswerStatus: true,
    allowsTags: false,
    isAnonymous: true,
    newThreadLabel: "ตั้งคำถามใหม่",
    cardBlurb: "ปรึกษาปัญหาส่วนตัวกับทีมดูแลเยาวชน โดยไม่เปิดเผยตัวตน",
  },
  [BOARDS.GENERAL]: {
    key: BOARDS.GENERAL,
    segment: "general",
    title: "บอร์ดทั่วไป",
    description: "พื้นที่พูดคุยแลกเปลี่ยนความคิดเห็นและแบ่งปันประสบการณ์ระหว่างสมาชิก",
    hasAnswerStatus: false,
    allowsTags: true,
    isAnonymous: false,
    newThreadLabel: "ตั้งกระทู้ใหม่",
    cardBlurb: "พูดคุยเรื่องทั่วไป แลกเปลี่ยนความคิดเห็นกับสมาชิกคนอื่น",
  },
};

/** Ordered for the hub cards, matching the PRD's Youth Care-then-General order. */
export const BOARD_ORDER: readonly BoardKey[] = [BOARDS.YOUTH_CARE, BOARDS.GENERAL];

/**
 * Board the new-thread form starts on when the URL does not say.
 *
 * Youth Care on purpose: nothing published there is visible until a moderator has
 * read it, so a member who does not notice the picker still has not posted
 * anything public. The general board posts straight to the open web.
 */
export const DEFAULT_NEW_THREAD_BOARD: BoardKey = BOARDS.YOUTH_CARE;

export const NEW_THREAD_PATH = "/webboard/new";
export const MODERATION_PATH = "/webboard/moderation";
export const WEBBOARD_HUB_PATH = "/webboard";

/**
 * Two spellings of a board, on purpose:
 *
 *  - `BoardMeta.segment` ("youth-care") is the *public site* URL, which is the
 *    human-facing path the PRD and the header nav use.
 *  - the board key ("YOUTH_CARE") is the API's identifier, and is what every
 *    endpoint path below carries.
 *
 * They are not interchangeable. The API deliberately accepts only the canonical
 * key so there is one thing to validate server-side, and keeping the mapping in
 * `boardPath`/`threadPath` means a route rename never silently changes what the
 * API is asked for.
 */

export function boardPath(board: BoardKey): string {
  return `/webboard/${BOARD_META[board].segment}`;
}

export function threadPath(board: BoardKey, postId: string): string {
  return `${boardPath(board)}/${encodeURIComponent(postId)}`;
}

export function newThreadPath(board: BoardKey | null): string {
  // The board *key*, not the route segment: `boardFromKey` is what reads this
  // back on `/webboard/new`, and it takes the canonical key. The pretty segment
  // belongs to the site's own URLs (`boardPath`), not to query values.
  return board === null ? NEW_THREAD_PATH : `${NEW_THREAD_PATH}?board=${board}`;
}

/**
 * Resolves a `[board]` route segment to a board key.
 *
 * Returns null rather than throwing so the route can answer with Next's
 * `notFound()`, which is the right response to an unknown path segment.
 */
export function boardFromSegment(segment: string): BoardKey | null {
  if (segment === BOARD_META[BOARDS.YOUTH_CARE].segment) {
    return BOARDS.YOUTH_CARE;
  }

  if (segment === BOARD_META[BOARDS.GENERAL].segment) {
    return BOARDS.GENERAL;
  }

  return null;
}

/** The board named by a `?board=` value (the `board` enum, not the segment). */
export function boardFromKey(value: string | null): BoardKey | null {
  return value === BOARDS.YOUTH_CARE || value === BOARDS.GENERAL ? value : null;
}

// ---------------------------------------------------------------------------
// Payload shapes
// ---------------------------------------------------------------------------

export interface MemberAuthor {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

export type Author =
  | { kind: "member"; member: MemberAuthor }
  | { kind: "anonymous"; code: string };

export interface ThreadSummary {
  id: string;
  board: BoardKey;
  title: string;
  excerpt: string;
  author: Author;
  tags: string[];
  isAnswered: boolean;
  commentCount: number;
  likeCount: number;
  likedByViewer: boolean;
  createdAt: string;
}

export interface CommentNode {
  id: string;
  parentId: string | null;
  body: string;
  author: Author;
  isOfficial: boolean;
  likeCount: number;
  likedByViewer: boolean;
  createdAt: string;
  replies: CommentNode[];
}

export interface ThreadDetail extends ThreadSummary {
  body: string;
  comments: CommentNode[];
}

export interface BoardSummary {
  key: BoardKey;
  threadCount: number;
  commentCount: number;
  latestAt: string | null;
}

export interface BoardOverview {
  boards: BoardSummary[];
  latestThreads: ThreadSummary[];
}

export interface ReactionResult {
  liked: boolean;
  likeCount: number;
}

export interface CreatedThread {
  id: string;
  board: BoardKey;
  title: string;
  moderation: ModerationStatus;
}

export interface CreatedComment {
  id: string;
  moderation: ModerationStatus;
  comment: CommentNode | null;
}

export interface BoardTag {
  slug: string;
  label: string;
}

export interface PendingThread {
  id: string;
  board: BoardKey;
  title: string;
  body: string;
  tags: string[];
  anonymous: boolean;
  author: MemberAuthor;
  createdAt: string;
}

export type ReportTarget =
  | { type: "thread"; id: string; title: string; body: string; board: BoardKey }
  | { type: "comment"; id: string; threadId: string; body: string; board: BoardKey };

export interface ReportEntry {
  id: string;
  reason: ReportReason;
  detail: string | null;
  status: "OPEN" | "DISMISSED" | "ACTIONED";
  createdAt: string;
  reporter: MemberAuthor;
  target: ReportTarget;
  reportedAuthor: MemberAuthor;
}

export interface PendingComment {
  id: string;
  threadId: string;
  threadTitle: string;
  board: BoardKey;
  body: string;
  anonymous: boolean;
  isOfficial: boolean;
  author: MemberAuthor;
  createdAt: string;
}

export interface ModerationQueue {
  pendingThreads: PendingThread[];
  pendingComments: PendingComment[];
  openReports: ReportEntry[];
  pendingThreadTotal: number;
  pendingCommentTotal: number;
  openReportTotal: number;
}

export interface ModerationDecision {
  id: string;
  moderation: ModerationStatus;
}

export interface ResolvedReport {
  id: string;
  status: "OPEN" | "DISMISSED" | "ACTIONED";
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function fetchOverview(signal?: AbortSignal): Promise<BoardOverview> {
  return request<BoardOverview>("/webboard/overview", { signal });
}

export async function fetchTags(signal?: AbortSignal): Promise<BoardTag[]> {
  const payload = await request<{ tags: BoardTag[] }>("/webboard/tags", { signal });

  return payload.tags;
}

export interface ThreadListQuery {
  board: BoardKey;
  sort?: ThreadSort;
  filter?: YouthCareFilter;
  tag?: string | null;
  page?: number;
  signal?: AbortSignal;
}

export async function fetchThreads(
  query: ThreadListQuery,
): Promise<PaginatedResponse<ThreadSummary[]>> {
  const params = new URLSearchParams();

  if (query.sort !== undefined) {
    params.set("sort", query.sort);
  }

  if (query.filter !== undefined) {
    params.set("filter", query.filter);
  }

  if (query.tag !== null && query.tag !== undefined) {
    params.set("tag", query.tag);
  }

  if (query.page !== undefined) {
    params.set("page", `${query.page}`);
  }

  const search = params.toString();

  return requestPaginated<ThreadSummary[]>(
    `/webboard/boards/${query.board}/threads${search === "" ? "" : `?${search}`}`,
    { signal: query.signal },
  );
}

export async function fetchThread(
  board: BoardKey,
  postId: string,
  signal?: AbortSignal,
): Promise<ThreadDetail> {
  return request<ThreadDetail>(
    `/webboard/boards/${board}/threads/${encodeURIComponent(postId)}`,
    { signal },
  );
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface CreateThreadPayload {
  board: BoardKey;
  title: string;
  body: string;
  tags: string[];
  anonymous: boolean;
}

export async function createThread(payload: CreateThreadPayload): Promise<CreatedThread> {
  return request<CreatedThread>("/webboard/threads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface CreateCommentPayload {
  body: string;
  parentId: string | null;
  anonymous: boolean;
}

export async function createComment(
  board: BoardKey,
  postId: string,
  payload: CreateCommentPayload,
): Promise<CreatedComment> {
  return request<CreatedComment>(
    `/webboard/boards/${board}/threads/${encodeURIComponent(postId)}/comments`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export type ReactionTargetRef =
  | { type: "thread"; id: string }
  | { type: "comment"; id: string };

function reactionEndpoint(target: ReactionTargetRef): string {
  const collection = target.type === "thread" ? "threads" : "comments";

  return `/webboard/${collection}/${encodeURIComponent(target.id)}/reaction`;
}

/**
 * Sets the caller's reaction. `PUT` and `DELETE` are separate and idempotent, so
 * a retry after a dropped response cannot flip the state twice.
 */
export async function setReaction(
  target: ReactionTargetRef,
  liked: boolean,
): Promise<ReactionResult> {
  return request<ReactionResult>(reactionEndpoint(target), {
    method: liked ? "PUT" : "DELETE",
  });
}

export interface CreateReportPayload {
  postId: string | null;
  commentId: string | null;
  reason: ReportReason;
  detail: string | null;
}

export async function createReport(payload: CreateReportPayload): Promise<{ id: string }> {
  return request<{ id: string }>("/webboard/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Moderation (§7.1/§7.2) — CONTENT_MODERATOR only; the backend enforces it
// ---------------------------------------------------------------------------

export async function fetchModerationQueue(
  page = 1,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ModerationQueue>> {
  // Paginated transport: the queue carries two lists, and their totals are what
  // the pager needs — dropping the envelope would lose them.
  return requestPaginated<ModerationQueue>(`/webboard/moderation/queue?page=${page}`, {
    signal,
  });
}

export const MODERATION_ACTIONS = {
  APPROVE: "approve",
  REJECT: "reject",
  HIDE: "hide",
  RESTORE: "restore",
} as const;

export type ModerationAction = (typeof MODERATION_ACTIONS)[keyof typeof MODERATION_ACTIONS];

export async function moderateThread(
  postId: string,
  action: ModerationAction,
  reason: string | null,
): Promise<ModerationDecision> {
  return request<ModerationDecision>(
    `/webboard/moderation/threads/${encodeURIComponent(postId)}`,
    { method: "PATCH", body: JSON.stringify({ action, reason }) },
  );
}

export async function moderateComment(
  commentId: string,
  action: ModerationAction,
  reason: string | null,
): Promise<ModerationDecision> {
  return request<ModerationDecision>(
    `/webboard/moderation/comments/${encodeURIComponent(commentId)}`,
    { method: "PATCH", body: JSON.stringify({ action, reason }) },
  );
}

export async function postOfficialAnswer(
  postId: string,
  body: string,
): Promise<CreatedComment> {
  return request<CreatedComment>(
    `/webboard/moderation/threads/${encodeURIComponent(postId)}/answers`,
    { method: "POST", body: JSON.stringify({ body }) },
  );
}

export async function resolveReport(
  reportId: string,
  status: "DISMISSED" | "ACTIONED",
): Promise<ResolvedReport> {
  return request<ResolvedReport>(
    `/webboard/moderation/reports/${encodeURIComponent(reportId)}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}
