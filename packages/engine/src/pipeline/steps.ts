/** The seven pipeline steps, each a pure function over a frozen context. */
import type { ValidationCheck, ValidationReport } from "@tafsila/schemas";
import { finishing } from "../finishing";
import { layout } from "../layout";
import type { Step } from "./draft-context";
import { withCheck } from "./draft-context";
import type { ModuleRegistry } from "./registry";

export type { Step } from "./draft-context";
export { finishing, layout };

/**
 * Step 1: derive the named drafting inputs from measurements and ease. Filled by #126.
 *
 * @param ctx - Current context.
 * @returns The same context for now.
 */
export const resolve: Step = (ctx) => ctx;

/**
 * Step 2: draft the base blocks (bodice, skirt, sleeve). Filled by #128 and #129.
 *
 * @param ctx - Current context.
 * @returns The same context for now.
 */
export const blocks: Step = (ctx) => ctx;

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
