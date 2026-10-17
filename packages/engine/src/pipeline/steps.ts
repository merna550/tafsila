/** The seven pipeline steps, each a pure function over a frozen context. */
import type { ValidationCheck, ValidationReport } from "@tafsila/schemas";
import { BLOCK_DRAFTERS } from "../blocks";
import { finishing } from "../finishing";
import { resolveDraftInputs } from "../resolve/resolve-draft-inputs";
import { CATEGORY_BLOCKS } from "./category-rules";
import type { Step } from "./draft-context";
import { withCheck, withInputs } from "./draft-context";
import type { ModuleRegistry } from "./registry";

export type { Step } from "./draft-context";
export { finishing };

/**
 * Step 1: derive the block inputs (widths with ease, lengths) from measurements and ease (#126).
 *
 * @param ctx - Current context.
 * @returns The context with `inputs` set.
 * @throws {DraftingError} A `SKIRT_LENGTH_*` input code when the skirt length does not fit the body.
 */
export const resolve: Step = (ctx) =>
  withInputs(ctx, resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options));

/**
 * Step 2: draft the base blocks the category needs, in `CATEGORY_BLOCKS` order (bodice #128, skirt #129).
 *
 * @param ctx - Context after the resolve step.
 * @returns The context with the block pieces.
 */
export const blocks: Step = (ctx) =>
  CATEGORY_BLOCKS[ctx.spec.category].reduce((acc, name) => BLOCK_DRAFTERS[name](acc), ctx);

/**
 * Step 5: collision-free label placement. Filled by #131.
 *
 * @param ctx - Current context.
 * @returns The same context for now.
 */
export const layout: Step = (ctx) => ctx;

/**
 * Step 7: assembly steps. Filled by #146.
 *
 * @param ctx - Current context.
 * @returns The same context for now.
 */
export const sewingOrder: Step = (ctx) => ctx;

/**
 * Step 3: run every module that applies to the design, in registry order.
 *
 * @param registry - The module registry.
 * @returns A step that folds the modules over the context.
 */
export function modulesStep(registry: ModuleRegistry): Step {
  return (ctx) => registry.modulesFor(ctx.spec).reduce((acc, m) => m.draft(acc), ctx);
}

/**
 * Step 6: run the registered rules and add their checks to the context.
 *
 * @param registry - The module registry.
 * @returns A step that appends one check per rule.
 */
export function validateStep(registry: ModuleRegistry): Step {
  return (ctx) => registry.rulesFor(ctx).reduce((acc, rule) => withCheck(acc, rule.run(ctx)), ctx);
}

/**
 * The worst status among checks.
 *
 * @param checks - All checks.
 * @returns `fail`, else `warn`, else `pass`.
 */
function worstStatus(checks: readonly ValidationCheck[]): ValidationReport["status"] {
  if (checks.some((c) => c.status === "fail")) return "fail";
  return checks.some((c) => c.status === "warn") ? "warn" : "pass";
}

/**
 * The report for a list of checks: the status is the worst of them, `pass` when there are none.
 *
 * @param checks - All checks.
 * @returns The report.
 */
export function buildReport(checks: readonly ValidationCheck[]): ValidationReport {
  const status = worstStatus(checks);
  return { status, checks: [...checks] };
}
