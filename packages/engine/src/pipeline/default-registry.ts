/** The registry `generatePattern` uses by default. Each garment module adds one line here. */
import { skirtBlockModule } from "../blocks/skirt/skirt-module";
import { createRegistry } from "./registry";

/** Every garment module, one line each (order comes from `FeatureModule.order`). */
export const defaultRegistry = createRegistry([skirtBlockModule]);
