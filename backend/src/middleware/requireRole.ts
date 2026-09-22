import type { NextFunction, Request, Response } from "express";

import { ROLES, type Role } from "../types";
import { createAppError } from "./errorFormatter";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Public exports — ergonomic per-route guards
// ---------------------------------------------------------------------------

/**
 * Returns an Express middleware factory that enforces authentication AND
 * verifies the caller holds one of the required roles.
 *
 * Usage:
 *   router.get("/mod-only", requireRole(ROLES.CONTENT_MODERATOR), handler);
 *   router.post("/member-plus", ...requireRole(ROLES.MEMBER, ROLES.CONTENT_MODERATOR), handler);
 *
 * `requireRole()` (no args) returns just authenticate (single fn).
 * With args → returns tuple `[authFn, roleGuardFn]` for rest-spread composition.
 */
export function requireRole(
  ...roles: Role[]
): [(req: Request, res: Response, next: NextFunction) => void] | [(req: Request, res: Response, next: NextFunction) => void, ReturnType<typeof roleGuard>] {
  // Validate arguments at registration time, not per-request.
  if (roles.length === 0) {
    return [makeAuthenticate()];
  }

  const validSet = new Set<Role>(roles);
  for (const r of roles) {
    if (!Object.values(ROLES).includes(r)) {
      throw new Error(`requireRole: "${r}" is not a valid role. Known: ${Object.values(ROLES).join(", ")}`);
    }
  }

  return [makeAuthenticate(), roleGuard(validSet)];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Authenticated-middleware builder. Extracts JWT → populates req.user. */
function makeAuthenticate(): (req: Request, _res: Response, next: NextFunction) => void {
  const BEARER_PREFIX = "Bearer ";

  return (req, _res, next) => {
    const token = extractAccessToken(req);

    if (token === null) {
      logger.debug(`[UNAUTHORIZED] No access token on ${req.method} ${req.originalUrl}`);
      next(createAppError("UNAUTHORIZED", "Authentication required", 401));
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

    req.user = { id: payload.sub, role: payload.role };
    next();
  };
}

/**
 * Role-gate middleware — verifies req.user.role belongs to the allowed set.
 * Must be piped after authenticate so req.user.role is populated.
 */
function roleGuard(validSet: Set<Role>): ReturnType<typeof roleGuardFactory> {
  return roleGuardFactory(validSet);
}

function roleGuardFactory(validSet: Set<Role>) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const userRole = _req.user?.role;

    // If authenticate didn't run (or failed silently), treat as unauthenticated.
    if (userRole === undefined || !isKnownRole(userRole) || !validSet.has(userRole)) {
      logger.info(
        `[FORBIDDEN_ROLE] User "${_req.user?.id ?? "??"}" (role=${userRole}) attempted "${_req.method} ${_req.originalUrl}" — requires [${Array.from(validSet).join(", ")}]`,
      );
      next(createAppError("FORBIDDEN", "Insufficient permissions for this action", 403));
      return;
    }

    next();
  };
}

/** Check if a string value matches one of the known role literals (type guard helper). */
function isKnownRole(v: string): v is Role {
  return Object.values(ROLES).includes(v as Role);
}

// --- Inline helpers mirroring authenticate.ts ---

function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (header !== undefined && typeof header === "string" && header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
  }

  return readAccessTokenCookie(req);
}

import { verifyAccessToken } from "../services/jwtService";
import { readAccessTokenCookie } from "../utils/authCookies";
