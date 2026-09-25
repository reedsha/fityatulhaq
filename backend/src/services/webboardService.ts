import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database";
import { createAppError } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import {
  BOARDS,
  BOARD_KEYS,
  MODERATION_STATUSES,
  REACTION_TYPES,
  REPORT_STATUSES,
  THREAD_SORTS,
  YOUTH_CARE_FILTERS,
  type AuthorView,
  type BoardKey,
  type BoardOverviewView,
  type BoardSummaryView,
  type CommentView,
  type CreatedCommentView,
  type CreatedThreadView,
  type MemberAuthorView,
  type ModerationStatusValue,
  type MyCommentView,
  type MyThreadView,
  type ReactionResultView,
  type ReportReasonValue,
  type ThreadDetailView,
  type ThreadListQuery,
  type ThreadSort,
  type ThreadSummaryView,
} from "../types";
import { deriveAuthorCode } from "../utils/anonymity";
import { findProfanityTerms } from "../utils/profanity";
import { BOARD_RULES, isKnownTagSlug, resolveTagSlugs } from "../utils/webboardTaxonomy";
import { toExcerpt } from "../utils/webboardQuery";
import { createYouthCareAnsweredNotification } from "./notificationService";

/**
 * Webboard read/write service — SRS §5.3 plus the abuse limits of §7.3.
 *
 * The moderation *queue* lives in `webboardModerationService`; this module owns
 * everything a member or a guest can reach, and the two share only the
 * projections exported at the bottom.
 *
 * Three invariants hold everywhere below, and the tests pin each one:
 *
 *  1. **Only PUBLISHED content is reachable.** Youth Care is pre-moderated
 *     (§7.1), so PENDING/REJECTED/HIDDEN rows are invisible to guests *and* to
 *     members, including their own authors — §7.1 routes the author's view of
 *     their own pending question through `/profile/activities` instead.
 *  2. **The author is recorded, never rendered.** `authorId` is always written;
 *     §7.1 anonymity is applied in the projections and nowhere else.
 *  3. **Counts only count what is visible.** Comment and reaction totals are
 *     filtered to PUBLISHED so a hidden reply cannot inflate a thread.
 */

const PUBLISHED = MODERATION_STATUSES.PUBLISHED;
const PENDING = MODERATION_STATUSES.PENDING;

/** §7.3: reports against one author that trigger a posting restriction. */
const DEFAULT_RESTRICTION_THRESHOLD = 3;

/** §7.3 says "ชั่วคราว" — the restriction is a rolling window, not a ban. */
const DEFAULT_RESTRICTION_WINDOW_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Threads previewed on the `/webboard` hub (§5.3.1 "กระทู้ล่าสุด"). */
const HUB_LATEST_THREAD_LIMIT = 6;

function readPositiveIntEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const RESTRICTION_THRESHOLD = readPositiveIntEnv(
  "WEBBOARD_REPORT_RESTRICTION_THRESHOLD",
  DEFAULT_RESTRICTION_THRESHOLD,
);

const RESTRICTION_WINDOW_DAYS = readPositiveIntEnv(
  "WEBBOARD_REPORT_RESTRICTION_WINDOW_DAYS",
  DEFAULT_RESTRICTION_WINDOW_DAYS,
);

const AUTHOR_SELECT = {
  id: true,
  fullName: true,
  username: true,
  avatarUrl: true,
} as const;

/**
 * Exported for `webboardModerationService`, which shows identities on purpose
 * (§7.1 records the asker precisely so staff can act on it).
 */
export { AUTHOR_SELECT };

/** Counts are computed in SQL, filtered so hidden rows never inflate a total. */
const THREAD_COUNT_SELECT = {
  select: {
    comments: { where: { moderation: PUBLISHED } },
    reactions: true,
  },
} as const;

/**
 * Two include shapes per query rather than a dynamic one, so each call site
 * typechecks against a literal.
 *
 * The anonymous variant deliberately does NOT join `User`: on the Youth Care
 * board the author's name is never needed, so it is never loaded. The general
 * board and the cross-board hub need it, and there the projection returns it.
 */
const THREAD_INCLUDE = { _count: THREAD_COUNT_SELECT } as const;

const THREAD_INCLUDE_WITH_AUTHOR = {
  _count: THREAD_COUNT_SELECT,
  author: { select: AUTHOR_SELECT },
} as const;

const COMMENT_INCLUDE = { _count: { select: { reactions: true } } } as const;

const COMMENT_INCLUDE_WITH_AUTHOR = {
  _count: { select: { reactions: true } },
  author: { select: AUTHOR_SELECT },
} as const;

// ---------------------------------------------------------------------------
// Row shapes — what the selects above return
// ---------------------------------------------------------------------------

/** Fields every projection needs; the author join is optional by design. */
export interface AuthorRow {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

export interface ThreadRow {
  id: string;
  board: BoardKey;
  title: string;
  body: string;
  tags: string[];
  anonymous: boolean;
  answeredAt: Date | null;
  createdAt: Date;
  authorId: string;
  author?: AuthorRow;
  _count: { comments: number; reactions: number };
}

export interface CommentRow {
  id: string;
  parentId: string | null;
  body: string;
  anonymous: boolean;
  isOfficial: boolean;
  createdAt: Date;
  authorId: string;
  author?: AuthorRow;
  _count: { reactions: number };
}

// ---------------------------------------------------------------------------
// Projections — the only place anonymity is applied
// ---------------------------------------------------------------------------

function toMemberAuthor(author: AuthorRow): MemberAuthorView {
  return {
    id: author.id,
    fullName: author.fullName,
    username: author.username,
    avatarUrl: author.avatarUrl,
  };
}

/** Public form of a member row, shared with the moderation queue payloads. */
export { toMemberAuthor as projectMemberAuthor };

export interface ProjectAuthorInput {
  board: BoardKey;
  authorId: string;
  itemId: string;
  anonymous: boolean;
  author?: AuthorRow;
}

/**
 * Chooses how a writer is shown: a pseudonym on the anonymous boards, the real
 * member everywhere else.
 *
 * A general-board row arriving without its author join is a wiring bug, so it
 * throws rather than rendering an empty byline.
 */
export function projectAuthor(input: ProjectAuthorInput): AuthorView {
  if (BOARD_RULES[input.board].isAnonymous) {
    return {
      kind: "anonymous",
      code: deriveAuthorCode({
        authorId: input.authorId,
        board: input.board,
        itemId: input.itemId,
        anonymous: input.anonymous,
      }),
    };
  }

  if (input.author === undefined) {
    throw new Error(
      `[WEBBOARD] A "${input.board}" row must join its author; item ${input.itemId} has none.`,
    );
  }

  return { kind: "member", member: toMemberAuthor(input.author) };
}

/**
 * `likedThreadIds` is resolved for the whole page in one query rather than per
 * row, so a list costs one extra round trip regardless of its length.
 */
export function projectThreadSummary(
  row: ThreadRow,
  likedThreadIds: ReadonlySet<string>,
): ThreadSummaryView {
  return {
    id: row.id,
    board: row.board,
    title: row.title,
    excerpt: toExcerpt(row.body),
    author: projectAuthor({
      board: row.board,
      authorId: row.authorId,
      itemId: row.id,
      anonymous: row.anonymous,
      author: row.author,
    }),
    tags: row.tags,
    isAnswered: row.answeredAt !== null,
    commentCount: row._count.comments,
    likeCount: row._count.reactions,
    likedByViewer: likedThreadIds.has(row.id),
    createdAt: row.createdAt.toISOString(),
  };
}

export function projectThreadDetail(
  row: ThreadRow,
  comments: CommentView[],
  likedThreadIds: ReadonlySet<string>,
): ThreadDetailView {
  return {
    ...projectThreadSummary(row, likedThreadIds),
    body: row.body,
    comments,
  };
}

/**
 * Assembles the reply tree from a flat, chronologically ordered list.
 *
 * A comment whose parent is not in the set is promoted to a root: parents and
 * replies are moderated independently on Youth Care, so an approved reply can
 * outlive an unapproved parent, and losing it silently would be worse than
 * showing it one level up.
 */
export function projectCommentTree(
  board: BoardKey,
  rows: readonly CommentRow[],
  likedCommentIds: ReadonlySet<string>,
): CommentView[] {
  const nodes = new Map<string, CommentView>();

  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id,
      parentId: row.parentId,
      body: row.body,
      author: projectAuthor({
        board,
        authorId: row.authorId,
        itemId: row.id,
        anonymous: row.anonymous,
        author: row.author,
      }),
      isOfficial: row.isOfficial,
      likeCount: row._count.reactions,
      likedByViewer: likedCommentIds.has(row.id),
      createdAt: row.createdAt.toISOString(),
      replies: [],
    });
  }

  const roots: CommentView[] = [];

  for (const row of rows) {
    const node = nodes.get(row.id);

    if (node === undefined) {
      continue;
    }

    const parent = row.parentId === null ? undefined : nodes.get(row.parentId);

    if (parent === undefined) {
      roots.push(node);
    } else {
      parent.replies.push(node);
    }
  }

  return roots;
}

// ---------------------------------------------------------------------------
// Viewer reaction lookups — one query per page, never one per row
// ---------------------------------------------------------------------------

async function likedThreadIds(
  viewerId: string | null,
  threadIds: readonly string[],
): Promise<Set<string>> {
  if (viewerId === null || threadIds.length === 0) {
    return new Set<string>();
  }

  const rows = await prisma.reaction.findMany({
    where: { userId: viewerId, type: REACTION_TYPES.LIKE, postId: { in: [...threadIds] } },
    select: { postId: true },
  });

  return new Set(
    rows.map((row) => row.postId).filter((id): id is string => id !== null),
  );
}

async function likedCommentIds(
  viewerId: string | null,
  commentIds: readonly string[],
): Promise<Set<string>> {
  if (viewerId === null || commentIds.length === 0) {
    return new Set<string>();
  }

  const rows = await prisma.reaction.findMany({
    where: { userId: viewerId, type: REACTION_TYPES.LIKE, commentId: { in: [...commentIds] } },
    select: { commentId: true },
  });

  return new Set(
    rows.map((row) => row.commentId).filter((id): id is string => id !== null),
  );
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function summariseBoard(board: BoardKey): Promise<BoardSummaryView> {
  const [threadCount, commentCount, latest] = await Promise.all([
    prisma.post.count({ where: { board, moderation: PUBLISHED } }),
    prisma.comment.count({
      where: { moderation: PUBLISHED, post: { board, moderation: PUBLISHED } },
    }),
    prisma.post.findFirst({
      where: { board, moderation: PUBLISHED },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    key: board,
    threadCount,
    commentCount,
    latestAt: latest?.createdAt.toISOString() ?? null,
  };
}

/** §5.3.1 — the two hub cards plus recent threads across both boards. */
export async function getBoardOverview(viewerId: string | null): Promise<BoardOverviewView> {
  const [boards, latestRows] = await Promise.all([
    Promise.all(BOARD_KEYS.map((board) => summariseBoard(board))),
    prisma.post.findMany({
      where: { moderation: PUBLISHED },
      orderBy: { createdAt: "desc" },
      take: HUB_LATEST_THREAD_LIMIT,
      // Cross-board, so the author join is required for the general rows; the
      // projection drops it for Youth Care rows that do not use it.
      include: THREAD_INCLUDE_WITH_AUTHOR,
    }),
  ]);

  const liked = await likedThreadIds(
    viewerId,
    latestRows.map((row) => row.id),
  );

  return {
    boards,
    latestThreads: latestRows.map((row) => projectThreadSummary(row, liked)),
  };
}

/**
 * §5.3.3's sort menu.
 *
 * The count-based orderings use Prisma's relation counts, which cannot be
 * filtered to PUBLISHED rows the way `_count` can (Prisma has no syntax for it).
 * A hidden reply can therefore influence the order a little even though it is
 * excluded from the number displayed beside it. Recorded as debt D20.
 */
function threadOrderBy(sort: ThreadSort): Prisma.PostOrderByWithRelationInput[] {
  if (sort === THREAD_SORTS.POPULAR) {
    return [{ reactions: { _count: "desc" } }, { createdAt: "desc" }];
  }

  if (sort === THREAD_SORTS.MOST_REPLIED) {
    return [{ comments: { _count: "desc" } }, { createdAt: "desc" }];
  }

  return [{ createdAt: "desc" }];
}

function buildThreadWhere(query: ThreadListQuery): Prisma.PostWhereInput {
  const where: Prisma.PostWhereInput = { board: query.board, moderation: PUBLISHED };

  if (query.tag !== null) {
    where.tags = { has: query.tag };
  }

  if (query.board === BOARDS.YOUTH_CARE) {
    if (query.filter === YOUTH_CARE_FILTERS.ANSWERED) {
      where.answeredAt = { not: null };
    } else if (query.filter === YOUTH_CARE_FILTERS.UNANSWERED) {
      where.answeredAt = null;
    }
  }

  return where;
}

/** Paginated thread list for either board (§5.3.2, §5.3.3). */
export async function listThreads(
  query: ThreadListQuery,
): Promise<{ threads: ThreadSummaryView[]; total: number }> {
  if (query.tag !== null && !isKnownTagSlug(query.tag)) {
    throw createAppError("INVALID_TAG", `Unknown tag: ${query.tag}`, 400);
  }

  const rules = BOARD_RULES[query.board];
  const where = buildThreadWhere(query);
  const orderBy = threadOrderBy(query.sort);

  const [rows, total] = await Promise.all([
    // Branched rather than a conditional include: each arm then typechecks
    // against a literal select, and the anonymous arm never joins `User`.
    (rules.isAnonymous
      ? prisma.post.findMany({
          where,
          orderBy,
          skip: query.skip,
          take: query.limit,
          include: THREAD_INCLUDE,
        })
      : prisma.post.findMany({
          where,
          orderBy,
          skip: query.skip,
          take: query.limit,
          include: THREAD_INCLUDE_WITH_AUTHOR,
        })) as Promise<ThreadRow[]>,
    prisma.post.count({ where }),
  ]);

  const liked = await likedThreadIds(
    query.viewerId,
    rows.map((row) => row.id),
  );

  return { threads: rows.map((row) => projectThreadSummary(row, liked)), total };
}

// ---------------------------------------------------------------------------
// §5.4.5 — the member's own activity
// ---------------------------------------------------------------------------

/**
 * Columns the author's own thread list needs.
 *
 * `moderation` and `moderationNote` are in the payload precisely because this
 * list is *not* filtered to PUBLISHED: §7.1 routes the author's view of their
 * own pending Youth Care question through `/profile/activities`, and a rejected
 * thread has to carry the reason back to its author.
 */
const MY_THREAD_SELECT = {
  id: true,
  board: true,
  title: true,
  body: true,
  moderation: true,
  moderationNote: true,
  answeredAt: true,
  createdAt: true,
  _count: { select: { comments: { where: { moderation: PUBLISHED } }, reactions: true } },
} as const;

/** Columns the author's own reply list needs, including the thread it sits in. */
const MY_COMMENT_SELECT = {
  id: true,
  body: true,
  moderation: true,
  moderationNote: true,
  isOfficial: true,
  createdAt: true,
  post: { select: { id: true, board: true, title: true } },
  _count: { select: { reactions: true } },
} as const;

interface MyThreadRow {
  id: string;
  board: BoardKey;
  title: string;
  body: string;
  moderation: ModerationStatusValue;
  moderationNote: string | null;
  answeredAt: Date | null;
  createdAt: Date;
  _count: { comments: number; reactions: number };
}

interface MyCommentRow {
  id: string;
  body: string;
  moderation: ModerationStatusValue;
  moderationNote: string | null;
  isOfficial: boolean;
  createdAt: Date;
  post: { id: string; board: BoardKey; title: string };
  _count: { reactions: number };
}

/**
 * §5.4.5 "กระทู้ที่ตั้ง" / "คำถาม Youth Care ที่ถาม" — the caller's own threads
 * on both boards, newest first.
 *
 * Deliberately without a moderation filter. Every other list in this module
 * exists for a public reader, but this one is scoped by `authorId` to the caller,
 * so surfacing their own PENDING or REJECTED rows discloses nothing about anyone
 * else. This is the one screen where §7.1's pre-moderation gate is lifted, and
 * it is lifted only for the row's own author.
 */
export async function listMyThreads(input: {
  authorId: string;
  skip: number;
  take: number;
}): Promise<{ threads: MyThreadView[]; total: number }> {
  const where = { authorId: input.authorId };

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: input.skip,
      take: input.take,
      select: MY_THREAD_SELECT,
    }) as Promise<MyThreadRow[]>,
    prisma.post.count({ where }),
  ]);

  return {
    threads: rows.map((row) => ({
      id: row.id,
      board: row.board,
      title: row.title,
      excerpt: toExcerpt(row.body),
      moderation: row.moderation,
      moderationNote: row.moderationNote,
      isAnswered: row.answeredAt !== null,
      commentCount: row._count.comments,
      likeCount: row._count.reactions,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
  };
}

/**
 * §5.4.5 "คอมเมนต์ของฉัน" — the caller's own replies, newest first.
 *
 * Scoped to replies on PUBLISHED threads: a reply whose thread has since been
 * hidden cannot be opened, so listing it would only offer a dead link, and a
 * comment can never exist on a thread that was never published (M4 refuses that
 * write). The reply's own `moderation` is *not* filtered — a PENDING Youth Care
 * reply must appear with its status, which is exactly why M4 recorded the audit
 * columns on `Comment` in the first place.
 */
export async function listMyComments(input: {
  authorId: string;
  skip: number;
  take: number;
}): Promise<{ comments: MyCommentView[]; total: number }> {
  const where = {
    authorId: input.authorId,
    post: { moderation: PUBLISHED },
  };

  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: input.skip,
      take: input.take,
      select: MY_COMMENT_SELECT,
    }) as Promise<MyCommentRow[]>,
    prisma.comment.count({ where }),
  ]);

  return {
    comments: rows.map((row) => ({
      id: row.id,
      threadId: row.post.id,
      threadTitle: row.post.title,
      board: row.post.board,
      excerpt: toExcerpt(row.body),
      moderation: row.moderation,
      moderationNote: row.moderationNote,
      isOfficial: row.isOfficial,
      likeCount: row._count.reactions,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
  };
}

/**
 * §5.3.4 — one thread with its reply tree.
 *
 * Everything that is not PUBLISHED is a 404, including to its own author: §7.1
 * puts the author's view of a pending question in `/profile/activities`, and
 * answering "not found" here keeps the pre-moderation gate from leaking the
 * existence of unreviewed content.
 */
export async function getThread(
  board: BoardKey,
  postId: string,
  viewerId: string | null,
): Promise<ThreadDetailView> {
  const rules = BOARD_RULES[board];

  const thread = (await (rules.isAnonymous
    ? prisma.post.findFirst({
        where: { id: postId, board, moderation: PUBLISHED },
        include: THREAD_INCLUDE,
      })
    : prisma.post.findFirst({
        where: { id: postId, board, moderation: PUBLISHED },
        include: THREAD_INCLUDE_WITH_AUTHOR,
      }))) as ThreadRow | null;

  if (thread === null) {
    throw createAppError("THREAD_NOT_FOUND", "Thread not found", 404);
  }

  const commentRows = (await (rules.isAnonymous
    ? prisma.comment.findMany({
        where: { postId, moderation: PUBLISHED },
        orderBy: { createdAt: "asc" },
        include: COMMENT_INCLUDE,
      })
    : prisma.comment.findMany({
        where: { postId, moderation: PUBLISHED },
        orderBy: { createdAt: "asc" },
        include: COMMENT_INCLUDE_WITH_AUTHOR,
      }))) as CommentRow[];

  const [likedThreads, likedComments] = await Promise.all([
    likedThreadIds(viewerId, [postId]),
    likedCommentIds(
      viewerId,
      commentRows.map((row) => row.id),
    ),
  ]);

  return projectThreadDetail(
    thread,
    projectCommentTree(board, commentRows, likedComments),
    likedThreads,
  );
}

// ---------------------------------------------------------------------------
// Abuse limits (§7.3)
// ---------------------------------------------------------------------------

/** §7.3 — basic profanity screen, applied before anything is stored. */
function assertCleanContent(...parts: string[]): void {
  const hits = findProfanityTerms(parts.join("\n"));

  if (hits.length === 0) {
    return;
  }

  // The count is logged, not the matched strings: writing the profanity into
  // the logs would leak the very content the filter exists to keep out.
  logger.info(`[CONTENT_FLAGGED] Rejected a submission matching ${hits.length} filter term(s)`);
  throw createAppError(
    "CONTENT_FLAGGED",
    "Submission contains prohibited language",
    400,
  );
}

/**
 * §7.3 — "accounts reported repeatedly are restricted temporarily".
 *
 * The state is derived on each write from ACTIONED reports in a rolling
 * window rather than stored on `User`, so it cannot drift out of step with the
 * reports themselves and it lifts on its own once they age out.
 */
async function assertPostingAllowed(authorId: string): Promise<void> {
  const since = new Date(Date.now() - RESTRICTION_WINDOW_DAYS * MS_PER_DAY);
  const actioned = await prisma.report.count({
    where: {
      status: REPORT_STATUSES.ACTIONED,
      createdAt: { gte: since },
      OR: [{ post: { authorId } }, { comment: { authorId } }],
    },
  });

  if (actioned < RESTRICTION_THRESHOLD) {
    return;
  }

  logger.info(`[POSTING_RESTRICTED] User ${authorId} blocked after ${actioned} actioned report(s)`);
  throw createAppError(
    "POSTING_RESTRICTED",
    "Posting is temporarily restricted for this account",
    403,
  );
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface CreateThreadInput {
  board: BoardKey;
  authorId: string;
  title: string;
  body: string;
  tags: readonly string[];
  anonymous: boolean;
}

function resolveTags(raw: readonly string[]): string[] {
  const unknown = raw.filter((slug) => !isKnownTagSlug(slug));

  if (unknown.length > 0) {
    throw createAppError("INVALID_TAG", `Unknown tag: ${unknown.join(", ")}`, 400);
  }

  return resolveTagSlugs(raw);
}

/** §5.3.2 / §5.3.3 — start a thread. Pre-moderated on Youth Care only. */
export async function createThread(input: CreateThreadInput): Promise<CreatedThreadView> {
  const rules = BOARD_RULES[input.board];

  if (!rules.allowsTags && input.tags.length > 0) {
    throw createAppError("INVALID_TAG", "This board does not use tags", 400);
  }

  const tags = rules.allowsTags ? resolveTags(input.tags) : [];

  assertCleanContent(input.title, input.body);
  await assertPostingAllowed(input.authorId);

  const created = await prisma.post.create({
    data: {
      board: input.board,
      authorId: input.authorId,
      title: input.title,
      body: input.body,
      tags,
      // The strict-concealment toggle only exists on the anonymous board; a
      // general-board thread always carries its author.
      anonymous: rules.isAnonymous ? input.anonymous : false,
      moderation: rules.isPreModerated ? PENDING : PUBLISHED,
    },
    select: { id: true, board: true, title: true, moderation: true },
  });

  return {
    id: created.id,
    board: created.board,
    title: created.title,
    moderation: created.moderation,
  };
}

export interface CreateCommentInput {
  board: BoardKey;
  postId: string;
  authorId: string;
  body: string;
  parentId: string | null;
  anonymous: boolean;
  /** Only the moderation route sets this; the member route always sends false. */
  official: boolean;
}

/** §5.3.4 — reply to a thread, or (for staff) post the official answer. */
export async function createComment(
  input: CreateCommentInput,
): Promise<CreatedCommentView> {
  const rules = BOARD_RULES[input.board];

  // An official answer may land on a question that is still PENDING: staff
  // answering it *is* the approval (§7.1), and forcing the queue through an
  // approve-then-answer dance would be worse. A REJECTED or HIDDEN thread stays
  // out of reach, staff included.
  const acceptedModeration = input.official ? [PENDING, PUBLISHED] : [PUBLISHED];

  const thread = await prisma.post.findFirst({
    where: {
      id: input.postId,
      board: input.board,
      moderation: { in: acceptedModeration },
    },
    select: { id: true, moderation: true, authorId: true },
  });

  if (thread === null) {
    throw createAppError("THREAD_NOT_FOUND", "Thread not found", 404);
  }

  if (input.parentId !== null) {
    // The parent must be a published comment in this thread. Without the
    // moderation filter a member could answer a PENDING or HIDDEN comment — and
    // the 201-versus-404 difference would turn this endpoint into an oracle for
    // guessing the ids of unreviewed content.
    const parent = await prisma.comment.findFirst({
      where: { id: input.parentId, postId: input.postId, moderation: PUBLISHED },
      select: { id: true },
    });

    if (parent === null) {
      throw createAppError("PARENT_COMMENT_NOT_FOUND", "Parent comment not found", 404);
    }
  }

  assertCleanContent(input.body);
  await assertPostingAllowed(input.authorId);

  // An official answer is approved by definition, so pre-moderation never
  // withholds it.
  const moderation = input.official || !rules.isPreModerated ? PUBLISHED : PENDING;

  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const comment = await tx.comment.create({
      data: {
        postId: input.postId,
        authorId: input.authorId,
        parentId: input.parentId,
        body: input.body,
        anonymous: rules.isAnonymous ? input.anonymous : false,
        isOfficial: input.official,
        moderation,
      },
      select: { id: true, moderation: true },
    });

    // §5.3.2's "ทีมงานตอบแล้ว" chip reads `answeredAt`, so the answer and the
    // flag must land together; a pending question is published in the same
    // write, which is what keeps the approve step from being a separate trip.
    if (input.official) {
      const publishesPending = thread.moderation === PENDING;

      await tx.post.update({
        where: { id: input.postId },
        data: {
          answeredAt: new Date(),
          moderation: publishesPending ? PUBLISHED : thread.moderation,
          ...(publishesPending
            ? { moderatedById: input.authorId, moderatedAt: new Date() }
            : {}),
        },
      });

      // §5.3.2 promises the asker a notification when someone answers, and §7.1
      // makes this feed the only place they see their own question's status
      // (debt D22). Written in the same transaction as the answer so the two
      // cannot disagree; the helper itself refuses to notify self-answers.
      await createYouthCareAnsweredNotification(tx, {
        postId: input.postId,
        recipientId: thread.authorId,
        actorId: input.authorId,
      });
    }

    return comment;
  });

  if (created.moderation !== PUBLISHED) {
    return { id: created.id, moderation: created.moderation, comment: null };
  }

  const row = (await (rules.isAnonymous
    ? prisma.comment.findUnique({ where: { id: created.id }, include: COMMENT_INCLUDE })
    : prisma.comment.findUnique({
        where: { id: created.id },
        include: COMMENT_INCLUDE_WITH_AUTHOR,
      }))) as CommentRow | null;

  const node = row === null ? null : projectCommentTree(input.board, [row], new Set<string>())[0] ?? null;

  return { id: created.id, moderation: created.moderation, comment: node };
}

/**
 * §5.3.4 "กดถูกใจ (Like/Reaction)".
 *
 * Add and remove are separate, idempotent calls (`PUT`/`DELETE`) rather than a
 * toggle, so a retry after a dropped response cannot flip the state twice.
 */
export interface SetReactionInput {
  userId: string;
  postId: string | null;
  commentId: string | null;
  liked: boolean;
}

async function setPostReaction(
  userId: string,
  postId: string,
  liked: boolean,
): Promise<ReactionResultView> {
  const target = await prisma.post.findFirst({
    where: { id: postId, moderation: PUBLISHED },
    select: { id: true },
  });

  if (target === null) {
    throw createAppError("THREAD_NOT_FOUND", "Thread not found", 404);
  }

  if (liked) {
    await prisma.reaction.upsert({
      where: { userId_type_postId: { userId, type: REACTION_TYPES.LIKE, postId } },
      create: { userId, type: REACTION_TYPES.LIKE, postId },
      update: {},
    });
  } else {
    await prisma.reaction.deleteMany({
      where: { userId, type: REACTION_TYPES.LIKE, postId },
    });
  }

  return { liked, likeCount: await prisma.reaction.count({ where: { postId } }) };
}

async function setCommentReaction(
  userId: string,
  commentId: string,
  liked: boolean,
): Promise<ReactionResultView> {
  // A published reply inside a thread that has since been hidden is not
  // reachable, so reacting to it is refused too.
  const target = await prisma.comment.findFirst({
    where: { id: commentId, moderation: PUBLISHED, post: { moderation: PUBLISHED } },
    select: { id: true },
  });

  if (target === null) {
    throw createAppError("COMMENT_NOT_FOUND", "Comment not found", 404);
  }

  if (liked) {
    await prisma.reaction.upsert({
      where: { userId_type_commentId: { userId, type: REACTION_TYPES.LIKE, commentId } },
      create: { userId, type: REACTION_TYPES.LIKE, commentId },
      update: {},
    });
  } else {
    await prisma.reaction.deleteMany({
      where: { userId, type: REACTION_TYPES.LIKE, commentId },
    });
  }

  return { liked, likeCount: await prisma.reaction.count({ where: { commentId } }) };
}

export async function setReaction(input: SetReactionInput): Promise<ReactionResultView> {
  const { postId, commentId } = input;

  if (postId !== null && commentId === null) {
    return setPostReaction(input.userId, postId, input.liked);
  }

  if (commentId !== null && postId === null) {
    return setCommentReaction(input.userId, commentId, input.liked);
  }

  // Both or neither: the reaction table stores exactly one target per row.
  throw createAppError(
    "INVALID_REACTION_TARGET",
    "Exactly one of postId or commentId is required",
    400,
  );
}

/** §7.2 — "รายงานเนื้อหาไม่เหมาะสม" on any thread or comment. */
export interface CreateReportInput {
  reporterId: string;
  postId: string | null;
  commentId: string | null;
  reason: ReportReasonValue;
  detail: string | null;
}

async function insertReport(
  data: Prisma.ReportUncheckedCreateInput,
): Promise<{ id: string }> {
  try {
    return await prisma.report.create({ data, select: { id: true } });
  } catch (error) {
    // The two `@@unique([reporterId, …])` keys make a duplicate a database
    // decision rather than a check-then-write race.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw createAppError("ALREADY_REPORTED", "You have already reported this content", 409);
    }

    throw error;
  }
}

export async function createReport(input: CreateReportInput): Promise<{ id: string }> {
  const { postId, commentId } = input;

  if (postId !== null && commentId === null) {
    const target = await prisma.post.findFirst({
      where: { id: postId, moderation: PUBLISHED },
      select: { id: true },
    });

    if (target === null) {
      throw createAppError("THREAD_NOT_FOUND", "Thread not found", 404);
    }

    return insertReport({
      reporterId: input.reporterId,
      reason: input.reason,
      detail: input.detail,
      postId,
    });
  }

  if (commentId !== null && postId === null) {
    const target = await prisma.comment.findFirst({
      where: { id: commentId, moderation: PUBLISHED, post: { moderation: PUBLISHED } },
      select: { id: true },
    });

    if (target === null) {
      throw createAppError("COMMENT_NOT_FOUND", "Comment not found", 404);
    }

    return insertReport({
      reporterId: input.reporterId,
      reason: input.reason,
      detail: input.detail,
      commentId,
    });
  }

  throw createAppError(
    "INVALID_REPORT_TARGET",
    "Exactly one of postId or commentId is required",
    400,
  );
}
