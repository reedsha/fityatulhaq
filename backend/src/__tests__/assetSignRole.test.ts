/**
 * M1.5 role-gate smoke test for `POST /api/v1/assets/sign` — a plain Node
 * script in the `auth.test.ts` style: it talks HTTP to a RUNNING API, because
 * the gate lives in the router, not the service.
 *
 *   1. Start the API:  npm run dev
 *   2. Run the test:   npx ts-node --transpile-only src/__tests__/assetSignRole.test.ts
 *
 * Roles travel inside the stateless access token, so the GUEST and MEMBER
 * probes mint their own tokens instead of creating database rows — the suite
 * leaves no test data behind. `dotenv/config` supplies `JWT_SECRET` to the
 * minting side; the API process uses its own environment.
 *
 * Expected outcomes (PRD §6.4 — asset downloads are member actions):
 *   - no token        -> 401 UNAUTHORIZED  (authenticate stage)
 *   - GUEST token     -> 403 FORBIDDEN     (role stage, controller never runs)
 *   - MEMBER token    -> anything except 401/403. Web 2 is unwired until M6, so
 *     the upstream exchange failing (502/503) is a PASS for the gate: the point
 *     here is that the request reached the controller.
 */

import "dotenv/config";

import { signAccessToken } from "../services/jwtService";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

interface EnvelopeBody {
  success?: boolean;
  data?: {
    signedUrl?: string;
    expiresAt?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

let failures = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    return;
  }

  const suffix = detail === undefined ? "" : ` — ${detail}`;
  failures += 1;
  console.error(`FAIL: ${name}${suffix}`);
}

async function postSign(token: string | null): Promise<{ status: number; body: EnvelopeBody }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (token !== null) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/assets/sign`, {
    method: "POST",
    headers,
    body: JSON.stringify({ assetId: "role-gate-probe" }),
  });

  let body: EnvelopeBody = {};

  try {
    body = (await response.json()) as EnvelopeBody;
  } catch {
    // A non-JSON body is acceptable — the status assertions below are the point.
  }

  return { status: response.status, body };
}

async function run(): Promise<void> {
  // 1 — Anonymous: the authenticate stage refuses before any role work.
  const anonymous = await postSign(null);
  check(
    "no token -> 401 UNAUTHORIZED",
    anonymous.status === 401 && anonymous.body.error?.code === "UNAUTHORIZED",
    `status=${anonymous.status} code=${anonymous.body.error?.code ?? "none"}`,
  );

  // 2 — GUEST: authenticated but not entitled to signed downloads (§6.4).
  const guestToken = signAccessToken({
    id: "role-probe-guest",
    email: "role-probe@fityatulhaq.test",
    role: "GUEST",
  });
  const guest = await postSign(guestToken);
  check(
    "GUEST-role token -> 403 FORBIDDEN",
    guest.status === 403 && guest.body.error?.code === "FORBIDDEN",
    `status=${guest.status} code=${guest.body.error?.code ?? "none"}`,
  );

  // 3 — MEMBER: the gate must open. The upstream Web 2 exchange failing is M6's
  // concern; anything except 401/403 proves the request reached the controller.
  const memberToken = signAccessToken({
    id: "role-probe-member",
    email: "role-probe@fityatulhaq.test",
    role: "MEMBER",
  });
  const member = await postSign(memberToken);
  check(
    "MEMBER-role token passes the role gate (upstream status is M6's concern)",
    member.status !== 401 && member.status !== 403,
    `status=${member.status} code=${member.body.error?.code ?? "none"}`,
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

  console.error(`FAIL: could not complete the role-gate test — ${reason}`);
  process.exitCode = 1;
});
