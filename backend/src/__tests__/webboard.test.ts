/**
 * M4 webboard suite — a plain Node script in the `signUrlService.test.ts`
 * style (no Jest/Mocha), covering the parts of the board that are pure
 * functions of their inputs: the anonymity digest, the profanity screen, the
 * query normalisers, the public projections and the moderation decision table.
 *
 *   1. Run the test:  npx ts-node --transpile-only src/__tests__/webboard.test.ts
 *
 * Nothing leaves the process. The projections are imported from
 * `../services/webboardService`, which constructs a Prisma client at module
 * load (but never connects), so `DATABASE_URL` is defaulted below before that
 * import runs — no query, no Supabase, no network. Everything the suite
 * actually exercises is decided in memory, which is the point: the anonymity
 * rule and the moderation rules should be provable without a database.
 */

import "dotenv/config";

import { deriveAuthorCode } from "../utils/anonymity";
import { findProfanityTerms, isCleanText, normaliseForFilter } from "../utils/profanity";
import {
  BOARD_RULES,
  BOARD_TAGS,
  isBoardKey,
  isKnownTagSlug,
  resolveTagSlugs,
} from "../utils/webboardTaxonomy";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parsePagination,
  resolveThreadSort,
  resolveYouthCareFilter,
  toExcerpt,
} from "../utils/webboardQuery";
import { resolveModerationOutcome } from "../utils/webboardModeration";
import { BOARDS, MODERATION_ACTIONS, MODERATION_STATUSES, THREAD_SORTS, YOUTH_CARE_FILTERS } from "../types";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://unused:unused@localhost:5432/unused";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "webboard-suite-secret";

let failures = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    return;
  }

  failures += 1;
  console.error(`FAIL: ${name}${detail === undefined ? "" : ` — ${detail}`}`);
}

function first<T>(items: readonly T[]): T {
  const [head] = items;

  if (head === undefined) {
    throw new Error("Expected at least one item");
  }

  return head;
}

/** Every key name anywhere in a JSON structure, for the anonymity scans. */
function collectKeys(value: unknown, into: Set<string> = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, into);
    }

    return into;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      into.add(key);
      collectKeys(nested, into);
    }
  }

  return into;
}

const IDENTITY_KEYS = [
  "authorId",
  "fullName",
  "username",
  "avatarUrl",
  "email",
  "phone",
] as const;

function assertNoIdentity(name: string, payload: unknown, authorId: string): void {
  const keys = Array.from(collectKeys(payload));
  const leaked = IDENTITY_KEYS.filter((key) => keys.includes(key));

  check(
    name,
    leaked.length === 0 && !JSON.stringify(payload).includes(authorId),
    `leaked keys=[${leaked.join(", ")}]`,
  );
}

async function run(): Promise<void> {
  // -------------------------------------------------------------------------
  // Board taxonomy
  // -------------------------------------------------------------------------

  const youthCare = BOARD_RULES[BOARDS.YOUTH_CARE];
  const general = BOARD_RULES[BOARDS.GENERAL];

  check(
    "Youth Care is pre-moderated, anonymous and tag-free (§7.1)",
    youthCare.isPreModerated && youthCare.isAnonymous && !youthCare.allowsTags,
  );
  check(
    "the general board is post-moderated, named and tagged (§7.2)",
    !general.isPreModerated && !general.isAnonymous && general.allowsTags,
  );

  check(
    "isBoardKey accepts the two PRD boards",
    isBoardKey("YOUTH_CARE") && isBoardKey("GENERAL"),
  );
  check(
    "isBoardKey rejects anything else",
    !isBoardKey("general") && !isBoardKey(7) && !isBoardKey(null) && !isBoardKey(undefined),
  );

  const tagSlugs = BOARD_TAGS.map((tag) => tag.slug);
  check("every tag slug is distinct", new Set(tagSlugs).size === tagSlugs.length);
  check("every catalogue slug validates", tagSlugs.every((slug) => isKnownTagSlug(slug)));
  check("resolveTagSlugs de-duplicates", resolveTagSlugs(["general", "general", "events"]).length === 2);

  let unknownTagRejected = false;

  try {
    resolveTagSlugs(["not-a-tag"]);
  } catch {
    unknownTagRejected = true;
  }

  check("resolveTagSlugs rejects an unknown slug", unknownTagRejected);

  // -------------------------------------------------------------------------
  // Pagination, sorting and filters
  // -------------------------------------------------------------------------

  const defaults = parsePagination({});
  check(
    "pagination defaults to the first full page",
    defaults.page === 1 && defaults.limit === DEFAULT_PAGE_SIZE && defaults.skip === 0,
    JSON.stringify(defaults),
  );

  const junk = ["", "abc", "0", "-2", "1.5"];
  check(
    "junk page values degrade to page 1 rather than erroring",
    junk.every((value) => parsePagination({ page: value }).page === 1),
  );

  const thirdPage = parsePagination({ page: "3", limit: "5" });
  check(
    "skip is derived from page and limit",
    thirdPage.page === 3 && thirdPage.limit === 5 && thirdPage.skip === 10,
    JSON.stringify(thirdPage),
  );

  check(
    "oversized limits are clamped, not rejected",
    parsePagination({ limit: "5000" }).limit === MAX_PAGE_SIZE,
  );

  check(
    "sort resolves the three §5.3.3 orders and defaults to latest",
    resolveThreadSort("popular") === THREAD_SORTS.POPULAR &&
      resolveThreadSort("most-replied") === THREAD_SORTS.MOST_REPLIED &&
      resolveThreadSort("latest") === THREAD_SORTS.LATEST &&
      resolveThreadSort("nonsense") === THREAD_SORTS.LATEST,
  );

  check(
    "the Youth Care toggle defaults to showing everything",
    resolveYouthCareFilter("answered") === YOUTH_CARE_FILTERS.ANSWERED &&
      resolveYouthCareFilter("unanswered") === YOUTH_CARE_FILTERS.UNANSWERED &&
      resolveYouthCareFilter("") === YOUTH_CARE_FILTERS.ALL,
  );

  check(
    "a short excerpt is returned whole with its whitespace collapsed",
    toExcerpt("  บรรทัดหนึ่ง\n\nบรรทัดสอง  ") === "บรรทัดหนึ่ง บรรทัดสอง",
  );

  const longExcerpt = toExcerpt("word ".repeat(100));
  check(
    "a long excerpt is bounded and ends with one ellipsis",
    longExcerpt.length <= 181 && longExcerpt.endsWith("…") && !longExcerpt.endsWith("……"),
    `length=${longExcerpt.length}`,
  );

  // -------------------------------------------------------------------------
  // §7.3 profanity screen
  // -------------------------------------------------------------------------

  check("a Thai term is caught", findProfanityTerms("ข้อความ ควย ตรงนี้").length > 0);
  check("a Latin term is caught", findProfanityTerms("this is SHIT").length > 0);
  check(
    "a zero-width character cannot smuggle a term past the screen",
    findProfanityTerms("f\u200Buck").join() === findProfanityTerms("fuck").join(),
  );
  check(
    "Latin compounds are caught, not just the bare word",
    !isCleanText("bullshit") && !isCleanText("shithead") && !isCleanText("motherfucker"),
  );
  check(
    "innocent words that merely contain a listed fragment are NOT flagged",
    isCleanText("We use fire retardant on the props") &&
      isCleanText("สัดส่วนของนักเรียน") &&
      isCleanText("แม่งานของผู้รับเหมาจะเข้ามาตรวจงาน"),
  );
  check("clean Thai copy passes", isCleanText("ขอบคุณสำหรับคำถามที่ส่งเข้ามา"));
  check(
    "normalisation folds case and zero-width characters",
    normaliseForFilter("A\u200FB") === "ab",
  );
  check(
    "matches are reported without duplicates",
    findProfanityTerms("shit shit shit").length === 1,
  );

  // -------------------------------------------------------------------------
  // §7.1 anonymity digest
  // -------------------------------------------------------------------------

  const baseCode = deriveAuthorCode({
    authorId: "user-1",
    board: BOARDS.YOUTH_CARE,
    itemId: "post-1",
    anonymous: false,
  });

  check(
    "the pseudonym is a 6-character uppercase hex code",
    /^[0-9A-F]{6}$/.test(baseCode),
    baseCode,
  );
  check(
    "the default pseudonym is stable across a member's own posts",
    baseCode ===
      deriveAuthorCode({
        authorId: "user-1",
        board: BOARDS.YOUTH_CARE,
        itemId: "post-999",
        anonymous: false,
      }),
  );
  check(
    "a different member gets a different pseudonym",
    baseCode !==
      deriveAuthorCode({
        authorId: "user-2",
        board: BOARDS.YOUTH_CARE,
        itemId: "post-1",
        anonymous: false,
      }),
  );
  check(
    "a different board gets a different pseudonym",
    baseCode !==
      deriveAuthorCode({
        authorId: "user-1",
        board: BOARDS.GENERAL,
        itemId: "post-1",
        anonymous: false,
      }),
  );
  check(
    "strict concealment breaks the link between two posts",
    deriveAuthorCode({
      authorId: "user-1",
      board: BOARDS.YOUTH_CARE,
      itemId: "post-1",
      anonymous: true,
    }) !==
      deriveAuthorCode({
        authorId: "user-1",
        board: BOARDS.YOUTH_CARE,
        itemId: "post-2",
        anonymous: true,
      }),
  );
  check(
    "strict concealment differs from the default for the same post",
    baseCode !==
      deriveAuthorCode({
        authorId: "user-1",
        board: BOARDS.YOUTH_CARE,
        itemId: "post-1",
        anonymous: true,
      }),
  );
  check("the pseudonym never contains the member id", !baseCode.includes("user-1"));

  // -------------------------------------------------------------------------
  // Projections — imported after the env defaults above
  // -------------------------------------------------------------------------

  const {
    projectAuthor,
    projectCommentTree,
    projectThreadSummary,
  } = await import("../services/webboardService");

  const authorRow = {
    id: "user-1",
    fullName: "สมชาย ใจดี",
    username: "somchai",
    avatarUrl: null,
  };

  const memberView = projectAuthor({
    board: BOARDS.GENERAL,
    authorId: authorRow.id,
    itemId: "post-1",
    anonymous: false,
    author: authorRow,
  });

  check(
    "the general board attributes a thread to its member",
    memberView.kind === "member" && memberView.member.username === "somchai",
  );

  const anonymousView = projectAuthor({
    board: BOARDS.YOUTH_CARE,
    authorId: authorRow.id,
    itemId: "post-1",
    anonymous: false,
    // Supplied on purpose: the anonymous board must ignore it, not use it.
    author: authorRow,
  });

  check(
    "the Youth Care board answers with a pseudonym, never a member",
    anonymousView.kind === "anonymous" && /^[0-9A-F]{6}$/.test(anonymousView.code),
  );
  assertNoIdentity("a Youth Care author view carries no identity", anonymousView, authorRow.id);

  let missingAuthorThrew = false;

  try {
    projectAuthor({
      board: BOARDS.GENERAL,
      authorId: authorRow.id,
      itemId: "post-1",
      anonymous: false,
    });
  } catch {
    missingAuthorThrew = true;
  }

  check("a general-board row without its author join fails loudly", missingAuthorThrew);

  const threadRow = {
    id: "post-1",
    board: BOARDS.YOUTH_CARE,
    title: "ขอคำแนะนำเรื่องการเรียน",
    body: "สวัสดี อยากขอคำแนะนำ",
    tags: [],
    anonymous: true,
    answeredAt: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    authorId: authorRow.id,
    author: authorRow,
    _count: { comments: 3, reactions: 2 },
  };

  const threadSummary = projectThreadSummary(threadRow, new Set(["post-1"]));

  assertNoIdentity(
    "a Youth Care thread payload carries no identity anywhere",
    threadSummary,
    authorRow.id,
  );
  check(
    "thread counts and viewer state survive the projection",
    threadSummary.commentCount === 3 &&
      threadSummary.likeCount === 2 &&
      threadSummary.likedByViewer &&
      !threadSummary.isAnswered,
  );
  check(
    "an answered thread reports it",
    projectThreadSummary({ ...threadRow, answeredAt: new Date() }, new Set<string>()).isAnswered,
  );
  check(
    "a general-board thread keeps its member byline",
    (() => {
      const summary = projectThreadSummary(
        { ...threadRow, board: BOARDS.GENERAL, anonymous: false },
        new Set<string>(),
      );

      return summary.author.kind === "member" && summary.author.member.fullName === "สมชาย ใจดี";
    })(),
  );

  const commentRow = {
    id: "comment-2",
    parentId: "comment-1",
    body: "ตอบกลับ",
    anonymous: false,
    isOfficial: true,
    createdAt: new Date("2026-09-01T00:00:02.000Z"),
    authorId: authorRow.id,
    author: authorRow,
    _count: { reactions: 0 },
  };

  const parentRow = {
    ...commentRow,
    id: "comment-1",
    parentId: null,
    isOfficial: false,
    createdAt: new Date("2026-09-01T00:00:01.000Z"),
  };

  const tree = projectCommentTree(BOARDS.YOUTH_CARE, [parentRow, commentRow], new Set<string>());

  check(
    "nested replies are assembled under their parent",
    tree.length === 1 && first(tree).replies.length === 1 && first(tree).replies[0]?.id === "comment-2",
  );
  check(
    "an official answer is marked on the reply",
    first(first(tree).replies).isOfficial,
  );
  assertNoIdentity("a Youth Care comment tree carries no identity", tree, authorRow.id);

  const orphanTree = projectCommentTree(BOARDS.YOUTH_CARE, [commentRow], new Set<string>());

  check(
    "a reply whose parent is not published is promoted rather than dropped",
    orphanTree.length === 1 && first(orphanTree).id === "comment-2",
  );

  // -------------------------------------------------------------------------
  // §7.1/§7.2 moderation decision table
  // -------------------------------------------------------------------------

  const approved = resolveModerationOutcome({ action: MODERATION_ACTIONS.APPROVE, reason: null });
  check(
    "approving publishes the thread and clears any earlier note",
    approved.moderation === MODERATION_STATUSES.PUBLISHED && approved.note === null,
  );

  let reasonRequired = false;

  try {
    resolveModerationOutcome({ action: MODERATION_ACTIONS.REJECT, reason: "   " });
  } catch (error) {
    reasonRequired =
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "MODERATION_REASON_REQUIRED";
  }

  check("rejecting without a reason is refused", reasonRequired);

  const rejected = resolveModerationOutcome({
    action: MODERATION_ACTIONS.REJECT,
    reason: "  เปิดเผยข้อมูลส่วนบุคคล  ",
  });

  check(
    "rejecting stores the trimmed reason",
    rejected.moderation === MODERATION_STATUSES.REJECTED &&
      rejected.note === "เปิดเผยข้อมูลส่วนบุคคล",
  );

  check(
    "hiding and restoring move between HIDDEN and PUBLISHED",
    resolveModerationOutcome({ action: MODERATION_ACTIONS.HIDE, reason: "หยาบคาย" }).moderation ===
      MODERATION_STATUSES.HIDDEN &&
      resolveModerationOutcome({ action: MODERATION_ACTIONS.RESTORE, reason: null }).moderation ===
        MODERATION_STATUSES.PUBLISHED,
  );

  process.exitCode = failures === 0 ? 0 : 1;

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    return;
  }

  console.log("\nAll checks passed.");
}

void run().catch((error: unknown): void => {
  const reason = error instanceof Error ? error.message : String(error);

  console.error(`FAIL: could not complete the webboard suite — ${reason}`);
  process.exitCode = 1;
});
