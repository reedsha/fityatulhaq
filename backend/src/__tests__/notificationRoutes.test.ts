/**
 * M5 notification route-gate suite — the `webboardRoutes.test.ts` pattern, applied
 * to the notifications router: mount the real router on an ephemeral in-process
 * port and prove the gate that lives in the router, not the service.
 *
 *   1. Run the test:  npx ts-node --transpile-only src/__tests__/notificationRoutes.test.ts
 *
 * No database is touched. Every probe here is decided by the middleware chain
 * (401/403) before a controller runs, which is deliberate: a member-token probe
 * would reach Prisma, and this suite must stay runnable with an unused
 * `DATABASE_URL`.
 *
 * Expected matrix (PRD §3.3 + §5.4.5):
 *   - notifications belong to one account, so every route is member-only
 *   - no token → 401, GUEST → 403
 *   - the member path is not probed, because it would need a live row
 */

import "dotenv/config";

import cookieParser from "cookie-parser";
import express from "express";
import { createServer, type Server } from "node:http";

import { errorHandler } from "../middleware/errorFormatter";
import { sanitizeBody } from "../middleware/sanitizeBody";
import { signAccessToken } from "../services/jwtService";
import { ROLES } from "../types";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "notification-routes-secret";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://unused:unused@localhost:5432/unused";

interface ProbeResult {
  status: number;
  errorCode: string | null;
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
  return signAccessToken({ id, email: `${id}@notification-probe.test`, role });
}

async function run(): Promise<void> {
  const { default: notificationRoutes } = await import("../routes/notificationRoutes");
  const { NOTIFICATION_ROUTE_PREFIX } = await import("../config/routePrefix");

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(sanitizeBody);
  app.use(NOTIFICATION_ROUTE_PREFIX, notificationRoutes);
  app.use(errorHandler);

  const server: Server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("The probe server did not bind a port");
  }

  const baseUrl = `http://127.0.0.1:${address.port}${NOTIFICATION_ROUTE_PREFIX}`;

  async function probe(
    method: string,
    path: string,
    token: string | null,
  ): Promise<ProbeResult> {
    const headers: Record<string, string> = {};

    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, { method, headers });

    let errorCode: string | null = null;

    try {
      const payload = (await response.json()) as {
        success?: boolean;
        error?: { code?: string };
      };

      errorCode = payload.success === false ? payload.error?.code ?? null : null;
    } catch {
      // Failures here are decided by status, not body.
    }

    return { status: response.status, errorCode };
  }

  try {
    const guest = tokenFor(ROLES.GUEST, "probe-notif-guest");
    const member = tokenFor(ROLES.MEMBER, "probe-notif-member");

    const cases: Array<{ method: string; path: string; name: string }> = [
      { method: "GET", path: "/", name: "GET /notifications" },
      { method: "GET", path: "/unread-count", name: "GET /notifications/unread-count" },
      { method: "PATCH", path: "/any/read", name: "PATCH /notifications/:id/read" },
    ];

    for (const testCase of cases) {
      const anonymous = await probe(testCase.method, testCase.path, null);
      check(
        `${testCase.name} without a session is 401`,
        anonymous.status === 401,
        `status=${anonymous.status}`,
      );

      const asGuest = await probe(testCase.method, testCase.path, guest);
      check(
        `${testCase.name} as GUEST is 403`,
        asGuest.status === 403 && asGuest.errorCode === "FORBIDDEN",
        `status=${asGuest.status} code=${asGuest.errorCode ?? "none"}`,
      );
    }

    // A member token reaches the controller, so the gate has to let it past —
    // anything but 401/403 proves the router is not over-gating. The request
    // itself fails without a database, which is why only the status class is
    // asserted, never the body.
    const memberList = await probe("GET", "/", member);
    check(
      "a MEMBER token passes the gate (fails later, not at the router)",
      memberList.status !== 401 && memberList.status !== 403,
      `status=${memberList.status}`,
    );

    // The literal `/unread-count` must never be read as a notification id: if it
    // were, a member would get 404 NOTIFICATION_NOT_FOUND rather than the count.
    const memberCount = await probe("GET", "/unread-count", member);
    check(
      "the unread-count route is not captured by the id param",
      memberCount.errorCode !== "NOTIFICATION_NOT_FOUND",
      `code=${memberCount.errorCode ?? "none"}`,
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

  console.error(`FAIL: could not complete the notification gate suite — ${reason}`);
  process.exitCode = 1;
});
