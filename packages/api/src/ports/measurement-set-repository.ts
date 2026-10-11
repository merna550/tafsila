/** Measurement set repository port: stores the signed-in user's saved measurements. Warnings are not stored (decision 29). */
import type {
  ListMeasurementSetsQuery,
  MeasurementSet,
  Page,
  SaveMeasurementSetInput,
  UpdateMeasurementSetInput,
} from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** A set as stored: everything except the warnings, which are computed on every read. */
export type StoredMeasurementSet = Omit<MeasurementSet, "warnings">;

/** Stores and reads the caller's measurement sets. Another user's row behaves as if it did not exist. */
export interface MeasurementSetRepository {
  /**
   * Creates a set owned by the caller.
   *
   * @param ctx - Verified caller.
   * @param input - Validated set.
   * @returns The stored set.
   * @throws {NotFoundError} When `clientId` is not one of the caller's clients.
   */
  create(ctx: AuthContext, input: SaveMeasurementSetInput): Promise<StoredMeasurementSet>;
  /**
   * Lists the caller's sets, newest first.
   *
   * @param ctx - Verified caller.
   * @param query - Optional client filter and paging.
   * @returns One page with the total.
   */
  list(ctx: AuthContext, query: ListMeasurementSetsQuery): Promise<Page<StoredMeasurementSet>>;
  /**
   * Reads one set.
   *
   * @param ctx - Verified caller.
   * @param id - Set id.
   * @returns The set, or undefined when missing or not the caller's.
   */
  get(ctx: AuthContext, id: string): Promise<StoredMeasurementSet | undefined>;
  /**
   * Replaces label, size label and measurements.
   *
   * @param ctx - Verified caller.
   * @param id - Set id.
   * @param input - New values.
   * @returns The updated set, or undefined when missing or not the caller's.
   */
  update(
    ctx: AuthContext,
    id: string,
    input: UpdateMeasurementSetInput,
  ): Promise<StoredMeasurementSet | undefined>;
  /**
   * Deletes a set.
   *
   * @param ctx - Verified caller.
   * @param id - Set id.
   * @returns True when a row was deleted.
   */
  remove(ctx: AuthContext, id: string): Promise<boolean>;
}
