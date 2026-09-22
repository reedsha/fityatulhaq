import { Prisma } from "../generated/prisma/client";
import {
  createAppError,
  isApplicationError,
  toErrorMessage,
  toHttpError,
} from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";

/**
 * Maps a failure raised inside a service onto the API's error contract.
 *
 * Shared by every service so the same database condition always produces the
 * same code regardless of which operation hit it: a unique-constraint race
 * becomes the conflict the pre-flight checks raise, an error that already
 * carries `code`/`statusCode` passes through untouched, and anything else is
 * logged and wrapped as the caller's generic fallback.
 */
export function toServiceError(error: unknown, code: string, message: string): Error {
  if (isApplicationError(error)) {
    return error;
  }

  // P2002 is the unique-constraint violation Prisma raises when two requests
  // pass the pre-flight check at the same time. Inspecting the constraint target
  // keeps the race indistinguishable from the sequential case.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = error.meta?.["target"];
    const fields: string[] = Array.isArray(target)
      ? target.map((field: unknown): string => String(field))
      : [];

    if (fields.includes("username")) {
      return createAppError("USERNAME_ALREADY_EXISTS", "This username is already taken", 409);
    }

    if (fields.includes("email")) {
      return createAppError(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists",
        409,
      );
    }

    return createAppError("DUPLICATE_RECORD", "A record with these details already exists", 409);
  }

  logger.error(`[${code}] ${toErrorMessage(error)}`);

  return toHttpError(error, { code, message });
}
