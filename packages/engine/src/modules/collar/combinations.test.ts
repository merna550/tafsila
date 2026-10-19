/**
 * Table tests of the allowed collar combinations (issue #141, decision 141, 1): each refused design gives a `fail`
 * result with no pieces, the code and an Arabic and English message; each allowed pairing drafts.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { dartedBlouse, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { collarCombinationIssue } from "./combinations";

type Neckline = NonNullable<DesignSpec["neckline"]>;

/**
 * The seed blouse with a neckline and a closure.
 *
 * @param neckline - Neckline fields over a round/round neck.
 * @param closure - Closure, default CF buttons.
 * @returns The design.
 */
function design(
  neckline: Partial<Neckline>,
  closure: DesignSpec["closure"] = { type: "buttons", position: "center-front" },
): DesignSpec {
  return {
    ...dartedBlouse,
    neckline: { front: "round", back: "round", collar: "none", ...neckline },
    closure,
  };
}

const REFUSED: readonly [string, DesignSpec, string][] = [
  ["peter pan on a V front", design({ collar: "peter-pan", front: "v" }), "COLLAR_NECKLINE_UNSUPPORTED"],
  ["shirt on a square front", design({ collar: "shirt", front: "square" }), "COLLAR_NECKLINE_UNSUPPORTED"],
  ["mandarin on a boat front", design({ collar: "mandarin", front: "boat" }), "COLLAR_NECKLINE_UNSUPPORTED"],
  ["peter pan on a V back", design({ collar: "peter-pan", back: "v" }), "COLLAR_NECKLINE_UNSUPPORTED"],
  ["shirt with a front depth", design({ collar: "shirt", depthFrontMm: 120 }), "COLLAR_DEPTH_UNSUPPORTED"],
  [
    "shirt with a CB zip",
    design({ collar: "shirt" }, { type: "zip", position: "center-back" }),
    "COLLAR_CLOSURE_UNSUPPORTED",
  ],
  [
    "shirt with no closure",
    design({ collar: "shirt" }, { type: "none", position: "center-front" }),
    "COLLAR_CLOSURE_UNSUPPORTED",
  ],
  [
    "mandarin with a side zip",
    design({ collar: "mandarin" }, { type: "zip", position: "side" }),
    "COLLAR_CLOSURE_UNSUPPORTED",
  ],
  [
    "mandarin with no closure",
    design({ collar: "mandarin" }, { type: "none", position: "center-back" }),
    "COLLAR_CLOSURE_UNSUPPORTED",
  ],
];

const ALLOWED: readonly [string, DesignSpec][] = [
  [
    "peter pan, high-round, no closure",
    design(
      { collar: "peter-pan", front: "high-round", back: "high-round" },
      { type: "none", position: "center-back" },
    ),
  ],
  [
    "peter pan with a front depth",
    design({ collar: "peter-pan", depthFrontMm: 90 }, { type: "zip", position: "center-back" }),
  ],
  ["shirt with a CF zip", design({ collar: "shirt" }, { type: "zip", position: "center-front" })],
  [
    "mandarin with CB buttons",
    design({ collar: "mandarin", front: "high-round" }, { type: "buttons", position: "center-back" }),
  ],
  ["no collar on a V neck", design({ front: "v" }, { type: "none", position: "center-back" })],
];

describe("collar combinations", () => {
  it.each(REFUSED)("refuses %s", (_name, spec, code) => {
    expect(collarCombinationIssue(spec)).toBe(code);
    const result = generatePattern(spec, sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(result.pieces).toEqual([]);
    const check = result.validation.checks.find((c) => c.code === code);
    expect(check?.status).toBe("fail");
    expect(check?.message.ar.length).toBeGreaterThan(0);
    expect(check?.message.en.length).toBeGreaterThan(0);
  });

  it.each(ALLOWED)("drafts %s", (_name, spec) => {
    expect(collarCombinationIssue(spec)).toBeUndefined();
    expect(generatePattern(spec, sizeM, DEFAULT_ENGINE_OPTIONS).pieces.length).toBeGreaterThan(0);
  });

  it("never refuses a design without a neckline", () => {
    expect(collarCombinationIssue({ closure: dartedBlouse.closure })).toBeUndefined();
  });
});
