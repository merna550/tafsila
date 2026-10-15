/** The module registry: a fixed run order no matter how modules were registered. */
import type { DesignSpec } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import { compareText } from "./input-hash";
import type { DraftContext } from "./draft-context";
import type { FeatureModule, ValidationRule } from "./feature-module";

/** A sorted, read-only set of feature modules. */
export interface ModuleRegistry {
  /** All modules in run order. */
  readonly modules: readonly FeatureModule[];
  /** Modules that apply to the design, in run order. */
  modulesFor(spec: DesignSpec): readonly FeatureModule[];
  /** Rules of the applying modules whose own check says they apply, in run order. */
  rulesFor(ctx: DraftContext): readonly ValidationRule[];
}

/**
 * Orders modules by `order`, then `id`.
 *
 * @param a - First module.
 * @param b - Second module.
 * @returns Sort result.
 */
function byOrderThenId(a: FeatureModule, b: FeatureModule): number {
  return a.order - b.order || compareText(a.id, b.id);
}

/**
 * Builds a registry from modules given in any order.
 *
 * @param modules - The feature modules.
 * @returns The registry.
 * @throws {DraftingError} PIPELINE_DUPLICATE_MODULE when two modules share an id.
 */
export function createRegistry(modules: readonly FeatureModule[]): ModuleRegistry {
  const ids = new Set<string>();
  for (const m of modules) {
    if (ids.has(m.id))
      throw new DraftingError("PIPELINE_DUPLICATE_MODULE", `Two modules share the id "${m.id}"`);
    ids.add(m.id);
  }
  const sorted = Object.freeze([...modules].sort(byOrderThenId));
  return Object.freeze({
    modules: sorted,
    modulesFor: (spec: DesignSpec) => sorted.filter((m) => m.appliesTo(spec)),
    rulesFor: (ctx: DraftContext) =>
      sorted
        .filter((m) => m.appliesTo(ctx.spec))
        .flatMap((m) => (m.validations ?? []).filter((r) => r.appliesTo(ctx))),
  });
}
