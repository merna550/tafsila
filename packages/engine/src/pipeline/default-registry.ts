/** The registry `generatePattern` uses by default. Each garment module adds one line here. */
import { skirtBlockModule } from "../blocks/skirt/skirt-module";
import { circleSkirtModule } from "../modules/circle-skirt/module";
import { CORE_RULES } from "../validation/core-rules";
import { createRegistry } from "./registry";

/** Every garment module, one line each (order comes from `FeatureModule.order`). */
export const defaultRegistry = createRegistry([skirtBlockModule, circleSkirtModule], CORE_RULES);
