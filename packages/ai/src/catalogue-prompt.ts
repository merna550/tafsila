/**
 * The catalogue part of the system prompt (issue #337, decision 337, 3): the allowed values of every DesignSpec feature
 * with a short visual definition. Values come from `designSpecSchema` through the engine's `candidateValues`; only the
 * definitions are written here, and `catalogueDrift` fails when the two disagree.
 */
import { DESIGN_LENGTH_PATHS, type DesignFeaturePath } from "@tafsila/schemas";
import { candidateValues, FEATURE_PATHS, OVERRIDE_LIMITS_MM } from "@tafsila/engine/spec-rules";

/** Short English visual definitions, by feature then value (`"true"`/`"false"` for yes/no features). */
export type FeatureDefinitions = Readonly<Record<DesignFeaturePath, Readonly<Record<string, string>>>>;

/** What the model is told each value looks like. */
export const FEATURE_DEFINITIONS: FeatureDefinitions = {
  category: {
    dress: "one garment from shoulders to hem",
    skirt: "hangs from the waist, no top part",
    blouse: "top only, ends around the hip",
  },
  "bodice.shaping": {
    darts: "short stitched folds pointing at the bust",
    "princess-shoulder": "long vertical seams from mid-shoulder over the bust",
    "princess-armhole": "long curved seams from the armhole over the bust",
    none: "no darts or shaping seams",
  },
  "bodice.fit": {
    fitted: "close to the body, follows the waist",
    "semi-fitted": "follows the body with some room",
    loose: "hangs straight, no waist shaping",
  },
  "bodice.waistSeam": {
    true: "a seam joins top and skirt at the waist",
    false: "front and back run in one piece from shoulder to hem",
  },
  "skirt.type": {
    straight: "narrow, side seams fall straight down",
    "a-line": "widens gently from waist to hem like the letter A",
    "circle-half": "flares strongly, hem forms a half circle when laid flat",
    "circle-full": "very full flare, hem forms a full circle when laid flat",
    gathered: "fabric bunched into the waist in many small folds",
    pleated: "pressed folds around the waist",
    tiered: "horizontal layers, each wider than the one above",
  },
  "skirt.length": {
    mini: "well above the knee",
    knee: "at the knee",
    midi: "mid-calf",
    ankle: "at the ankle",
    floor: "touches the floor",
  },
  "skirt.slit": {
    none: "no slit",
    front: "opening at the centre front of the hem",
    back: "opening at the centre back of the hem",
    side: "opening in a side seam at the hem",
  },
  waistband: {
    none: "no band, the waist edge is faced",
    straight: "a straight band sewn on the waist",
    contour: "a curved shaped band that follows the hips",
    elastic: "a casing with elastic, gathered waist",
  },
  "neckline.front": {
    round: "round curve at the base of the neck",
    v: "front neckline forms a V point",
    square: "straight across with corners",
    sweetheart: "two curves meeting in a dip at centre front",
    boat: "wide and shallow, from shoulder to shoulder",
    "high-round": "round and close to the neck",
  },
  "neckline.back": {
    round: "round curve at the back neck",
    v: "back neckline forms a V point",
    square: "straight across the back with corners",
    "high-round": "round and close to the back neck",
  },
  "neckline.collar": {
    none: "no collar",
    "peter-pan": "flat collar with rounded ends lying on the shoulders",
    shirt: "folded collar with a stand and points, like a man's shirt",
    mandarin: "short upright band around the neck, no fold",
  },
  "sleeve.type": {
    none: "sleeveless",
    "set-in": "smooth sleeve sewn into a round armhole",
    cap: "very short sleeve that only covers the shoulder",
    puff: "gathered at the top so it stands up and puffs",
    bishop: "full sleeve gathered into the wrist",
    flutter: "loose ruffle-like sleeve that floats",
  },
  "sleeve.length": {
    cap: "just over the shoulder point",
    short: "upper arm, above the elbow",
    elbow: "at the elbow",
    "three-quarter": "between elbow and wrist",
    long: "to the wrist",
  },
  "sleeve.cuff": {
    none: "plain hem",
    band: "a separate band sewn at the sleeve end",
    elastic: "elastic gathers the sleeve end",
  },
  "closure.type": {
    zip: "a zip",
    buttons: "buttons and buttonholes",
    none: "pulls on, no opening",
  },
  "closure.position": {
    "center-back": "down the middle of the back",
    side: "in the left side seam",
    "center-front": "down the middle of the front",
  },
  pockets: {
    "side-seam": "hidden pocket opening in the side seam",
    patch: "pocket sewn on top of the front",
  },
  belt: {
    none: "no belt",
    "self-tie": "a fabric belt tied in a bow",
  },
  lining: {
    true: "a full inner layer of lining fabric",
    false: "no lining",
  },
};

/** The allowed values of each feature, as strings. */
export type FeatureValues = Readonly<Record<DesignFeaturePath, readonly string[]>>;

/**
 * The allowed values of each feature, read from the schema.
 *
 * @returns Values per feature, in schema order.
 */
export function schemaFeatureValues(): FeatureValues {
  return Object.fromEntries(
    FEATURE_PATHS.map((path) => [path, candidateValues(path).map((value) => String(value))]),
  ) as Record<DesignFeaturePath, string[]>;
}

/**
 * Compares definitions with the schema's values.
 *
 * @param definitions - The definitions.
 * @param values - The schema's values.
 * @returns `path=value` entries without a definition, then definitions without a value; empty when in sync.
 */
export function catalogueDrift(definitions: FeatureDefinitions, values: FeatureValues): string[] {
  const missing = FEATURE_PATHS.flatMap((path) =>
    values[path]
      .filter((value) => definitions[path][value] === undefined)
      .map((value) => `missing ${path}=${value}`),
  );
  const extra = FEATURE_PATHS.flatMap((path) =>
    Object.keys(definitions[path])
      .filter((value) => !values[path].includes(value))
      .map((value) => `unknown ${path}=${value}`),
  );
  return [...missing, ...extra];
}

/**
 * Writes the catalogue section of the system prompt.
 *
 * @param definitions - The definitions (defaults to `FEATURE_DEFINITIONS`).
 * @param values - The allowed values (defaults to the schema's).
 * @returns Markdown-like text: one line per feature value, then the length limits.
 * @throws {Error} When definitions and schema drift apart.
 */
export function buildCataloguePrompt(
  definitions: FeatureDefinitions = FEATURE_DEFINITIONS,
  values: FeatureValues = schemaFeatureValues(),
): string {
  const drift = catalogueDrift(definitions, values);
  if (drift.length > 0)
    throw new Error(`Feature catalogue out of sync with designSpecSchema: ${drift.join(", ")}`);
  const features = FEATURE_PATHS.map((path) => {
    const lines = values[path].map((value) => `  - ${value}: ${definitions[path][value]}`);
    return [`${path}:`, ...lines].join("\n");
  });
  const lengths = DESIGN_LENGTH_PATHS.map((path) => {
    const { minMm, maxMm } = OVERRIDE_LIMITS_MM[path];
    return `  - ${path}: ${minMm} to ${maxMm} mm`;
  });
  return `Allowed feature values:\n${features.join("\n")}\nOptional lengths (millimetres):\n${lengths.join("\n")}`;
}
