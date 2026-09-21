/**
 * Phase 1 auth smoke test — a plain Node script (no Jest/Mocha).
 *
 *   1. Start the API:  npm run dev
 *   2. Run the test:   npx ts-node src/__tests__/auth.test.ts
 *
 * It registers a brand-new member against the running server and asserts the
 * happy path returns a usable token pair.
 */

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;

interface RegisterResponseBody {
  success?: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

function buildPayload(): Record<string, string> {
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

  return {
    email: `smoke_${suffix}@fityatulhaq.test`,
    username: `smoke_${suffix}`.slice(0, 30),
    password: "SmokeTest123!",
    fullName: "Smoke Test",
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

async function runSmokeTest(): Promise<void> {
  const url = `${BASE_URL}/auth/register`;
  const payload = buildPayload();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const body = (await response.json()) as RegisterResponseBody;
    const statusAccepted = response.status === 201 || response.status === 200;
    const hasTokens =
      isNonEmptyString(body.data?.accessToken) && isNonEmptyString(body.data?.refreshToken);

    if (statusAccepted && body.success === true && hasTokens) {
      console.log(`PASS: register returned ${response.status} with an access + refresh token`);
      return;
    }

    console.error(
      `FAIL: register returned ${response.status} — success=${String(body.success)} ` +
        `accessToken=${isNonEmptyString(body.data?.accessToken)} ` +
        `refreshToken=${isNonEmptyString(body.data?.refreshToken)} ` +
        `error=${body.error?.code ?? "none"}`,
    );
    process.exitCode = 1;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    console.error(`FAIL: could not complete the request to ${url} — ${reason}`);
    process.exitCode = 1;
  }
}

void runSmokeTest();