/** Query keys of the clients feature (decision 30-5). Mutations invalidate `clientKeys.all`, which covers every list and every client. */

/** Prefix of everything about clients. */
const ALL = ["clients"] as const;

/**
 * Key of one list.
 *
 * @param q - Name search.
 * @param limit - Page size.
 * @returns The query key.
 */
function list(q: string, limit: number): readonly ["clients", { q: string; limit: number }] {
  return ["clients", { q, limit }] as const;
}

/**
 * Key of one client.
 *
 * @param id - Client id.
 * @returns The query key.
 */
function detail(id: string): readonly ["clients", string] {
  return ["clients", id] as const;
}

/**
 * Key of the measurement sets of one client.
 *
 * @param clientId - Client id.
 * @returns The query key.
 */
function sets(clientId: string): readonly ["measurement-sets", { clientId: string }] {
  return ["measurement-sets", { clientId }] as const;
}

/** All query keys of the feature. */
export const clientKeys = { all: ALL, list, detail, sets };
