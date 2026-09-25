/**
 * M4 webboard route-gate suite — the `assetSignRole.test.ts` idea (prove the
 * gate that lives in the router, not the service) but self-contained: instead of
 * requiring an API that is already running, it mounts the real router on an
 * ephemeral in-process port.
 *
 *   1. Run the test:  npx ts-node --transpile-only src/__tests__/webboardRoutes.test.ts
 *
 * No database is touched, and that is a design constraint rather than a
 * coincidence: every probe below is either decided by the middleware chain
 * (401/403) or rejected by request validation *before* a service call (400) or
 * by a param reader (404). The role matrix is therefore provable without a
 * connection, and the suite leaves no rows behind.
 *
 * Expected matrix (PRD §5.3 + §7):
 *   - reads are public, so an unknown board is a 404, not a 401
 *   - writes need MEMBER: no token → 401, GUEST → 403
 *   - the queue needs CONTENT_MODERATOR: MEMBER → 403
 *   - the §7.3 per-account budget answers 429 on the sixth write
 */

import "dotenv/config";

import cookieParser from "cookie-parser";
import express from "express";
import { createServer, type Server } from "node:http";

import { errorHandler } from "../middleware/errorFormatter";
import { sanitizeBody } from "../middleware/sanitizeBody";
import { signAccessToken } from "../services/jwtService";
import { ROLES } from "../types";
import { BOARD_TAGS } from "../utils/webboardTaxonomy";

/**
 * Pinned before the router is loaded, because the limiter reads its budget at
 * module load. Without this a developer's local `.env` could silently change
 * what the last assertion is testing.
 */
process.env.WEBBOARD_WRITE_RATE_LIMIT_MAX = "5";
process.env.WEBBOARD_WRITE_RATE_LIMIT_WINDOW_MS = "60000";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "webboard-routes-secret";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://unused:unused@localhost:5432/unused";

interface ProbeResult {
  status: number;
  errorCode: string | null;
  payload: {
    success?: boolean;
    data?: { tags?: unknown[] };
  };
}

let failures = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    return;
  }

  failures += 1;
  console.error(`FAIL: ${name}${detail === undefined ? "" : ` — ${detail}`}`);
}

function tokenFor(role: string, id: string): string {
  return signAccessToken({ id, email: `${id}@webboard-probe.test`, role });
}

async function run(): Promise<void> {
  const { default: webboardRoutes } = await import("../routes/webboardRoutes");
  const { WEBBOARD_ROUTE_PREFIX } = await import("../config/routePrefix");

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(sanitizeBody);
  app.use(WEBBOARD_ROUTE_PREFIX, webboardRoutes);
  // Mounted last, exactly as `src/index.ts` does, so failures come back in the
  // API's own envelope instead of Express's HTML error page.
  app.use(errorHandler);

  const server: Server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("The probe server did not bind a port");
  }

  const baseUrl = `http://127.0.0.1:${address.port}${WEBBOARD_ROUTE_PREFIX}`;

  async function probe(
    method: string,
    path: string,
    token: string | null,
    body?: unknown,
  ): Promise<ProbeResult> {
    const headers: Record<string, string> = {};

    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let payload: ProbeResult["payload"] = {};

    try {
      payload = (await response.json()) as ProbeResult["payload"];
    } catch {
      // A rate-limited answer is not our envelope; the status carries the point.
    }

    return {
      status: response.status,
      errorCode: payload.success === false ? (payload as { error?: { code?: string } }).error?.code ?? null : null,
      payload,
    };
  }

  try {
    // -----------------------------------------------------------------------
    // Public reads
    // -----------------------------------------------------------------------

    const tags = await probe("GET", "/tags", null);
    check(
      "GET /tags answers without a session and lists the catalogue (§5.3.3)",
      tags.status === 200 && tags.payload.data?.tags?.length === BOARD_TAGS.length,
      `status=${tags.status} tags=${tags.payload.data?.tags?.length ?? "none"}`,
    );

    const unknownBoard = await probe("GET", "/boards/nope/threads", null);
    check(
      "an unknown board is a 404 on a public read, not a 401",
      unknownBoard.status === 404 && unknownBoard.errorCode === "BOARD_NOT_FOUND",
      `status=${unknownBoard.status} code=${unknownBoard.errorCode ?? "none"}`,
    );

    // -----------------------------------------------------------------------
    // §5.4.5 — the caller's own activity is member-only, unlike every read above
    // -----------------------------------------------------------------------

    const anonymousThreads = await probe("GET", "/me/threads", null);
    check(
      "GET /me/threads without a session is 401",
      anonymousThreads.status === 401,
      `status=${anonymousThreads.status}`,
    );

    const guestThreads = await probe(
      "GET",
      "/me/threads",
      tokenFor(ROLES.GUEST, "probe-guest-6"),
    );
    check(
      "GET /me/threads as GUEST is 403",
      guestThreads.status === 403 && guestThreads.errorCode === "FORBIDDEN",
      `status=${guestThreads.status} code=${guestThreads.errorCode ?? "none"}`,
    );

    const guestComments = await probe(
      "GET",
      "/me/comments",
      tokenFor(ROLES.GUEST, "probe-guest-7"),
    );
    check(
      "GET /me/comments as GUEST is 403",
      guestComments.status === 403 && guestComments.errorCode === "FORBIDDEN",
      `status=${guestComments.status} code=${guestComments.errorCode ?? "none"}`,
    );

    // The `me` segment must not be swallowed by `/boards/:board/...`: were it
    // captured, a guest would see BOARD_NOT_FOUND instead of FORBIDDEN.
    const guestThreadsCode = guestThreads.errorCode;
    check(
      "the me-routes are not matched as a board name",
      guestThreadsCode !== "BOARD_NOT_FOUND",
      `code=${guestThreadsCode ?? "none"}`,
    );

    // -----------------------------------------------------------------------
    // Writes — §6.4: posting and reporting are member actions
    // -----------------------------------------------------------------------

    const anonymousThread = await probe("POST", "/threads", null, {});
    check(
      "POST /threads without a session is 401",
      anonymousThread.status === 401,
      `status=${anonymousThread.status}`,
    );

    const guestThread = await probe("POST", "/threads", tokenFor(ROLES.GUEST, "probe-guest-1"), {});
    check(
      "POST /threads as GUEST is 403 before validation runs",
      guestThread.status === 403 && guestThread.errorCode === "FORBIDDEN",
      `status=${guestThread.status} code=${guestThread.errorCode ?? "none"}`,
    );

    const memberThread = await probe("POST", "/threads", tokenFor(ROLES.MEMBER, "probe-member-1"), {});
    check(
      "POST /threads as MEMBER passes the gate and fails validation",
      memberThread.status === 400 && memberThread.errorCode === "VALIDATION_ERROR",
      `status=${memberThread.status} code=${memberThread.errorCode ?? "none"}`,
    );

    const moderatorThread = await probe(
      "POST",
      "/threads",
      tokenFor(ROLES.CONTENT_MODERATOR, "probe-moderator-1"),
      {},
    );
    check(
      "POST /threads as CONTENT_MODERATOR is allowed (staff are members too)",
      moderatorThread.status === 400 && moderatorThread.errorCode === "VALIDATION_ERROR",
      `status=${moderatorThread.status} code=${moderatorThread.errorCode ?? "none"}`,
    );

    const guestComment = await probe(
      "POST",
      "/boards/general/threads/any/comments",
      tokenFor(ROLES.GUEST, "probe-guest-2"),
      {},
    );
    check(
      "POST a comment as GUEST is 403",
      guestComment.status === 403,
      `status=${guestComment.status}`,
    );

    const commentOnUnknownBoard = await probe(
      "POST",
      "/boards/nope/threads/any/comments",
      tokenFor(ROLES.MEMBER, "probe-member-2"),
      {},
    );
    check(
      "a comment on an unknown board is refused by the param reader",
      commentOnUnknownBoard.status === 404 && commentOnUnknownBoard.errorCode === "BOARD_NOT_FOUND",
      `status=${commentOnUnknownBoard.status} code=${commentOnUnknownBoard.errorCode ?? "none"}`,
    );

    const guestReport = await probe(
      "POST",
      "/reports",
      tokenFor(ROLES.GUEST, "probe-guest-3"),
      {},
    );
    check("POST a report as GUEST is 403", guestReport.status === 403, `status=${guestReport.status}`);

    const memberReport = await probe(
      "POST",
      "/reports",
      tokenFor(ROLES.MEMBER, "probe-member-3"),
      { reason: "NOT_A_REASON" },
    );
    check(
      "an unknown report reason is a validation failure, not a silent accept",
      memberReport.status === 400 && memberReport.errorCode === "VALIDATION_ERROR",
      `status=${memberReport.status} code=${memberReport.errorCode ?? "none"}`,
    );

    // -----------------------------------------------------------------------
    // Reactions — member only
    // -----------------------------------------------------------------------

    const anonymousReaction = await probe("PUT", "/threads/any/reaction", null);
    check("PUT a reaction without a session is 401", anonymousReaction.status === 401);

    const guestReaction = await probe(
      "PUT",
      "/comments/any/reaction",
      tokenFor(ROLES.GUEST, "probe-guest-4"),
    );
    check("PUT a reaction as GUEST is 403", guestReaction.status === 403);

    // -----------------------------------------------------------------------
    // Moderation — §7.1/§7.2: CONTENT_MODERATOR only
    // -----------------------------------------------------------------------

    const anonymousQueue = await probe("GET", "/moderation/queue", null);
    check("GET the queue without a session is 401", anonymousQueue.status === 401);

    const memberQueue = await probe(
      "GET",
      "/moderation/queue",
      tokenFor(ROLES.MEMBER, "probe-member-4"),
    );
    check(
      "GET the queue as MEMBER is 403",
      memberQueue.status === 403 && memberQueue.errorCode === "FORBIDDEN",
      `status=${memberQueue.status} code=${memberQueue.errorCode ?? "none"}`,
    );

    const guestQueue = await probe(
      "GET",
      "/moderation/queue",
      tokenFor(ROLES.GUEST, "probe-guest-5"),
    );
    check("GET the queue as GUEST is 403", guestQueue.status === 403);

    const memberModerate = await probe(
      "PATCH",
      "/moderation/threads/any",
      tokenFor(ROLES.MEMBER, "probe-member-5"),
      { action: "approve" },
    );
    check(
      "PATCH a moderation decision as MEMBER is 403",
      memberModerate.status === 403,
      `status=${memberModerate.status}`,
    );

    const moderatorModerate = await probe(
      "PATCH",
      "/moderation/threads/any",
      tokenFor(ROLES.CONTENT_MODERATOR, "probe-moderator-2"),
      { action: "not-an-action" },
    );
    check(
      "PATCH as CONTENT_MODERATOR passes the gate and fails validation",
      moderatorModerate.status === 400 && moderatorModerate.errorCode === "VALIDATION_ERROR",
      `status=${moderatorModerate.status} code=${moderatorModerate.errorCode ?? "none"}`,
    );

    const memberAnswer = await probe(
      "POST",
      "/moderation/threads/any/answers",
      tokenFor(ROLES.MEMBER, "probe-member-6"),
      { body: "ข้อความ" },
    );
    check("POST an official answer as MEMBER is 403", memberAnswer.status === 403);

    const memberCommentDecision = await probe(
      "PATCH",
      "/moderation/comments/any",
      tokenFor(ROLES.MEMBER, "probe-member-8"),
      { action: "approve" },
    );
    check(
      "PATCH a reply decision as MEMBER is 403",
      memberCommentDecision.status === 403,
      `status=${memberCommentDecision.status}`,
    );

    const moderatorCommentDecision = await probe(
      "PATCH",
      "/moderation/comments/any",
      tokenFor(ROLES.CONTENT_MODERATOR, "probe-moderator-3"),
      { action: "not-an-action" },
    );
    check(
      "PATCH a reply decision as CONTENT_MODERATOR passes the gate and fails validation",
      moderatorCommentDecision.status === 400 &&
        moderatorCommentDecision.errorCode === "VALIDATION_ERROR",
      `status=${moderatorCommentDecision.status} code=${moderatorCommentDecision.errorCode ?? "none"}`,
    );

    const memberResolve = await probe(
      "PATCH",
      "/moderation/reports/any",
      tokenFor(ROLES.MEMBER, "probe-member-7"),
      { status: "DISMISSED" },
    );
    check("PATCH a report as MEMBER is 403", memberResolve.status === 403);

    // -----------------------------------------------------------------------
    // §7.3 — the per-account posting budget
    // -----------------------------------------------------------------------

    const throttled = tokenFor(ROLES.MEMBER, "probe-throttled");
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const result = await probe("POST", "/threads", throttled, {});
      statuses.push(result.status);
    }

    check(
      "six writes in a minute from one account trip the §7.3 limiter",
      statuses.slice(0, 5).every((status) => status === 400) && statuses[5] === 429,
      `statuses=[${statuses.join(", ")}]`,
    );

    // A different account must not have been punished for the neighbour's flood:
    // the budget is keyed by account, not by address (§7.3).
    const neighbour = await probe(
      "POST",
      "/threads",
      tokenFor(ROLES.MEMBER, "probe-neighbour"),
      {},
    );
    check(
      "the budget is per account, not shared across the address",
      neighbour.status === 400,
      `status=${neighbour.status}`,
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  process.exitCode = failures === 0 ? 0 : 1;

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    return;
  }

  console.log("\nAll checks passed.");
}

void run().catch((error: unknown): void => {
  const reason = error instanceof Error ? error.message : String(error);

  console.error(`FAIL: could not complete the route-gate suite — ${reason}`);
  process.exitCode = 1;
});
