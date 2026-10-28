/** Fabric calculation repository port: the last calculation per version and options, owner only. */
import type { FabricCalc, FabricCalcResult, FabricOptions } from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** A calculation to store; the service has already validated the result and hashed the options. */
export interface NewFabricCalc {
  readonly versionId: string;
  readonly options: FabricOptions;
  readonly optionsHash: string;
  readonly result: FabricCalcResult;
  readonly nestingVersion: string;
}

/** Stores and reads calculations. Another user's version behaves as if it did not exist. */
export interface FabricCalcRepository {
  /**
   * Stores the calculation, replacing the one with the same version and options hash.
   *
   * @param ctx - Verified caller.
   * @param input - The calculation.
   * @returns The stored calculation, or undefined when the version is missing or not the caller's.
   */
  save(ctx: AuthContext, input: NewFabricCalc): Promise<FabricCalc | undefined>;
  /**
   * Reads the most recently saved calculation of a version.
   *
   * @param ctx - Verified caller.
   * @param versionId - Version id.
   * @returns The calculation, or undefined when none is saved or the version is not the caller's.
   */
  latest(ctx: AuthContext, versionId: string): Promise<FabricCalc | undefined>;
}
