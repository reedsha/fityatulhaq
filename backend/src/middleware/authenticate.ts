import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../services/jwtService";
import type { UserPayload } from "../types";
import { readAccessTokenCookie } from "../utils/authCookies";
import { createAppError } from "./errorFormatter";
import { logger } from "./logger";

const BEARER_PREFIX = "Bearer ";

function unauthorized(req: Request, reason: string): Error {
  // Logged at debug: since the session moved into a cookie, an anonymous visitor
  // hitting a protected route is an ordinary event rather than an incident.
  logger.debug(`[UNAUTHORIZED] ${reason} on ${req.method} ${req.originalUrl}`);

  return createAppError("UNAUTHORIZED", "Authentication required", 401);
}

/**
 * Extracts the caller's access token from the first source that carries one.
 *
 * A browser presents the httpOnly `accessToken` cookie, which is the primary
 * path now that tokens no longer live in `localStorage`. The bearer header stays
 * supported so server-to-server callers and the smoke tests keep working.
 */
function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (header !== undefined && header.startsWith(BEARER_PREFIX)) {
    const token = header.slice(BEARER_PREFIX.length).trim();

    return token.length > 0 ? token : null;
  }

  return readAccessTokenCookie(req);
}

/**
 * Resolves the caller onto `req.user`, from either the `accessToken` cookie or
 * an `Authorization: Bearer` header. Every failure funnels into the global error
 * handler as a 401.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);

  if (token === null) {
    next(unauthorized(req, "No access token cookie or bearer token"));
    return;
  }

  const payload = verifyAccessToken(token);

  if (
    payload === null ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    typeof payload.role !== "string"
  ) {
    next(createAppError("UNAUTHORIZED", "Invalid or expired access token", 401));
    return;
  }

  const user: UserPayload = { id: payload.sub, role: payload.role };
  req.user = user;

  next();
}
