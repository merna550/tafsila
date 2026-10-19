/** Use case: save a pattern version. The server re-runs the engine on the posted inputs and stores the result (decision 236). */
import type { SavePatternVersionInput } from "@tafsila/schemas";
import { AppError, NotFoundError } from "../domain/errors";
import type { ClientRepository } from "../ports/client-repository";
import type { DesignRepository } from "../ports/design-repository";
import type { MeasurementSetRepository } from "../ports/measurement-set-repository";
import type { AuthContext } from "../ports/token-verifier";
import { appendPatternVersion, type AppendDeps, type AppendOutcome } from "./pattern-version-shared";

/** Ports this use case needs. */
export interface SavePatternVersionDeps extends AppendDeps {
  readonly designs: DesignRepository;
  readonly measurementSets: MeasurementSetRepository;
  readonly clients: ClientRepository;
}

/**
 * Saves a version of a design for a measurement set.
 *
 * @param deps - Repositories, clock and analytics.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param input - Validated spec, set id, ease and options.
 * @returns The saved (or reused) version, its report and the engine time.
 * @throws {NotFoundError} When the design or the measurement set is missing or not the caller's.
 * @throws {AppError} `VALIDATION_FAILED` when the spec category differs from the design's.
 * @throws {PatternInvalidError} When the engine refuses the design with these measurements.
 */
export async function savePatternVersion(
  deps: SavePatternVersionDeps,
  ctx: AuthContext,
  designId: string,
  input: SavePatternVersionInput,
): Promise<AppendOutcome> {
  const detail = await deps.designs.get(ctx, designId);
  if (!detail) throw new NotFoundError("design");
  if (input.spec.category !== detail.design.category) {
    throw new AppError("VALIDATION_FAILED", {
      details: {
        fields: { "spec.category": `Must be ${detail.design.category}, the category of the design` },
      },
    });
  }
  const set = await deps.measurementSets.get(ctx, input.measurementSetId);
  if (!set) throw new NotFoundError("measurement set");
  const client = set.clientId ? await deps.clients.get(ctx, set.clientId) : undefined;
  return appendPatternVersion(
    deps,
    ctx,
    { designId, measurementSetId: set.id },
    {
      spec: input.spec,
      measurements: set.measurements,
      sizeLabel: set.sizeLabel ?? set.label,
      easeProfile: input.easeProfile,
      options: { ...input.options, ...(client ? { clientLabel: client.name } : {}) },
    },
  );
}
