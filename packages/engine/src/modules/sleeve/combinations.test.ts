/**
 * Table tests of the allowed sleeve combinations (issue #142, decision 142, 1): each refused design gives a `fail`
 * result with no pieces, the code and a bilingual message; every row of the table drafts.
 */
import { sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { SLEEVE_COMBINATIONS } from "../../constants/sleeve-style";
import { INPUT_ERROR_MESSAGES } from "../../pipeline/input-errors";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { sleeveCombinationIssue } from "./combinations";
import { type Sleeve, sleeveDesign } from "./test-support";

const REFUSED: readonly [Sleeve, string][] = [
  [{ type: "bishop", length: "long", cuff: "none" }, "SLEEVE_CUFF_UNSUPPORTED"],
  [{ type: "flutter", length: "long", cuff: "none" }, "SLEEVE_LENGTH_UNSUPPORTED"],
  [{ type: "set-in", length: "long", cuff: "elastic" }, "SLEEVE_CUFF_UNSUPPORTED"],
  [{ type: "cap", length: "cap", cuff: "band" }, "SLEEVE_CUFF_UNSUPPORTED"],
  [{ type: "puff", length: "long", cuff: "band" }, "SLEEVE_LENGTH_UNSUPPORTED"],
  [{ type: "set-in", length: "cap", cuff: "band" }, "SLEEVE_CUFF_UNSUPPORTED"],
];

/** Every allowed row of the table. */
const ALLOWED: Sleeve[] = Object.entries(SLEEVE_COMBINATIONS).flatMap(([type, lengths]) =>
  Object.entries(lengths).flatMap(([length, cuffs]) =>
    (cuffs ?? []).map((cuff) => ({ type, length, cuff }) as Sleeve),
  ),
);

describe("sleeve combinations", () => {
  it.each(REFUSED)("refuses %o", (sleeve, code) => {
    expect(sleeveCombinationIssue({ sleeve })).toBe(code);
    const result = generatePattern(sleeveDesign(sleeve), sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(result.pieces).toEqual([]);
    const check = result.validation.checks.find((c) => c.code === code);
    expect(check?.status).toBe("fail");
    expect(check?.message).toEqual(INPUT_ERROR_MESSAGES[code as keyof typeof INPUT_ERROR_MESSAGES]);
  });

  it("accepts every table row, and no sleeve at all", () => {
    expect(ALLOWED).toHaveLength(28);
    for (const sleeve of ALLOWED)
      expect(sleeveCombinationIssue({ sleeve }), JSON.stringify(sleeve)).toBeUndefined();
    expect(
      sleeveCombinationIssue({ sleeve: { type: "none", length: "long", cuff: "band" } }),
    ).toBeUndefined();
    expect(sleeveCombinationIssue({})).toBeUndefined();
    expect(
      sleeveCombinationIssue({ sleeve: { type: "set-in", length: "short", cuff: "none" } }),
    ).toBeUndefined();
    expect(
      sleeveCombinationIssue({ sleeve: { type: "puff", length: "elbow", cuff: "elastic" } }),
    ).toBeUndefined();
  });
});
