/** The belt feature module (issue #145, decision 145, 4): a self-tie belt for any category. */
import type { FeatureModule } from "../../pipeline/feature-module";
import { draftBelt } from "./belt";
import { beltLengthRule } from "./rules";

/** Right after the pockets (45). */
export const BELT_ORDER = 46;

/** The self-tie belt. */
export const beltModule: FeatureModule = {
  id: "belt",
  order: BELT_ORDER,
  appliesTo: (spec) => spec.belt === "self-tie",
  draft: draftBelt,
  validations: [beltLengthRule],
};
