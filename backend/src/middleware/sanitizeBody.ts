import type { NextFunction, Request, RequestHandler, Response } from "express";
import xss from "xss";

/**
 * Recursively neutralises HTML/script payloads inside JSON bodies.
 *
 * Strings are filtered through `xss`, arrays and plain objects are walked
 * element-by-element, and every other primitive (number, boolean, null,
 * undefined) is passed through untouched.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return xss(value);
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown): unknown => sanitizeValue(item));
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const key of Object.keys(source)) {
      sanitized[key] = sanitizeValue(source[key]);
    }

    return sanitized;
  }

  return value;
}

/**
 * Builds the sanitising middleware. Exposed as a factory so tests can compose
 * their own stack, while `sanitizeBody` remains the ready-to-mount instance.
 */
export function createSanitizeBody(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body !== null && req.body !== undefined) {
      req.body = sanitizeValue(req.body);
    }

    next();
  };
}

export const sanitizeBody: RequestHandler = createSanitizeBody();