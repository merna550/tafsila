import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import type { ValidationCheck, ValidationReport } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { withDemoChecks } from "../dev-report";
import { reportRows } from "./report-rows";

const result = generatePattern(seedDress, sizeM);
const scene = buildPatternScene(result);

/**
 * A check with only what a test cares about.
 *
 * @param status - Outcome.
 * @param extra - More fields.
 * @returns The check.
 */
function check(status: ValidationCheck["status"], extra: Partial<ValidationCheck> = {}): ValidationCheck {
  return { id: "FR-VAL-01", status, message: { ar: "م", en: "m" }, ...extra };
}

describe("reportRows", () => {
  it("orders failures, warnings and passes, each in report order", () => {
    const report: ValidationReport = {
      status: "fail",
      checks: [
        check("pass", { code: "A" }),
        check("warn", { code: "B" }),
        check("fail", { code: "C" }),
        check("fail", { code: "D" }),
      ],
    };
    const rows = reportRows(report, scene);
    expect(rows.failures.map((r) => r.check.code)).toEqual(["C", "D"]);
    expect(rows.warnings.map((r) => r.check.code)).toEqual(["B"]);
    expect(rows.passes.map((r) => r.check.code)).toEqual(["A"]);
  });

  it("keeps FR-MEAS-01 out of the rows", () => {
    const meas = check("fail", { id: "FR-MEAS-01" });
    const rows = reportRows({ status: "fail", checks: [meas] }, scene);
    expect(rows.formLevel).toEqual([meas]);
    expect(rows.failures).toEqual([]);
  });

  it("resolves piece, edge and dart refs and drops unknown ones", () => {
    const refs = [
      "bodice-front",
      "bodice-front/side",
      "bodice-front/bust-dart",
      "nope/edge",
      "bodice-front/ghost",
    ];
    const [row] = reportRows({ status: "warn", checks: [check("warn", { refs })] }, scene).warnings;
    expect(row!.targets).toEqual([
      { pieceId: "bodice-front" },
      { pieceId: "bodice-front", edgeId: "side" },
      { pieceId: "bodice-front", dartId: "bust-dart" },
    ]);
  });

  it("gives an empty report no rows and formats values in cm", () => {
    const empty = reportRows({ status: "pass", checks: [] }, scene);
    expect([empty.failures, empty.warnings, empty.passes, empty.formLevel].every((l) => l.length === 0)).toBe(
      true,
    );
    const [row] = reportRows(
      { status: "warn", checks: [check("warn", { measuredMm: 244, expectedMm: 220 })] },
      scene,
    ).warnings;
    expect([row!.measuredCm, row!.expectedCm]).toEqual(["24.4", "22"]);
  });

  it("resolves the demo refs and every seed ref except the two the engine writes without a piece id", () => {
    const report = withDemoChecks(result.validation);
    const rows = reportRows(report, scene);
    expect(rows.failures[0]!.targets).toHaveLength(2);
    expect(rows.warnings[0]!.targets).toHaveLength(1);
    expect(
      rows.passes
        .filter((r) => (r.check.refs?.length ?? 0) > 0 && r.targets.length === 0)
        .map((r) => r.check.refs),
    ).toEqual([["front/waist"], ["back/waist"]]); // engine refs that name no piece: plain rows, no select action
  });
});
