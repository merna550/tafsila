/** Types shared by the option drawings of the design picker (issue #241). */
import type { DesignSpec } from "@tafsila/schemas";

/** One drawing: a list of SVG path strings in the shared `0 0 64 64` viewBox. */
export type Drawing = readonly string[];

/** The value each illustrated catalogue path can take, taken from the DesignSpec schema. */
export interface IllustrationValues {
  readonly category: DesignSpec["category"];
  readonly "bodice.shaping": NonNullable<DesignSpec["bodice"]>["shaping"];
  readonly "neckline.front": NonNullable<DesignSpec["neckline"]>["front"];
  readonly "neckline.back": NonNullable<DesignSpec["neckline"]>["back"];
  readonly "neckline.collar": NonNullable<DesignSpec["neckline"]>["collar"];
  readonly "sleeve.type": NonNullable<DesignSpec["sleeve"]>["type"];
  readonly "sleeve.length": NonNullable<DesignSpec["sleeve"]>["length"];
  readonly "sleeve.cuff": NonNullable<DesignSpec["sleeve"]>["cuff"];
  readonly "skirt.type": NonNullable<DesignSpec["skirt"]>["type"];
  readonly "skirt.length": NonNullable<DesignSpec["skirt"]>["length"];
  readonly waistband: NonNullable<DesignSpec["waistband"]>;
  readonly "closure.type": DesignSpec["closure"]["type"];
  readonly pockets: DesignSpec["pockets"][number];
  readonly belt: NonNullable<DesignSpec["belt"]>;
  readonly lining: "true" | "false";
}

/** A catalogue path that has option drawings. */
export type IllustratedPath = keyof IllustrationValues;

/** The values of one illustrated path. */
export type IllustrationValue<P extends IllustratedPath> = IllustrationValues[P];
