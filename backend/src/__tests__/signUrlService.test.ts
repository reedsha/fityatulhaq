/**
 * M0-Step 2 signed-URL service smoke test — a plain Node script (no Jest/Mocha/
 * sinon, matching `imageValidation.test.ts`).
 *
 *   1. Run the test:  npx ts-node src/__tests__/signUrlService.test.ts
 *
 * Web 2 does not exist yet (PRD §8.2 has Web 1 shipping before the integration),
 * so `globalThis.fetch` is replaced with a stub for every case: nothing leaves
 * the process and no Supabase or Web 2 host is contacted. The suite therefore
 * pins the *contract* rather than an integration — it asserts the request the
 * service builds, the URL it returns, and the error code each upstream status
 * maps to.
 *
 * `SUPABASE_*` is pinned below before `../services/signUrlService` is loaded,
 * because it reaches `config/supabase`, which refuses to load without a service
 * role key. The values are deliberately fake; the project URL only ever appears
 * inside strings this test inspects.
 */

import { isApplicationError } from "../middleware/errorFormatter";

const PROJECT_URL = "https://project.supabase.co";
const WEB2_BASE_URL = "https://web2-internal.test";
const SERVICE_SECRET = "service-secret-from-env";
const AVATAR_BUCKET = "assets";

process.env.SUPABASE_URL = PROJECT_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-for-tests";
process.env.SUPABASE_STORAGE_BUCKET = AVATAR_BUCKET;
process.env.SUPABASE_SIGNED_ASSETS_BUCKET = "signed-assets";
process.env.WEB2_INTERNAL_API_URL = WEB2_BASE_URL;
process.env.BACKEND_API_SECRET = SERVICE_SECRET;

let failures = 0;

function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    return;
  }

  console.error(`FAIL: ${name}`);
  failures += 1;
}

/** The parts of a fetch call the service is expected to control. */
interface ObservedInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: { addEventListener?: (type: string, listener: () => void) => void };
}

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

interface StubAnswer {
  status: number;
  body?: unknown;
  malformedBody?: boolean;
}

let lastUrl = "";
let lastInit: ObservedInit | undefined;
let fetchCalls = 0;

const originalFetch = globalThis.fetch;

/** Answers every call with one canned response and records what was sent. */
function stubFetch(answer: StubAnswer | ((url: string) => StubAnswer)): void {
  fetchCalls = 0;
  lastUrl = "";
  lastInit = undefined;

  globalThis.fetch = (async (input: unknown, init: unknown): Promise<FetchResponse> => {
    fetchCalls += 1;
    lastUrl = String(input);
    lastInit = (init ?? undefined) as ObservedInit | undefined;

    const resolved = typeof answer === "function" ? answer(lastUrl) : answer;

    return {
      ok: resolved.status >= 200 && resolved.status < 300,
      status: resolved.status,
      json: async (): Promise<unknown> => {
        if (resolved.malformedBody === true) {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        }

        return resolved.body;
      },
    } as unknown as FetchResponse;
  }) as unknown as typeof fetch;
}

/** Never answers, and rejects only when the caller's AbortController fires. */
function stubHangingFetch(): void {
  fetchCalls = 0;
  lastUrl = "";
  lastInit = undefined;

  globalThis.fetch = (async (input: unknown, init: unknown): Promise<FetchResponse> => {
    fetchCalls += 1;
    lastUrl = String(input);

    const observed = (init ?? undefined) as ObservedInit | undefined;

    return new Promise<FetchResponse>((_resolve, reject): void => {
      observed?.signal?.addEventListener?.("abort", (): void => {
        const abortError = new Error("The operation was aborted");
        abortError.name = "AbortError";
        reject(abortError);
      });
    });
  }) as unknown as typeof fetch;
}

function stubNetworkFailure(): void {
  fetchCalls = 0;

  globalThis.fetch = (async (): Promise<FetchResponse> => {
    fetchCalls += 1;
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;
}

async function captureFailure(
  call: () => Promise<unknown>,
): Promise<{ code: string; statusCode: number }> {
  try {
    await call();
    return { code: "", statusCode: 0 };
  } catch (error) {
    return isApplicationError(error)
      ? { code: error.code, statusCode: error.statusCode }
      : { code: "", statusCode: 0 };
  }
}

function sentSecret(): string {
  return lastInit?.headers?.["x-backend-api-secret"] ?? "";
}

function sentBody(): Record<string, unknown> {
  const raw = lastInit?.body ?? "{}";

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function run(): Promise<void> {
  const service = await import("../services/signUrlService");
  const { getSignedAssetUrl } = service;

  // ----------------------------------------------------------
  // Happy path — the response envelope and the built URL
  // ----------------------------------------------------------

  stubFetch({ status: 200, body: { token: "tok-abc", expiresInSeconds: 300 } });

  const signed = await getSignedAssetUrl("k-1", "u-1");

  check(
    "the payload carries exactly signedUrl and expiresAt",
    Object.keys(signed).sort().join(",") === "expiresAt,signedUrl",
  );
  check(
    "the signed URL points at the private assets bucket",
    signed.signedUrl ===
      `${PROJECT_URL}/storage/v1/object/sign/signed-assets/k-1?token=tok-abc`,
  );
  check("no `success` flag leaks into the payload", !("success" in signed));
  check("expiresAt is a future timestamp in ms", Number.isInteger(signed.expiresAt) && signed.expiresAt > Date.now());
  check(
    "expiresAt reflects the 300 second default TTL",
    Math.abs(signed.expiresAt - Date.now() - 300_000) < 5_000,
  );

  // ----------------------------------------------------------
  // The upstream request the service builds
  // ----------------------------------------------------------

  check(
    "the upstream path is the contracted signing endpoint",
    lastUrl === `${WEB2_BASE_URL}/internal/api/v1/assets/k-1/sign`,
  );
  check("the upstream call is a POST", lastInit?.method === "POST");
  check("the service credential travels in its own header", sentSecret() === SERVICE_SECRET);
  check("the caller's id is forwarded to Web 2", sentBody()["userId"] === "u-1");
  check("the requested TTL is forwarded to Web 2", sentBody()["ttlSeconds"] === 300);
  check("the content type is JSON", lastInit?.headers?.["content-type"] === "application/json");
  check("an abort signal bounds the call", lastInit?.signal !== undefined);

  // ----------------------------------------------------------
  // Credentials come from the environment, never from source
  // ----------------------------------------------------------

  process.env.BACKEND_API_SECRET = "a-different-secret";
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  await getSignedAssetUrl("k-1", "u-1");
  check("the secret is read from env, not hardcoded", sentSecret() === "a-different-secret");

  process.env.WEB2_INTERNAL_API_URL = "https://other-web2.test/";
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  await getSignedAssetUrl("k-1", "u-1");
  check(
    "the base URL is read from env and a trailing slash is normalised",
    lastUrl === "https://other-web2.test/internal/api/v1/assets/k-1/sign",
  );

  process.env.BACKEND_API_SECRET = SERVICE_SECRET;
  process.env.WEB2_INTERNAL_API_URL = WEB2_BASE_URL;

  // ----------------------------------------------------------
  // Asset keys
  // ----------------------------------------------------------

  stubFetch({ status: 200, body: { token: "tok-abc" } });
  await getSignedAssetUrl("k 1/x", "u-1");
  check(
    "an asset id is percent-encoded into the upstream path",
    lastUrl === `${WEB2_BASE_URL}/internal/api/v1/assets/k%201%2Fx/sign`,
  );

  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const withPath = await getSignedAssetUrl("a-9", "u-1");
  check(
    "an id with no path still resolves to the id",
    withPath.signedUrl.includes("/signed-assets/a-9?token="),
  );

  stubFetch({ status: 200, body: { token: "tok-abc", objectPath: "knowledge/2026/paper.pdf" } });
  const explicitPath = await getSignedAssetUrl("a-9", "u-1");
  check(
    "an explicit object path is honoured, keeping its separators",
    explicitPath.signedUrl.includes("/signed-assets/knowledge/2026/paper.pdf?token="),
  );

  stubFetch({ status: 200, body: { token: "tok-abc", objectPath: "knowledge/../secrets.pdf" } });
  const traversal = await captureFailure(() => getSignedAssetUrl("a-9", "u-1"));
  check(
    "a traversal in the object path is refused",
    traversal.code === "ASSET_NOT_FOUND" && traversal.statusCode === 404,
  );

  // ----------------------------------------------------------
  // Upstream failure mapping
  // ----------------------------------------------------------

  stubFetch({ status: 404 });
  const notFound = await captureFailure(() => getSignedAssetUrl("missing", "u-1"));
  check(
    "a 404 becomes ASSET_NOT_FOUND / 404",
    notFound.code === "ASSET_NOT_FOUND" && notFound.statusCode === 404,
  );

  stubFetch({ status: 500 });
  const upstreamError = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "a 500 becomes SERVICE_UNAVAILABLE / 503",
    upstreamError.code === "SERVICE_UNAVAILABLE" && upstreamError.statusCode === 503,
  );

  stubFetch({ status: 418 });
  const teapot = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "any other non-ok status becomes SERVICE_UNAVAILABLE / 503",
    teapot.code === "SERVICE_UNAVAILABLE" && teapot.statusCode === 503,
  );

  stubFetch({ status: 401 });
  const rejected = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "a rejected credential is 502, never a 401 for the member",
    rejected.code === "SERVICE_CREDENTIALS_REJECTED" && rejected.statusCode === 502,
  );

  stubFetch({ status: 403 });
  const forbidden = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "a 403 is also reported as a service credential problem",
    forbidden.code === "SERVICE_CREDENTIALS_REJECTED" && forbidden.statusCode === 502,
  );

  stubFetch({ status: 200, malformedBody: true });
  const malformed = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "a malformed response body becomes SERVICE_UNAVAILABLE / 503",
    malformed.code === "SERVICE_UNAVAILABLE" && malformed.statusCode === 503,
  );

  stubNetworkFailure();
  const unreachable = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "an unreachable Web 2 becomes SERVICE_UNAVAILABLE / 503",
    unreachable.code === "SERVICE_UNAVAILABLE" && unreachable.statusCode === 503,
  );

  process.env.WEB2_INTERNAL_TIMEOUT_MS = "100";
  stubHangingFetch();
  const timedOut = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "a call that never answers times out as SERVICE_UNAVAILABLE / 503",
    timedOut.code === "SERVICE_UNAVAILABLE" && timedOut.statusCode === 503,
  );
  delete process.env.WEB2_INTERNAL_TIMEOUT_MS;

  // ----------------------------------------------------------
  // Token payload validation
  // ----------------------------------------------------------

  stubFetch({ status: 200, body: {} });
  const noToken = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "a response without a token is treated as an upstream failure",
    noToken.code === "SERVICE_UNAVAILABLE" && noToken.statusCode === 503,
  );

  stubFetch({ status: 200, body: { token: 12345 } });
  const numericToken = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "a non-string token is treated as an upstream failure",
    numericToken.code === "SERVICE_UNAVAILABLE" && numericToken.statusCode === 503,
  );

  // ----------------------------------------------------------
  // TTL rules
  // ----------------------------------------------------------

  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const upstreamShorter = await getSignedAssetUrl("k-1", "u-1");
  check(
    "an upstream TTL shorter than ours wins",
    Math.abs(upstreamShorter.expiresAt - Date.now() - 300_000) < 5_000,
  );

  process.env.SIGNED_URL_TTL_SECONDS = "600";
  stubFetch({ status: 200, body: { token: "tok-abc", expiresInSeconds: 60 } });
  const shorter = await getSignedAssetUrl("k-1", "u-1");
  check(
    "a 60 second upstream TTL caps our 600 second request",
    Math.abs(shorter.expiresAt - Date.now() - 60_000) < 5_000,
  );
  check("the requested TTL forwarded upstream honours the env var", sentBody()["ttlSeconds"] === 600);

  process.env.SIGNED_URL_TTL_SECONDS = "1";
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const clampedLow = await getSignedAssetUrl("k-1", "u-1");
  check(
    "a TTL below the floor is clamped to 30 seconds",
    Math.abs(clampedLow.expiresAt - Date.now() - 30_000) < 5_000,
  );

  process.env.SIGNED_URL_TTL_SECONDS = "999999";
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const clampedHigh = await getSignedAssetUrl("k-1", "u-1");
  check(
    "a TTL above the ceiling is clamped to one hour",
    Math.abs(clampedHigh.expiresAt - Date.now() - 3_600_000) < 5_000,
  );

  process.env.SIGNED_URL_TTL_SECONDS = "not-a-number";
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const fallbackTtl = await getSignedAssetUrl("k-1", "u-1");
  check(
    "a non-numeric TTL falls back to 300 seconds",
    Math.abs(fallbackTtl.expiresAt - Date.now() - 300_000) < 5_000,
  );
  delete process.env.SIGNED_URL_TTL_SECONDS;

  // ----------------------------------------------------------
  // Bucket topology — gated assets must never share the avatar bucket
  // ----------------------------------------------------------

  process.env.SUPABASE_SIGNED_ASSETS_BUCKET = "gated-files";
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const customBucket = await getSignedAssetUrl("k-1", "u-1");
  check(
    "the gated bucket name comes from the environment",
    customBucket.signedUrl.includes("/signed-assets/") === false &&
      customBucket.signedUrl.includes("/gated-files/k-1?token="),
  );

  process.env.SUPABASE_SIGNED_ASSETS_BUCKET = "   ";
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const blankBucket = await getSignedAssetUrl("k-1", "u-1");
  check(
    "a blank bucket name falls back to the dedicated default",
    blankBucket.signedUrl.includes("/signed-assets/k-1?token="),
  );
  check(
    "the gated default is not the public avatar bucket",
    service.readSignedAssetsBucket() !== process.env.SUPABASE_STORAGE_BUCKET,
  );
  delete process.env.SUPABASE_SIGNED_ASSETS_BUCKET;

  // ----------------------------------------------------------
  // Missing configuration fails loudly and never calls out
  // ----------------------------------------------------------

  delete process.env.WEB2_INTERNAL_API_URL;
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const unconfigured = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "an unset WEB2_INTERNAL_API_URL fails as SERVICE_UNAVAILABLE / 503",
    unconfigured.code === "SERVICE_UNAVAILABLE" && unconfigured.statusCode === 503,
  );
  check("an unset base URL makes no upstream call", fetchCalls === 0);

  process.env.WEB2_INTERNAL_API_URL = WEB2_BASE_URL;
  delete process.env.BACKEND_API_SECRET;
  stubFetch({ status: 200, body: { token: "tok-abc" } });
  const noSecret = await captureFailure(() => getSignedAssetUrl("k-1", "u-1"));
  check(
    "an unset service credential fails as SERVICE_UNAVAILABLE / 503",
    noSecret.code === "SERVICE_UNAVAILABLE" && noSecret.statusCode === 503,
  );
  check("an unset credential makes no upstream call", fetchCalls === 0);

  process.env.BACKEND_API_SECRET = SERVICE_SECRET;

  globalThis.fetch = originalFetch;
}

run()
  .then((): void => {
    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nAll checks passed.");
  })
  .catch((error: unknown): void => {
    const reason = error instanceof Error ? error.stack ?? error.message : String(error);

    console.error(`FAIL: the test harness threw — ${reason}`);
    process.exitCode = 1;
  });
