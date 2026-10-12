/** Shared paging contract for list endpoints: `limit` + `offset` in, `{ items, total, limit, offset }` out (decision 29). */
import { z } from "zod";

/** Default and largest page size. */
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

/** Query string fields every list endpoint accepts (strings from the URL are coerced to numbers). */
export const pageQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .default(DEFAULT_PAGE_LIMIT)
    .meta({ example: DEFAULT_PAGE_LIMIT, description: "Page size, 1 to 100" }),
  offset: z.coerce.number().int().min(0).default(0).meta({ example: 0, description: "Rows to skip" }),
});

/** Parsed paging query. */
export type PageQuery = z.infer<typeof pageQuerySchema>;

/**
 * Builds the response schema of a page of items.
 *
 * @param item - Schema of one item.
 * @returns A schema of `{ items, total, limit, offset }`.
 */
export function pageOf<T extends z.ZodType>(
  item: T,
): z.ZodObject<{ items: z.ZodArray<T>; total: z.ZodNumber; limit: z.ZodNumber; offset: z.ZodNumber }> {
  return z.object({
    items: z.array(item),
    total: z.number().int().min(0).meta({ example: 25, description: "Rows matching, before paging" }),
    limit: z.number().int().meta({ example: DEFAULT_PAGE_LIMIT }),
    offset: z.number().int().meta({ example: 0 }),
  });
}

/** One page of results, as the services and repositories return it. */
export interface Page<T> {
  /** Rows of this page. */
  readonly items: T[];
  /** Rows matching before paging. */
  readonly total: number;
  /** Page size used. */
  readonly limit: number;
  /** Rows skipped. */
  readonly offset: number;
}
