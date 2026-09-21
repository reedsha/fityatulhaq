import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logger } from "./logger";

/**
 * Error contract shared by every layer: a machine-readable `code` plus the HTTP
 * `statusCode` the API should answer with.
 */
export interface ApplicationError extends Error {
  code?: string;
  statusCode?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

/** `{ success: false, error: { code, message } }` */
export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/** `{ success: true, data?, pagination? }` */
export interface SuccessEnvelope<T> {
  success: true;
  data?: T;
  pagination?: Pagination;
}

const MIN_STATUS_CODE = 400;
const MAX_STATUS_CODE = 599;

/** Human-readable text for anything that can be thrown. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/** Creates an `Error` carrying the API's error contract. */
export function createAppError(
  code: string,
  message: string,
  statusCode: number,
): ApplicationError {
  return Object.assign(new Error(message), { code, statusCode });
}

/** Narrows a thrown value to an error that already carries code + status. */
export function isApplicationError(
  error: unknown,
): error is ApplicationError & { code: string; statusCode: number } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { code?: unknown; statusCode?: unknown };

  return typeof candidate.code === "string" && typeof candidate.statusCode === "number";
}

/**
 * Normalises anything thrown by a service or controller into a value the global
 * error handler understands. Validation and application errors pass through
 * untouched; everything else is logged and wrapped as a generic 500.
 */
export function toHttpError(
  error: unknown,
  fallback: { code: string; message: string; statusCode?: number },
): Error {
  if (error instanceof ZodError || isApplicationError(error)) {
    return error;
  }

  logger.error(`[${fallback.code}] ${toErrorMessage(error)}`);

  return createAppError(fallback.code, fallback.message, fallback.statusCode ?? 500);
}

/** Wraps a successful payload in the standard response envelope. */
export function formatAuthResponse<T>(
  data?: T,
  pagination?: Pagination,
): SuccessEnvelope<T> {
  const envelope: SuccessEnvelope<T> = { success: true };

  if (data !== undefined) {
    envelope.data = data;
  }

  if (pagination !== undefined) {
    envelope.pagination = pagination;
  }

  return envelope;
}

/**
 * Terminal error middleware — must be mounted last so every failure ends up
 * with the same envelope shape.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    const message =
      error.issues.map((issue) => issue.message).join("; ") || "Validation failed";

    logger.warn(`[VALIDATION_ERROR] ${message}`);
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message },
    });
    return;
  }

  if (isApplicationError(error)) {
    const { code, message } = error;
    const statusCode =
      error.statusCode >= MIN_STATUS_CODE && error.statusCode <= MAX_STATUS_CODE
        ? error.statusCode
        : 500;
    const detail = message.length > 0 ? message : code;

    if (statusCode >= 500) {
      logger.error(`[${code}] ${detail}`);
    } else {
      logger.warn(`[${code}] ${detail}`);
    }

    res.status(statusCode).json({
      success: false,
      error: { code, message: detail },
    });
    return;
  }

  logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}