/** The registry `generatePattern` uses by default. Each garment module adds one line here. */
import { skirtBlockModule } from "../blocks/skirt/skirt-module";
import { setInSleeveModule } from "../blocks/sleeve/module";
import { circleSkirtModule } from "../modules/circle-skirt/module";
import { skirtShapeModule } from "../modules/skirt/shape-module";
import { skirtSlitModule } from "../modules/skirt/slit-module";
import { CORE_RULES } from "../validation/core-rules";
import { createRegistry } from "./registry";

/** Every garment module, one line each (order comes from `FeatureModule.order`). */
export const defaultRegistry = createRegistry(
  [skirtBlockModule, circleSkirtModule, skirtShapeModule, skirtSlitModule, setInSleeveModule],
  CORE_RULES,
);
