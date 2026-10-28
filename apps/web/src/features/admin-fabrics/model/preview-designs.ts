/** The fixture designs the preview offers: bundled constants, never an admin's own designs (ADR-320 item 2; ADR-32a item 4). */
import type { DesignSpec } from "@tafsila/schemas";
import {
  bishopSleeveBlouse,
  fullCircleKneeSkirt,
  linedSidePocketDress,
  seedDress,
  shirtCollarBlouse,
  straightKneeSkirt,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";

/** One choice of the preview picker. */
export interface PreviewDesign {
  /** Key, also the message key under `admin.fabricRules.preview.designs`. */
  readonly key: string;
  /** The design. */
  readonly spec: DesignSpec;
}

/** The designs, chosen to touch the main rule paths (skirt fullness, collar, sleeve, lining and pockets). */
export const PREVIEW_DESIGNS: readonly PreviewDesign[] = [
  { key: "halfCircleDress", spec: vNeckHalfCircleDress },
  { key: "fullCircleSkirt", spec: fullCircleKneeSkirt },
  { key: "straightSkirt", spec: straightKneeSkirt },
  { key: "shirtCollarBlouse", spec: shirtCollarBlouse },
  { key: "bishopSleeveBlouse", spec: bishopSleeveBlouse },
  { key: "linedPocketDress", spec: linedSidePocketDress },
  { key: "seedDress", spec: seedDress },
];

/** The first design, selected when the preview opens. */
export const DEFAULT_PREVIEW_DESIGN: PreviewDesign = PREVIEW_DESIGNS[0] as PreviewDesign;
