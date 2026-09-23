import { SUPABASE_PROJECT_URL } from "../config/supabase";
import {
  type ApplicationError,
  createAppError,
  isApplicationError,
  toHttpError,
} from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";
import type { SignedUrlResponse } from "../types";
import { callInternalApi } from "./internalApiClient";

/**
 * M0-Step 2 — the asset half of the two-layer contract in PRD §6.5 / §8.2.
 *
 * Knowledge and download files live on a Supabase Storage bucket shared with
 * Web 2, so this API never streams bytes: it exchanges the caller's access token
 * for a short-lived signing token and returns a URL the browser follows
 * directly. That is what lets gated files bypass the JSON middleware chain
 * without the bucket ever being public.
 *
 * The exchange is proxied through Web 2 rather than signed locally with
 * `SUPABASE_SERVICE_ROLE_KEY`, because Web 2 owns the uploads: it is the only
 * side that can say whether an asset id is real and whether this caller is
 * allowed to have it.
 *
 * ⚠️ Bucket topology: gated assets do NOT live in `SUPABASE_STORAGE_BUCKET`
 * ("assets"), which is public and serves avatars through
 * `services/storageService`. They get their own private bucket, named by
 * `SUPABASE_SIGNED_ASSETS_BUCKET`, so a signed URL is the only way in. The
 * default below is a deliberately distinct name, so a missing env var can never
 * silently point gated files at the public avatar bucket.
 *
 * ⚠️ Web 2 does not exist yet. Per §8.2, Web 1 ships first, so the exchange sits
 * behind `internalApiClient` and is exercised against a stubbed `fetch` in
 * `src/__tests__/signUrlService.test.ts`. The live round-trip is M6 work.
 */

const WEB2_SIGN_PATH_PREFIX = "/internal/api/v1/assets";

const DEFAULT_TTL_SECONDS = 300;
const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 3_600;

const DEFAULT_SIGNED_ASSETS_BUCKET = "signed-assets";

/** The shape Web 2 is contracted to answer the signing call with. */
interface Web2SignPayload {
  token?: unknown;
  expiresInSeconds?: unknown;
  objectPath?: unknown;
}

/**
 * Maps an upstream transport failure onto what the caller of this API should see.
 *
 * The distinction matters: a rejected service credential is *our* misconfiguration
 * and must not surface as a 401, or every member would be told their own session
 * had expired and support would chase a client bug that does not exist.
 */
const UPSTREAM_FAILURES: Record<string, { code: string; message: string; statusCode: number }> = {
  UPSTREAM_NOT_FOUND: {
    code: "ASSET_NOT_FOUND",
    message: "The requested asset does not exist",
    statusCode: 404,
  },
  UPSTREAM_CREDENTIALS_REJECTED: {
    code: "SERVICE_CREDENTIALS_REJECTED",
    message: "The asset service rejected our credentials",
    statusCode: 502,
  },
  UPSTREAM_UNAVAILABLE: {
    code: "SERVICE_UNAVAILABLE",
    message: "The asset service is temporarily unavailable",
    statusCode: 503,
  },
};

function readClampedInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(raw ?? "", 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

/** `SIGNED_URL_TTL_SECONDS`, clamped to a window that is short-lived but usable. */
export function readSignedUrlTtlSeconds(): number {
  return readClampedInt(
    process.env.SIGNED_URL_TTL_SECONDS,
    DEFAULT_TTL_SECONDS,
    MIN_TTL_SECONDS,
    MAX_TTL_SECONDS,
  );
}

export function readSignedAssetsBucket(): string {
  const bucket = process.env.SUPABASE_SIGNED_ASSETS_BUCKET?.trim() ?? "";

  return bucket.length > 0 ? bucket : DEFAULT_SIGNED_ASSETS_BUCKET;
}

/**
 * Resolves the storage key for an asset.
 *
 * Web 2 may answer with an explicit object path when the asset id is a database
 * id rather than a storage key; otherwise the id is the key. Each segment is
 * percent-encoded, and a traversal segment is refused outright rather than
 * stripped — quietly rewriting the path could serve a different object than the
 * one Web 2 authorised.
 */
function resolveObjectPath(objectPath: unknown, assetId: string): string {
  const raw =
    typeof objectPath === "string" && objectPath.trim().length > 0
      ? objectPath.trim()
      : assetId;

  const rawSegments = raw.split("/");

  if (rawSegments.some((segment) => segment === "." || segment === "..")) {
    throw createAppError("ASSET_NOT_FOUND", "The asset key is not a valid storage path", 404);
  }

  const segments = rawSegments
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));

  if (segments.length === 0) {
    throw createAppError("ASSET_NOT_FOUND", "The asset key could not be resolved", 404);
  }

  return segments.join("/");
}

function buildSignedUrl(bucket: string, objectPath: string, token: string): string {
  const base = SUPABASE_PROJECT_URL.replace(/\/+$/, "");

  return `${base}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${objectPath}?token=${encodeURIComponent(token)}`;
}

function readToken(payload: Web2SignPayload): string {
  const token = typeof payload.token === "string" ? payload.token.trim() : "";

  if (token.length === 0) {
    throw createAppError("UPSTREAM_UNAVAILABLE", "Web 2 answered without a signing token", 503);
  }

  return token;
}

function readUpstreamTtlSeconds(payload: Web2SignPayload): number | null {
  const value = typeof payload.expiresInSeconds === "number" ? payload.expiresInSeconds : Number.NaN;

  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
}

function toAssetError(error: unknown): ApplicationError {
  if (isApplicationError(error)) {
    const mapped = UPSTREAM_FAILURES[error.code];

    return mapped === undefined
      ? error
      : createAppError(mapped.code, mapped.message, mapped.statusCode);
  }

  return toHttpError(error, { code: "ASSET_SIGN_FAILED", message: "Unable to sign the asset URL" });
}

/**
 * Exchanges a verified caller for a short-lived URL to one asset.
 *
 * `userId` travels to Web 2 so the grant is auditable on the side that owns the
 * file; it is never taken from the request body.
 */
export async function getSignedAssetUrl(
  assetId: string,
  userId: string,
): Promise<SignedUrlResponse> {
  const startedAt = Date.now();

  try {
    const requestedTtl = readSignedUrlTtlSeconds();

    const payload = await callInternalApi<Web2SignPayload>({
      path: `${WEB2_SIGN_PATH_PREFIX}/${encodeURIComponent(assetId)}/sign`,
      body: { userId, ttlSeconds: requestedTtl },
    });

    // Never claim a URL outlives what Web 2 actually minted: the shorter of the
    // two wins, because an over-stated expiry hands the browser a dead link.
    const upstreamTtl = readUpstreamTtlSeconds(payload);
    const ttlSeconds = Math.min(requestedTtl, upstreamTtl ?? requestedTtl);

    const response: SignedUrlResponse = {
      signedUrl: buildSignedUrl(
        readSignedAssetsBucket(),
        resolveObjectPath(payload.objectPath, assetId),
        readToken(payload),
      ),
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    logger.info("[ASSET_SIGNED]", {
      assetId,
      userId,
      latency_ms: Date.now() - startedAt,
      outcome: "success",
      ttl_seconds: ttlSeconds,
    });

    return response;
  } catch (error) {
    const failure = toAssetError(error);
    const detail = {
      assetId,
      userId,
      latency_ms: Date.now() - startedAt,
      outcome: "error",
      code: failure.code,
    };

    if ((failure.statusCode ?? 500) >= 500) {
      logger.error(`[${failure.code}] ${failure.message}`, detail);
    } else {
      logger.warn(`[${failure.code}] ${failure.message}`, detail);
    }

    throw failure;
  }
}
