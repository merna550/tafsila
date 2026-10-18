/** The registry `generatePattern` uses by default. Each garment module adds one line here. */
import { skirtBlockModule } from "../blocks/skirt/skirt-module";
import { setInSleeveModule } from "../blocks/sleeve/module";
import { dartFreeBodiceModule, princessArmholeModule, princessShoulderModule } from "../modules/bodice";
import { circleSkirtModule } from "../modules/circle-skirt/module";
import { necklineModule } from "../modules/neckline";
import { gatheredSkirtModule, pleatedSkirtModule, tieredSkirtModule } from "../modules/skirt";
import { skirtShapeModule } from "../modules/skirt/shape-module";
import { skirtSlitModule } from "../modules/skirt/slit-module";
import { CORE_RULES } from "../validation/core-rules";
import { createRegistry } from "./registry";

/** Every garment module, one line each (order comes from `FeatureModule.order`). */
export const defaultRegistry = createRegistry(
  [
    princessShoulderModule,
    princessArmholeModule,
    dartFreeBodiceModule,
    necklineModule,
    skirtBlockModule,
    circleSkirtModule,
    skirtShapeModule,
    skirtSlitModule,
    gatheredSkirtModule,
    pleatedSkirtModule,
    tieredSkirtModule,
    setInSleeveModule,
  ],
  CORE_RULES,
);
