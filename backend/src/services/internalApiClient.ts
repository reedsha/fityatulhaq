import { createAppError, isApplicationError, toErrorMessage } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";

/**
 * Transport for Web 2's Internal API.
 *
 * Deliberately knows nothing about assets: it authenticates, bounds the call,
 * and maps the upstream status onto the API's error contract. The committee sync
 * in M6 reuses this module for the same reasons, so anything domain-specific
 * belongs in the caller instead.
 *
 * Failures are raised as transport codes (`UPSTREAM_*`) rather than user-facing
 * ones — only the calling service knows what a 404 means in its own domain.
 */

const DEFAULT_TIMEOUT_MS = 5_000;
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 30_000;

/**
 * Service-to-service credential header, carrying `BACKEND_API_SECRET`.
 *
 * That variable is already declared required by `src/index.ts` and is referenced
 * nowhere else, so it is plainly the reserved Web 2 credential. Reusing it keeps
 * one secret per concern: a second key would have to be rotated in lockstep with
 * this one, and PRD §9.3 requires Web 1 and Web 2 secrets to stay strictly
 * separated.
 */
const SERVICE_SECRET_HEADER = "x-backend-api-secret";

export interface InternalApiCall {
  /** Path below the base URL, e.g. `/internal/api/v1/assets/a-1/sign`. */
  path: string;
  /** JSON body, sent verbatim so the record of who asked for what reaches Web 2. */
  body: unknown;
  /** Overrides `WEB2_INTERNAL_TIMEOUT_MS`. Used by the tests. */
  timeoutMs?: number;
}

/**
 * Base URL with any trailing slash removed, so paths concatenate predictably.
 *
 * Read per call rather than at module load: a boot-time value would freeze the
 * configuration the moment the module was first imported, which makes both the
 * tests and a container restart harder to reason about.
 */
export function readWeb2BaseUrl(): string {
  const baseUrl = process.env.WEB2_INTERNAL_API_URL?.trim() ?? "";

  if (baseUrl.length === 0) {
    throw createAppError(
      "SERVICE_UNAVAILABLE",
      "The Web 2 internal API is not configured (WEB2_INTERNAL_API_URL is unset)",
      503,
    );
  }

  return baseUrl.replace(/\/+$/, "");
}

function readServiceSecret(): string {
  const secret = process.env.BACKEND_API_SECRET?.trim() ?? "";

  if (secret.length === 0) {
    throw createAppError(
      "SERVICE_UNAVAILABLE",
      "The Web 2 service credential is not configured (BACKEND_API_SECRET is unset)",
      503,
    );
  }

  return secret;
}

/** Env-tunable so a slow environment can widen the bound and tests can shrink it. */
export function readTimeoutMs(override?: number): number {
  if (override !== undefined) {
    return override;
  }

  const configured = Number.parseInt(process.env.WEB2_INTERNAL_TIMEOUT_MS ?? "", 10);

  if (!Number.isInteger(configured)) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(Math.max(configured, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

/**
 * POSTs to Web 2 and returns its parsed JSON body.
 *
 * `AbortController` bounds the call rather than `AbortSignal.timeout`, because
 * the explicit timer records *why* the abort happened — a timeout is reported as
 * an unreachable upstream with a duration, which is what an operator needs to
 * tell a slow Web 2 apart from a dead one.
 */
export async function callInternalApi<T>(call: InternalApiCall): Promise<T> {
  const baseUrl = readWeb2BaseUrl();
  const secret = readServiceSecret();
  const timeoutMs = readTimeoutMs(call.timeoutMs);

  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout((): void => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${call.path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [SERVICE_SECRET_HEADER]: secret,
      },
      body: JSON.stringify(call.body),
      signal: controller.signal,
    });

    if (response.status === 404) {
      throw createAppError("UPSTREAM_NOT_FOUND", "Web 2 does not hold that record", 404);
    }

    if (response.status === 401 || response.status === 403) {
      throw createAppError(
        "UPSTREAM_CREDENTIALS_REJECTED",
        "Web 2 rejected the service credential",
        502,
      );
    }

    if (!response.ok) {
      throw createAppError("UPSTREAM_UNAVAILABLE", `Web 2 answered ${response.status}`, 503);
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw createAppError(
        "UPSTREAM_UNAVAILABLE",
        `Web 2 returned a malformed response body (${toErrorMessage(error)})`,
        503,
      );
    }
  } catch (error) {
    // Codes raised above are already final; only genuinely unexpected failures
    // need interpreting here.
    if (isApplicationError(error)) {
      throw error;
    }

    const reason = timedOut
      ? `Web 2 did not answer within ${timeoutMs} ms`
      : `Web 2 could not be reached (${toErrorMessage(error)})`;

    logger.warn(`[UPSTREAM_UNAVAILABLE] ${reason}`);

    throw createAppError("UPSTREAM_UNAVAILABLE", reason, 503);
  } finally {
    clearTimeout(timer);
  }
}
