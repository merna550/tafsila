/** Sync test (issue #128): the engine's bodice method constants equal the reference calculation's twins. */
import { DRAFT_CONSTANTS } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import * as B from "./bodice";

describe("bodice constants", () => {
  it("equal DRAFT_CONSTANTS of the independent reference calculation", () => {
    const pairs: [number, number][] = [
      [B.BACK_NECK_RISE_MM, DRAFT_CONSTANTS.backNeckRiseMm],
      [B.SCYE_DEPTH_BASE_MM, DRAFT_CONSTANTS.scyeDepthBaseMm],
      [B.SCYE_DEPTH_BUST_SHARE, DRAFT_CONSTANTS.scyeDepthBustShare],
      [B.BACK_WIDTH_RATIO, DRAFT_CONSTANTS.backWidthRatio],
      [B.CHEST_WIDTH_RATIO, DRAFT_CONSTANTS.chestWidthRatio],
      [B.NECK_WIDTH_DEDUCT_MM, DRAFT_CONSTANTS.neckWidthDeductMm],
      [B.FRONT_NECK_DEPTH_ADD_MM, DRAFT_CONSTANTS.frontNeckDepthAddMm],
      [B.BACK_SHOULDER_SLOPE, DRAFT_CONSTANTS.backShoulderSlope],
      [B.FRONT_SHOULDER_SLOPE, DRAFT_CONSTANTS.frontShoulderSlope],
      [B.BUST_DART_RATIO, DRAFT_CONSTANTS.bustDartRatio],
      [B.BODICE_DART_SHARE, DRAFT_CONSTANTS.bodiceDartShare],
      [B.BUST_DART_BELOW_UNDERARM_MM, DRAFT_CONSTANTS.bustDartBelowUnderarmMm],
      [B.FRONT_DART_BELOW_BUST_MM, DRAFT_CONSTANTS.frontDartBelowBustMm],
      [B.BACK_SHOULDER_EASE_MM, DRAFT_CONSTANTS.backShoulderEaseMm],
      [B.BUST_DART_APEX_SETBACK_MM, DRAFT_CONSTANTS.bustDartApexSetbackMm],
    ];
    for (const [engine, reference] of pairs) expect(engine).toBe(reference);
  });
});
