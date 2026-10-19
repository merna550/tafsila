/**
 * Test helper (issue #138): the drafting context of a bodice design after the blocks and the modules, without the
 * finishing and layout steps, so geometry rules can run on many bodies quickly.
 */
import type { DesignSpec, EaseProfile, Measurements, ValidationCheck } from "@tafsila/schemas";
import { createContext, type DraftContext } from "../pipeline/draft-context";
import { defaultRegistry } from "../pipeline/default-registry";
import { DEFAULT_ENGINE_OPTIONS } from "../pipeline/generate-pattern";
import { blocks, resolve } from "../pipeline/steps";
import { CORE_RULES } from "../validation/core-rules";

/**
 * Runs resolve and blocks for a design (the context a bodice shaping module starts from).
 *
 * @param spec - The design.
 * @param m - Measurements.
 * @returns The context after the blocks.
 */
export function blockContext(spec: DesignSpec, m: Measurements): DraftContext {
  return blocks(resolve(createContext(spec, m, DEFAULT_ENGINE_OPTIONS)));
}

/**
 * Runs resolve, blocks and the modules for a design, without garment assembly (#144): the bodice stays at waist length.
 *
 * @param spec - The design.
 * @param m - Measurements.
 * @param easeProfile - Ease profile; default `regular`.
 * @returns The context after the modules.
 */
export function shapedContext(
  spec: DesignSpec,
  m: Measurements,
  easeProfile: EaseProfile = "regular",
): DraftContext {
  const ctx = createContext(spec, m, { ...DEFAULT_ENGINE_OPTIONS, easeProfile });
  const drafted = blocks(resolve(ctx));
  return defaultRegistry
    .modulesFor(spec)
    .filter((m) => !m.id.startsWith(ASSEMBLY_ID_PREFIX))
    .reduce((acc, m) => m.draft(acc), drafted);
}

/** Id prefix of the garment assembly modules (#144), left out so shaping tests see the bodice at waist length. */
const ASSEMBLY_ID_PREFIX = "assembly-";

/**
 * Every check the core rules report for a context.
 *
 * @param ctx - A drafted context.
 * @returns The checks, in rule order.
 */
export function coreChecks(ctx: DraftContext): ValidationCheck[] {
  return CORE_RULES.filter((rule) => rule.appliesTo(ctx)).flatMap((rule) =>
    rule.runMany ? [...rule.runMany(ctx)] : [rule.run(ctx)],
  );
}
