import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../services/jwtService";
import type { UserPayload } from "../types";
import { createAppError } from "./errorFormatter";
import { logger } from "./logger";

const BEARER_PREFIX = "Bearer ";

/**
 * Verifies the `Authorization: Bearer <token>` header and exposes the caller on
 * `req.user`. Every failure funnels into the global error handler as a 401.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    logger.warn(`[UNAUTHORIZED] Missing bearer token on ${req.method} ${req.originalUrl}`);
    next(createAppError("UNAUTHORIZED", "Authentication required", 401));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  if (token.length === 0) {
    logger.warn(`[UNAUTHORIZED] Empty bearer token on ${req.method} ${req.originalUrl}`);
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

  const user: UserPayload = { id: payload.sub, role: payload.role };
  req.user = user;

  next();
}