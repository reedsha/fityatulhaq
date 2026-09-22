import type { z } from "zod";

/**
 * Parses (and therefore validates) a request body.
 *
 * A failure throws the `ZodError` itself, which the global error handler turns
 * into a 400 `VALIDATION_ERROR` envelope. Every controller runs this before it
 * touches a service, so unvalidated data never reaches the business layer.
 */
export function parseBody<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  body: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw result.error;
  }

  return result.data as z.infer<TSchema>;
}
