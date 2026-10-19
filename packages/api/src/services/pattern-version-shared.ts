/** Shared by save and restore: run the engine on the inputs, append the version, report the event. */
import type { SavePatternVersionResult } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import { runPattern, type PatternInputs } from "../domain/run-pattern";
import type { Analytics } from "../ports/analytics";
import type { Clock } from "../ports/clock";
import type { PatternVersionRepository } from "../ports/pattern-version-repository";
import type { AuthContext } from "../ports/token-verifier";

/** Ports the append needs. */
export interface AppendDeps {
  readonly versions: PatternVersionRepository;
  readonly clock: Clock;
  readonly analytics: Analytics;
}

/** The save result plus the engine time the route reports in `Server-Timing`. */
export interface AppendOutcome {
  readonly result: SavePatternVersionResult;
  readonly engineMs: number;
}

/**
 * Runs the engine on the inputs and appends the version to the design.
 *
 * @param deps - Version repository, clock and analytics.
 * @param ctx - Verified caller.
 * @param target - Design id, category (for the event) and the measurement set the version is linked to.
 * @param inputs - Spec, measurements snapshot, labels and options.
 * @returns The stored version, its report and the engine time.
 * @throws {PatternInvalidError} When the engine report is `fail` (nothing is written).
 * @throws {NotFoundError} When the design is missing or not the caller's.
 */
export async function appendPatternVersion(
  deps: AppendDeps,
  ctx: AuthContext,
  target: { readonly designId: string; readonly measurementSetId: string | null },
  inputs: PatternInputs,
): Promise<AppendOutcome> {
  const run = runPattern(deps.clock, inputs);
  const appended = await deps.versions.appendVersion(ctx, {
    designId: target.designId,
    spec: inputs.spec,
    measurementSetId: target.measurementSetId,
    measurements: inputs.measurements,
    sizeLabel: inputs.sizeLabel,
    easeProfile: inputs.easeProfile,
    options: { ...inputs.options },
    engineVersion: run.engineVersion,
    validationStatus: run.status,
    inputHash: run.inputHash,
  });
  if (!appended) throw new NotFoundError("design");
  deps.analytics.capture(ctx.userId, "pattern_version_saved", {
    category: inputs.spec.category,
    validation_status: run.status,
    engine_ms: run.engineMs,
    reused: appended.reused,
  });
  return {
    result: { version: appended.version, report: run.result.validation, reused: appended.reused },
    engineMs: run.engineMs,
  };
}
