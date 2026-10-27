/** The DesignSpec paths a rule may test, with the values each allows (ADR-314). */

/** How a path's value is read: one enum value, a true/false flag, or a list of enum values. */
export type RulePathSpec =
  | { readonly kind: "enum"; readonly values: readonly string[] }
  | { readonly kind: "set"; readonly values: readonly string[] }
  | { readonly kind: "flag" };

/** Every testable path. A test cross-checks the enums against `designSpecSchema`, so a schema change fails loudly. */
export const RULE_PATHS: Readonly<Record<string, RulePathSpec>> = {
  category: { kind: "enum", values: ["dress", "skirt", "blouse"] },
  "bodice.fit": { kind: "enum", values: ["fitted", "semi-fitted", "loose"] },
  "bodice.shaping": { kind: "enum", values: ["darts", "princess-shoulder", "princess-armhole", "none"] },
  "neckline.front": { kind: "enum", values: ["round", "v", "square", "sweetheart", "boat", "high-round"] },
  "neckline.collar": { kind: "enum", values: ["none", "peter-pan", "shirt", "mandarin"] },
  "sleeve.type": { kind: "enum", values: ["none", "set-in", "cap", "puff", "bishop", "flutter"] },
  "sleeve.length": { kind: "enum", values: ["cap", "short", "elbow", "three-quarter", "long"] },
  "sleeve.cuff": { kind: "enum", values: ["none", "band", "elastic"] },
  "skirt.type": {
    kind: "enum",
    values: ["straight", "a-line", "circle-half", "circle-full", "gathered", "pleated", "tiered"],
  },
  "skirt.length": { kind: "enum", values: ["mini", "knee", "midi", "ankle", "floor"] },
  waistband: { kind: "enum", values: ["none", "straight", "contour", "elastic"] },
  "closure.type": { kind: "enum", values: ["zip", "buttons", "none"] },
  pockets: { kind: "set", values: ["side-seam", "patch"] },
  lining: { kind: "flag" },
  belt: { kind: "enum", values: ["none", "self-tie"] },
};
