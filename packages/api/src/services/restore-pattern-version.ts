/** Use case: restore a version. History is append-only, so an older version comes back as a new version n+1. */
import { NotFoundError } from "../domain/errors";
import type { AuthContext } from "../ports/token-verifier";
import { appendPatternVersion, type AppendDeps, type AppendOutcome } from "./pattern-version-shared";

/**
 * Appends a copy of an old version's stored inputs (its measurements snapshot, not the live set), re-run with today's engine.
 * Restoring the current version returns it unchanged.
 *
 * @param deps - Version repository, clock and analytics.
 * @param ctx - Verified caller.
 * @param id - Version id to restore.
 * @returns The new (or reused) version, its report and the engine time.
 * @throws {NotFoundError} When the version is missing or not the caller's.
 * @throws {PatternInvalidError} When today's engine refuses the stored inputs.
 */
export async function restorePatternVersion(
  deps: AppendDeps,
  ctx: AuthContext,
  id: string,
): Promise<AppendOutcome> {
  const version = await deps.versions.get(ctx, id);
  if (!version) throw new NotFoundError("version");
  return appendPatternVersion(
    deps,
    ctx,
    { designId: version.designId, measurementSetId: version.measurementSetId },
    {
      spec: version.spec,
      measurements: version.measurements,
      sizeLabel: version.sizeLabel ?? "unknown",
      easeProfile: version.easeProfile,
      options: version.options,
    },
  );
}
