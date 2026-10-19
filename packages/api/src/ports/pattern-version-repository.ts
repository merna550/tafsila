/** Pattern version repository port: append-only versions of the signed-in user's designs. */
import type {
  EaseProfile,
  DesignSpec,
  ListPatternVersionsQuery,
  Measurements,
  Page,
  PatternVersion,
  PatternVersionListItem,
} from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** A version to append: the service has already run the engine, so status, hash and engine version are known. */
export interface NewPatternVersion {
  readonly designId: string;
  readonly spec: DesignSpec;
  readonly measurementSetId: string | null;
  readonly measurements: Measurements;
  readonly sizeLabel: string;
  readonly easeProfile: EaseProfile;
  readonly options: Record<string, unknown>;
  readonly engineVersion: string;
  readonly validationStatus: "pass" | "warn";
  readonly inputHash: string;
}

/** The stored version and whether it already existed as the design's current version. */
export interface AppendedVersion {
  readonly version: PatternVersion;
  /** True when the current version had the same `inputHash`, so nothing was written. */
  readonly reused: boolean;
}

/** Stores and reads versions. Another user's design or version behaves as if it did not exist. */
export interface PatternVersionRepository {
  /**
   * Appends a version in one transaction: locks the design, returns the current version when its hash is equal,
   * otherwise inserts `version_no = max + 1` and sets the design's `current_version_id` and `updated_at`.
   *
   * @param ctx - Verified caller.
   * @param input - The version to store.
   * @returns The version, or undefined when the design is missing or not the caller's.
   */
  appendVersion(ctx: AuthContext, input: NewPatternVersion): Promise<AppendedVersion | undefined>;
  /**
   * Lists a design's versions, newest `version_no` first.
   *
   * @param ctx - Verified caller.
   * @param designId - Design id.
   * @param query - Paging.
   * @returns One page, or undefined when the design is missing or not the caller's.
   */
  list(
    ctx: AuthContext,
    designId: string,
    query: ListPatternVersionsQuery,
  ): Promise<Page<PatternVersionListItem> | undefined>;
  /**
   * Reads one version with its stored inputs.
   *
   * @param ctx - Verified caller.
   * @param id - Version id.
   * @returns The version, or undefined when missing or not the caller's.
   */
  get(ctx: AuthContext, id: string): Promise<PatternVersion | undefined>;
}
