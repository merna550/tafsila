/** Integration tests for core validation in the pipeline registry. */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../pipeline/registry";
import { buildReport, validateStep } from "../pipeline/steps";
import { CORE_RULES } from "./core-rules";
import { validationContext, validationPiece } from "./test-support";

describe("CORE_RULES", () => {
  it("passes a valid finished fixture without changing its geometry", () => {
    const context = validationContext([validationPiece()]);
    const checked = validateStep(createRegistry([], CORE_RULES))(context);
    expect(checked.pieces).toBe(context.pieces);
    expect(checked.checks).toHaveLength(CORE_RULES.length);
    expect(buildReport(checked.checks).status).toBe("pass");
  });

  it("returns checks in a fixed id and failure-code order", () => {
    const context = validationContext([validationPiece()]);
    const registry = createRegistry([], [...CORE_RULES].reverse());
    const first = validateStep(registry)(context).checks;
    const second = validateStep(registry)(context).checks;
    expect(second).toEqual(first);
    expect(registry.rulesFor(context).map(({ id, code }) => `${id}/${code}`)).toEqual([
      "FR-VAL-05/STRUCT_MISSING_SA",
      "FR-VAL-05/STRUCT_OPEN_PATH",
      "FR-VAL-05/STRUCT_SELF_INTERSECTION",
      "FR-VAL-06/LABELS_NO_CUT_INFO",
      "FR-VAL-06/LABELS_NO_GRAIN",
      "FR-VAL-06/LABELS_NO_NAME",
      "FR-VAL-08/PLAUS_NEGATIVE_EASE",
      "FR-VAL-08/PLAUS_WIDER_THAN_FABRIC",
    ]);
  });

  it("uses the worst check as the report status", () => {
    const pass = { id: "FR-VAL-05" as const, status: "pass" as const, message: { ar: "نجح", en: "Passed" } };
    const warn = { ...pass, status: "warn" as const };
    const fail = { ...pass, status: "fail" as const };
    expect(buildReport([pass, warn]).status).toBe("warn");
    expect(buildReport([pass, warn, fail]).status).toBe("fail");
  });
});
