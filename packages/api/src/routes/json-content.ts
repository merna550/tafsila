/** Small helper shared by route files: wraps a Zod schema as an OpenAPI JSON content block. */
import type { z } from "@hono/zod-openapi";

/**
 * Wraps a schema as `application/json` content.
 *
 * @param schema - Request or response schema.
 * @returns The OpenAPI content object.
 */
export function jsonContent<T extends z.ZodType>(
  schema: T,
): { content: { "application/json": { schema: T } } } {
  return { content: { "application/json": { schema } } };
}
