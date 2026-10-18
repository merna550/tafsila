/** Shared fixtures for unit-testing core validation rules. */
import type { EngineOptions, Piece } from "@tafsila/schemas";
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { lineSeg } from "../geometry";
import {
  createContext,
  type DraftContext,
  type PieceDraft,
  withInputs,
  withPiece,
} from "../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS } from "../pipeline/generate-pattern";
import { resolveDraftInputs } from "../resolve/resolve-draft-inputs";
import { deepFreeze } from "../test-utils/deep-freeze";

/** Engine options used by validation-only unit tests. */
export const VALIDATION_TEST_OPTIONS: EngineOptions = {
  ...DEFAULT_ENGINE_OPTIONS,
  sizeLabel: "validation-test",
};

/** Width of the shared piece fixture. */
const PIECE_WIDTH_MM = 100;
/** Height of the shared piece fixture. */
const PIECE_HEIGHT_MM = 200;
/** Seam allowance around the shared piece fixture. */
const PIECE_ALLOWANCE_MM = 10;
/** Inset of the fixture grain-line ends from its top and bottom. */
const GRAIN_INSET_MM = 20;

/**
 * Builds a closed rectangular path for validation fixtures.
 *
 * @param widthMm - Rectangle width in mm.
 * @param heightMm - Rectangle height in mm.
 * @param xMm - Left coordinate in mm.
 * @param yMm - Top coordinate in mm.
 * @returns Four clockwise line segments.
 */
export function rectanglePath(widthMm: number, heightMm: number, xMm = 0, yMm = 0): Piece["stitchPath"] {
  return [
    lineSeg({ x: xMm, y: yMm }, { x: xMm + widthMm, y: yMm }),
    lineSeg({ x: xMm + widthMm, y: yMm }, { x: xMm + widthMm, y: yMm + heightMm }),
    lineSeg({ x: xMm + widthMm, y: yMm + heightMm }, { x: xMm, y: yMm + heightMm }),
    lineSeg({ x: xMm, y: yMm + heightMm }, { x: xMm, y: yMm }),
  ];
}

/**
 * Builds one complete, structurally valid validation fixture.
 *
 * @param overrides - Piece fields changed by a test.
 * @returns A complete piece draft with a 10 mm cutting-line offset.
 */
export function validationPiece(overrides: Partial<PieceDraft> = {}): PieceDraft {
  return {
    id: "front",
    name: { ar: "الأمام", en: "Front" },
    cut: { quantity: 1, onFold: false, mirror: false, fabric: "main" },
    stitchPath: rectanglePath(PIECE_WIDTH_MM, PIECE_HEIGHT_MM),
    cutPath: rectanglePath(
      PIECE_WIDTH_MM + PIECE_ALLOWANCE_MM * 2,
      PIECE_HEIGHT_MM + PIECE_ALLOWANCE_MM * 2,
      -PIECE_ALLOWANCE_MM,
      -PIECE_ALLOWANCE_MM,
    ),
    edges: [
      { id: "top", fromSegment: 0, toSegment: 0, kind: "other", seamAllowanceMm: PIECE_ALLOWANCE_MM },
      { id: "side", fromSegment: 1, toSegment: 1, kind: "side", seamAllowanceMm: PIECE_ALLOWANCE_MM },
      { id: "hem", fromSegment: 2, toSegment: 2, kind: "hem", seamAllowanceMm: PIECE_ALLOWANCE_MM },
      { id: "fold", fromSegment: 3, toSegment: 3, kind: "fold", seamAllowanceMm: 0 },
    ],
    notches: [],
    bodyLines: [],
    grainLine: [
      { x: PIECE_WIDTH_MM / 2, y: GRAIN_INSET_MM },
      { x: PIECE_WIDTH_MM / 2, y: PIECE_HEIGHT_MM - GRAIN_INSET_MM },
    ],
    darts: [],
    labels: [],
    bbox: {
      widthMm: PIECE_WIDTH_MM + PIECE_ALLOWANCE_MM * 2,
      heightMm: PIECE_HEIGHT_MM + PIECE_ALLOWANCE_MM * 2,
    },
    ...overrides,
  };
}

/**
 * Creates a deep-frozen finished pipeline context around validation fixture pieces.
 *
 * @param pieces - Pieces to validate.
 * @param options - Optional engine options override.
 * @returns A context after the resolve step.
 */
export function validationContext(
  pieces: readonly PieceDraft[],
  options: EngineOptions = VALIDATION_TEST_OPTIONS,
): DraftContext {
  let context = createContext(vNeckHalfCircleDress, sizeM, options);
  context = withInputs(context, resolveDraftInputs(context.spec, context.measurements, context.options));
  for (const piece of pieces) context = withPiece(context, piece);
  return deepFreeze(context);
}
