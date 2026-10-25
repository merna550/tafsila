/** Query keys of designs, shared by the design picker and the designs list (decision 30-5). */

/** Prefix of everything about designs. */
const ALL = ["designs"] as const;

/**
 * Key of one list.
 *
 * @param params - Search text and page size (any plain object).
 * @returns The query key.
 */
function list(
  params: Readonly<Record<string, unknown>>,
): readonly ["designs", Readonly<Record<string, unknown>>] {
  return ["designs", params] as const;
}

/**
 * Key of one design.
 *
 * @param id - Design id.
 * @returns The query key.
 */
function detail(id: string): readonly ["designs", string] {
  return ["designs", id] as const;
}

/** All query keys for designs. Mutations invalidate `designKeys.all`. */
export const designKeys = { all: ALL, list, detail };
