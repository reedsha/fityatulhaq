import type { CookieOptions, Request, Response } from "express";

import { AUTH_ROUTE_PREFIX } from "../config/routePrefix";
import { createAppError } from "../middleware/errorFormatter";
import {
  ACCESS_TOKEN_EXPIRY_SECONDS,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from "../services/jwtService";

/**
 * httpOnly cookie plumbing for the browser session.
 *
 * The two tokens are stored in two cookies, mirroring their two lifetimes:
 *
 * - `accessToken`  — short-lived (`JWT_ACCESS_TOKEN_EXPIRY`, 15m by default) and
 *                    readable by the `authenticate` middleware, so every API
 *                    call is authorised without any JavaScript touching it.
 * - `refreshToken` — long-lived (`JWT_REFRESH_TOKEN_EXPIRY`, 7d by default) and
 *                    scoped to the auth router, so the credential that can mint
 *                    new sessions never travels with ordinary traffic.
 *
 * Both are `httpOnly`, which is the point of the migration: script running on
 * the page can no longer read a token, so an XSS bug cannot exfiltrate a
 * session. The trade-off is that cookie authentication is sent automatically,
 * which is why `SameSite` is set to `lax` (see `resolveSameSite` below) — `lax`
 * withholds the cookie from cross-site POSTs, which closes the CSRF hole that
 * cookie storage would otherwise open.
 */

export const ACCESS_COOKIE_NAME = "accessToken";
export const REFRESH_COOKIE_NAME = "refreshToken";

/** The access cookie rides along with every API call. */
const ACCESS_COOKIE_PATH = "/";

/** The refresh cookie only ever reaches the endpoints that need it. */
const REFRESH_COOKIE_PATH = AUTH_ROUTE_PREFIX;

const ALLOWED_SAME_SITE = ["lax", "strict", "none"] as const;

type SameSiteValue = (typeof ALLOWED_SAME_SITE)[number];

const DEFAULT_SAME_SITE: SameSiteValue = "lax";

const MILLISECONDS_PER_SECOND = 1000;

/** Reads a cookie from the jar `cookie-parser` populated, without leaking `any`. */
function readCookie(req: Request, name: string): string | null {
  const jar: Record<string, unknown> = req.cookies;
  const value = jar[name];

  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * `lax` is the default and the right answer for a same-site deployment: the API
 * and the web app share a registrable domain (`localhost` in development,
 * `fityatulhaq.org` in production), so the cookie still travels. Deployments
 * that split the two across sites need `none`, which browsers only honour
 * together with `Secure`.
 */
function resolveSameSite(): SameSiteValue {
  const configured = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();

  if (configured === undefined || configured === "") {
    return DEFAULT_SAME_SITE;
  }

  const match = ALLOWED_SAME_SITE.find((value) => value === configured);

  if (match === undefined) {
    throw createAppError(
      "INVALID_ENV_VAR",
      `COOKIE_SAME_SITE must be one of ${ALLOWED_SAME_SITE.join(", ")}`,
      500,
    );
  }

  return match;
}

/**
 * Resolved once at boot so a typo fails the start-up instead of the first login.
 */
const SAME_SITE = resolveSameSite();

/**
 * `Secure` is mandatory whenever the cookie may travel cross-site, and browsers
 * silently drop `SameSite=None` without it. Development runs over plain HTTP on
 * localhost, so the flag is relaxed there and only there.
 */
const COOKIE_SECURE = process.env.NODE_ENV === "production" || SAME_SITE === "none";

/**
 * Set only when the API and the web app sit on sibling subdomains (for example
 * `api.fityatulhaq.org` and the apex site): a host-only cookie would be
 * invisible to the other subdomain. Left unset, the cookie is host-only, which
 * is the tighter default.
 */
function resolveCookieDomain(): string | undefined {
  const domain = process.env.COOKIE_DOMAIN?.trim();

  return domain === undefined || domain === "" ? undefined : domain;
}

function cookieOptions(maxAgeSeconds: number, path: string): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    sameSite: SAME_SITE,
    secure: COOKIE_SECURE,
    path,
    maxAge: maxAgeSeconds * MILLISECONDS_PER_SECOND,
  };

  const domain = resolveCookieDomain();

  if (domain !== undefined) {
    options.domain = domain;
  }

  return options;
}

/** Issues both session cookies. Called by register, login and refresh. */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie(
    ACCESS_COOKIE_NAME,
    tokens.accessToken,
    cookieOptions(ACCESS_TOKEN_EXPIRY_SECONDS, ACCESS_COOKIE_PATH),
  );

  res.cookie(
    REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    cookieOptions(REFRESH_TOKEN_EXPIRY_SECONDS, REFRESH_COOKIE_PATH),
  );
}

/**
 * Expires both cookies. The path and domain have to match what `setAuthCookies`
 * used, otherwise the browser keeps the original cookie.
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions(0, ACCESS_COOKIE_PATH));
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions(0, REFRESH_COOKIE_PATH));
}

/** The access cookie, or null when absent/empty. */
export function readAccessTokenCookie(req: Request): string | null {
  return readCookie(req, ACCESS_COOKIE_NAME);
}

/** The refresh cookie, or null when absent/empty. */
export function readRefreshTokenCookie(req: Request): string | null {
  return readCookie(req, REFRESH_COOKIE_NAME);
}
