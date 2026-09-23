/**
 * Phase 1/3 auth smoke test — a plain Node script (no Jest/Mocha).
 *
 *   1. Start the API:  npm run dev
 *   2. Run the test:   npx ts-node src/__tests__/auth.test.ts
 *
 * It registers a brand-new member against the running server, then walks the
 * whole cookie session: the register response must hand back an access token in
 * the body and both session cookies, the refresh cookie must be able to mint a
 * fresh access token (rotating itself), and logout must expire both cookies.
 *
 * It closes on the two contracts the verification screens depend on: signing in
 * to an unverified account reports `isNew` so the client can prompt for a code,
 * and the verify endpoint refuses a code that does not match.
 */

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

interface EnvelopeBody {
  success?: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    message?: string;
    isNew?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    return;
  }

  const suffix = detail === undefined ? "" : ` — ${detail}`;

  failures.push(`${name}${suffix}`);
  console.error(`FAIL: ${name}${suffix}`);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** All `Set-Cookie` headers, joined; undici folds them into one comma list. */
function cookieHeaders(response: Response): string {
  return response.headers.get("set-cookie") ?? "";
}

/**
 * Pulls one cookie's value out of a folded `Set-Cookie` header.
 *
 * Safe here because these cookies never carry a comma: a JWT value is
 * `[A-Za-z0-9_-]` plus dots, and the attributes are `;`-separated.
 */
function extractCookie(header: string, name: string): string | null {
  const match = new RegExp(`(?:^|[,;]\\s*)${name}=([^;,\\s]+)`).exec(header);

  return match?.[1] ?? null;
}

async function postJson(
  path: string,
  body: unknown,
  cookie?: string,
): Promise<{ response: Response; body: EnvelopeBody }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (cookie !== undefined) {
    headers["Cookie"] = cookie;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const parsed: unknown = await response.json();
  const envelope: EnvelopeBody = isRecord(parsed) ? (parsed as EnvelopeBody) : {};

  return { response, body: envelope };
}

function describeFailure(label: string, response: Response, body: EnvelopeBody): string {
  return `${label} returned ${response.status} — success=${String(body.success)} error=${
    body.error?.code ?? "none"
  }`;
}

async function runSmokeTest(): Promise<void> {
  const payload = buildPayload();

  /* ── 1. Register: body token + both cookies ─────────────────────────────── */
  const registered = await postJson("/auth/register", payload);
  const registerCookies = cookieHeaders(registered.response);
  const registerOkay =
    (registered.response.status === 201 || registered.response.status === 200) &&
    registered.body.success === true &&
    isNonEmptyString(registered.body.data?.accessToken);

  check(
    "register returns 201 with an access token in the body",
    registerOkay,
    describeFailure("register", registered.response, registered.body),
  );

  check(
    "register sets an httpOnly access cookie",
    registerCookies.includes(`${ACCESS_COOKIE}=`) && /HttpOnly/i.test(registerCookies),
    `Set-Cookie did not include an httpOnly ${ACCESS_COOKIE}`,
  );

  check(
    "register sets an httpOnly refresh cookie scoped to the auth routes",
    registerCookies.includes(`${REFRESH_COOKIE}=`) &&
      registerCookies.includes("/api/v1/auth"),
    `Set-Cookie did not include a path-scoped ${REFRESH_COOKIE}`,
  );

  check(
    "register no longer leaks the refresh token in the response body",
    registered.body.data?.refreshToken === undefined,
    "the refresh token is still present in the JSON body",
  );

  const refreshCookie = extractCookie(registerCookies, REFRESH_COOKIE);

  if (refreshCookie === null) {
    console.error("FAIL: cannot continue — no refresh cookie to present");
    failures.push("refresh cookie missing");
    process.exitCode = 1;
    return;
  }

  /* ── 2. Refresh: the cookie alone must mint a new session ───────────────── */
  const refreshed = await postJson("/auth/refresh", {}, `${REFRESH_COOKIE}=${refreshCookie}`);
  const rotatedCookies = cookieHeaders(refreshed.response);
  const rotatedRefresh = extractCookie(rotatedCookies, REFRESH_COOKIE);

  check(
    "refresh with only the cookie returns 200 and a new access token",
    refreshed.response.status === 200 && isNonEmptyString(refreshed.body.data?.accessToken),
    describeFailure("refresh", refreshed.response, refreshed.body),
  );

  check(
    "refresh rotates the refresh cookie",
    rotatedRefresh !== null && rotatedRefresh !== refreshCookie,
    "the refresh cookie was not replaced",
  );

  /* ── 3. Logout: both cookies must be expired ────────────────────────────── */
  const sessionCookie = rotatedRefresh ?? refreshCookie;
  const loggedOut = await postJson("/auth/logout", {}, `${REFRESH_COOKIE}=${sessionCookie}`);
  const clearedCookies = cookieHeaders(loggedOut.response);

  check(
    "logout returns 200",
    loggedOut.response.status === 200 && loggedOut.body.success === true,
    describeFailure("logout", loggedOut.response, loggedOut.body),
  );

  check(
    "logout expires both session cookies",
    clearedCookies.includes(`${ACCESS_COOKIE}=`) &&
      clearedCookies.includes(`${REFRESH_COOKIE}=`) &&
      /Max-Age=0/i.test(clearedCookies),
    `Set-Cookie did not clear the session: ${clearedCookies}`,
  );

  /* ── 4. Login: an unverified account must be flagged for the client ─────── */
  const loginResponse = await postJson("/auth/login", {
    identifier: payload.email,
    password: payload.password,
  });
  const loginCookies = cookieHeaders(loginResponse.response);

  check(
    "login returns 200 and sets both session cookies",
    loginResponse.response.status === 200 &&
      loginCookies.includes(`${ACCESS_COOKIE}=`) &&
      loginCookies.includes(`${REFRESH_COOKIE}=`),
    describeFailure("login", loginResponse.response, loginResponse.body),
  );

  check(
    "login flags an unverified account so the client can prompt for the code",
    loginResponse.body.data?.isNew === true,
    `expected isNew=true, received ${String(loginResponse.body.data?.isNew)}`,
  );

  /* ── 5. Verify: a code that does not match must be refused ──────────────── */
  const verification = await postJson("/auth/verify-email", {
    identifier: payload.email,
    code: "000000",
  });

  check(
    "verify-email refuses a code that does not match",
    verification.response.status === 400 && verification.body.error?.code === "INVALID_OTP",
    describeFailure("verify-email", verification.response, verification.body),
  );

  process.exitCode = failures.length === 0 ? 0 : 1;

  if (failures.length > 0) {
    console.error(`\n${failures.length} check(s) failed.`);
  }
}

void runSmokeTest().catch((error: unknown): void => {
  const reason = error instanceof Error ? error.message : String(error);

  console.error(`FAIL: could not complete the smoke test — ${reason}`);
  process.exitCode = 1;
});
