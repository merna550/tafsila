/** Maps fabric properties and their 0 to 4 levels to message keys and meter fill (ADR-319 item 3). */
import { FABRIC_LEVEL, type FabricProperties, type FabricPropertyName } from "@tafsila/schemas";

/** Properties shown on a card, in screen order. Stretch is 0 for every woven fabric in v1, so it is left out. */
export const SHOWN_PROPERTIES = [
  "drape",
  "weight",
  "body",
  "sheen",
] as const satisfies readonly FabricPropertyName[];

/** Number of steps of the meter (levels 0 to 4 fill 1 to 5 steps). */
export const METER_STEPS = FABRIC_LEVEL.max + 1;

/** Message key (under `fabric.recommend.levels`) of each level. */
const LEVEL_KEYS = ["none", "low", "mid", "high", "max"] as const;

/** One property row of a card. */
export interface PropertyRow {
  /** Property name, also the message key under `fabric.recommend.properties`. */
  readonly name: (typeof SHOWN_PROPERTIES)[number];
  /** Message key under `fabric.recommend.levels` for the level word. */
  readonly levelKey: (typeof LEVEL_KEYS)[number];
  /** Filled steps of the meter, 1 to 5. */
  readonly filled: number;
}

/**
 * Builds the property rows of a card from a fabric's properties.
 *
 * @param properties - The five properties, each 0 to 4.
 * @returns One row per shown property.
 */
export function propertyRows(properties: FabricProperties): PropertyRow[] {
  return SHOWN_PROPERTIES.map((name) => {
    const level = properties[name];
    return { name, levelKey: LEVEL_KEYS[level] ?? LEVEL_KEYS[0], filled: level + 1 };
  });
}
