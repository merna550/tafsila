/** Fabric explanation repository port: the cached AI text per version, language and catalogue state, owner only (issue #346). */
import type { FabricExplanation } from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** An explanation to store; the service has already checked it. */
export interface NewFabricExplanation extends FabricExplanation {
  readonly versionId: string;
  /** Hash of the recommended and avoided fabrics and reasons it was written for. */
  readonly catalogueHash: string;
}

/** Stores and reads explanations. Another user's version behaves as if it did not exist. */
export interface FabricExplanationRepository {
  /**
   * Reads the explanation written for exactly this version, language and catalogue state.
   *
   * @param ctx - Verified caller.
   * @param versionId - Version id.
   * @param locale - Language.
   * @param catalogueHash - Hash of the recommendation it must match.
   * @returns The explanation, or undefined when none is cached.
   */
  find(
    ctx: AuthContext,
    versionId: string,
    locale: FabricExplanation["locale"],
    catalogueHash: string,
  ): Promise<FabricExplanation | undefined>;
  /**
   * Stores an explanation; a second save for the same keys keeps the first.
   *
   * @param ctx - Verified caller.
   * @param input - The explanation.
   * @returns False when the version is missing or not the caller's.
   */
  save(ctx: AuthContext, input: NewFabricExplanation): Promise<boolean>;
}
