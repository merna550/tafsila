/** The nesting worker's logic without `self`: drafts the version again, places the pieces and builds the marker scenes (issue #318). */
import { generatePattern } from "@tafsila/engine";
import {
  FABRIC_KINDS,
  buildMarkerScene,
  fabricResult,
  type FabricKind,
  type FabricResult,
} from "@tafsila/nesting";
import type { PatternResult } from "@tafsila/schemas";
import { toWorkerError } from "../pattern-preview/worker-error";
import type { FabricKindView, FabricMessage, FabricRequest, FabricStage } from "./protocol";

/**
 * Builds the view of one fabric kind.
 *
 * @param pattern - The drafted pattern (for piece names).
 * @param result - The calculation.
 * @param kind - The fabric kind.
 * @returns The view, or null when the kind has no pieces at all.
 */
function kindView(pattern: PatternResult, result: FabricResult, kind: FabricKind): FabricKindView | null {
  const placed = result[kind];
  if (result.prepared[kind].length === 0 && placed.doesNotFit.length === 0) return null;
  return {
    kind,
    lengthM: placed.lengthM,
    placements: placed.placements.map((p) => ({
      shapeId: p.shapeId,
      xMm: p.xMm,
      yMm: p.yMm,
      turn: p.rotation,
    })),
    scene: buildMarkerScene(pattern, result.prepared, placed),
  };
}

/**
 * Drafts the version again and calculates the fabric. Never throws: every failure is an answer.
 *
 * @param request - Stored inputs and fabric options with the request id.
 * @param onProgress - Called when a step starts.
 * @returns The final answer.
 */
export function runFabric(
  request: FabricRequest,
  onProgress: (message: FabricMessage) => void,
): FabricMessage {
  /**
   * Reports a step.
   *
   * @param stage - The step that starts.
   * @returns Nothing.
   */
  const stage = (stage: FabricStage): void => onProgress({ id: request.id, progress: { stage } });
  try {
    stage("draft");
    const { spec, measurements, options } = request.input;
    const pattern = generatePattern(spec, measurements, options);
    if (pattern.validation.status === "fail") {
      return {
        id: request.id,
        ok: false,
        error: { code: "PATTERN_INVALID", message: "The pattern did not pass validation" },
      };
    }
    stage("nest");
    const result = fabricResult(pattern, request.options);
    const kinds = FABRIC_KINDS.flatMap((kind) => kindView(pattern, result, kind) ?? []);
    return {
      id: request.id,
      ok: true,
      kinds,
      doesNotFit: result.prepared.doesNotFit.map((d) => ({
        ...d,
        name: pattern.pieces.find((p) => p.id === d.pieceId)!.name,
      })),
      suggestOpen: result.suggestOpen,
      nestingVersion: result.nestingVersion,
    };
  } catch (error) {
    return { id: request.id, ok: false, error: toWorkerError(error) };
  }
}
