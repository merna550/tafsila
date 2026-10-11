/** In-memory tables shared by the memory repositories, so deleting a client can cascade to its sets like the database does. */
import type { Client, MeasurementSet } from "@tafsila/schemas";

/** A client row plus its owner. */
export interface ClientRow extends Client {
  readonly ownerId: string;
}

/** A measurement set row (without warnings) plus its owner. */
export interface SetRow extends Omit<MeasurementSet, "warnings"> {
  readonly ownerId: string;
}

/** The fake database. */
export interface MemoryStore {
  /** Client rows in insertion order. */
  clients: ClientRow[];
  /** Measurement set rows in insertion order. */
  sets: SetRow[];
}

/** Optional sources of time and ids, so tests can be deterministic. */
export interface MemoryOptions {
  /** Current time (defaults to the real clock). */
  readonly now?: () => Date;
  /** New row id (defaults to a random UUID). */
  readonly newId?: () => string;
}

/**
 * Creates an empty fake database.
 *
 * @returns The store to pass to both memory repositories.
 */
export function createMemoryStore(): MemoryStore {
  return { clients: [], sets: [] };
}

/**
 * Orders rows newest first with the id as tie-break, like `order by created_at desc, id desc`.
 *
 * @param rows - Rows to order.
 * @returns A new ordered array.
 */
export function newestFirst<T extends { createdAt: string; id: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) =>
    a.createdAt === b.createdAt ? b.id.localeCompare(a.id) : b.createdAt.localeCompare(a.createdAt),
  );
}
