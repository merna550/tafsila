/** Use case: read one version with a pattern regenerated from its stored inputs (never written back). */
import type { PatternVersionDetail } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import { engineChanged, regeneratePattern } from "../domain/run-pattern";
import type { Clock } from "../ports/clock";
import type { PatternVersionRepository } from "../ports/pattern-version-repository";
import type { AuthContext } from "../ports/token-verifier";

/** Ports this use case needs. */
export interface GetPatternVersionDeps {
  readonly versions: PatternVersionRepository;
  readonly clock: Clock;
}

/**
 * Reads a version and regenerates its pattern with today's engine.
 *
 * @param deps - Version repository and clock.
 * @param ctx - Verified caller.
 * @param id - Version id.
 * @returns The stored version, the fresh pattern and whether the engine version changed.
 * @throws {NotFoundError} When the version is missing or not the caller's.
 */
export async function getPatternVersion(
  deps: GetPatternVersionDeps,
  ctx: AuthContext,
  id: string,
): Promise<PatternVersionDetail> {
  const version = await deps.versions.get(ctx, id);
  if (!version) throw new NotFoundError("version");
  const { result } = regeneratePattern(deps.clock, {
    spec: version.spec,
    measurements: version.measurements,
    sizeLabel: version.sizeLabel ?? "unknown",
    easeProfile: version.easeProfile,
    options: version.options,
  });
  return { version, pattern: result, engineChanged: engineChanged(version.engineVersion) };
}
