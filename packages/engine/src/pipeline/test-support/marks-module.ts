/** Test-only module: a front and a back panel sharing a side seam, with every mark (notches, dart, grain). */
import type { Piece } from "@tafsila/schemas";
import { defaultGrainLine } from "../../finishing/grain";
import { withPiece } from "../draft-context";
import type { FeatureModule } from "../feature-module";
import { createRegistry } from "../registry";
import { polygonPath, rectanglePoints } from "./shapes";

/** Panel size in mm. */
const WIDTH_MM = 300;
const HEIGHT_MM = 400;

const path: Piece["stitchPath"] = polygonPath(rectanglePoints(WIDTH_MM, HEIGHT_MM));

/** Front: side seam is the right edge (runs down); back: side seam is the left edge (runs up), so they are reversed. */
const frontEdges: Piece["edges"] = [
  { id: "waist", fromSegment: 0, toSegment: 0, kind: "other", seamAllowanceMm: 0 },
  {
    id: "side",
    fromSegment: 1,
    toSegment: 1,
    kind: "side",
    seamAllowanceMm: 0,
    pairsWith: { pieceId: "back-panel", edgeId: "side", reversed: true },
  },
  { id: "hem", fromSegment: 2, toSegment: 2, kind: "hem", seamAllowanceMm: 0 },
  { id: "cf", fromSegment: 3, toSegment: 3, kind: "fold", seamAllowanceMm: 0 },
];

const backEdges: Piece["edges"] = [
  { id: "waist", fromSegment: 0, toSegment: 0, kind: "other", seamAllowanceMm: 0 },
  { id: "cb", fromSegment: 1, toSegment: 1, kind: "fold", seamAllowanceMm: 0 },
  { id: "hem", fromSegment: 2, toSegment: 2, kind: "hem", seamAllowanceMm: 0 },
  {
    id: "side",
    fromSegment: 3,
    toSegment: 3,
    kind: "side",
    seamAllowanceMm: 0,
    pairsWith: { pieceId: "front-panel", edgeId: "side", reversed: true },
  },
];

/** Adds the two panels; only the front carries notches (the engine writes the back ones) and a waist dart. */
export const marksModule: FeatureModule = {
  id: "test-marks",
  order: 1,
  appliesTo: () => true,
  draft: (ctx) =>
    withPiece(
      withPiece(ctx, {
        id: "front-panel",
        name: { ar: "الأمام", en: "Front" },
        cut: { quantity: 1, onFold: true, mirror: false, fabric: "main" },
        stitchPath: path,
        edges: frontEdges,
        notches: [
          { id: "n1", edgeId: "side", atMm: 120, pairsWith: { pieceId: "back-panel", edgeId: "side" } },
          {
            id: "n2",
            edgeId: "side",
            atMm: 250,
            marks: 2,
            pairsWith: { pieceId: "back-panel", edgeId: "side" },
          },
        ],
        grainLine: [
          { x: 150, y: 80 },
          { x: 150, y: 320 },
        ],
        darts: [
          {
            id: "d1",
            edgeId: "waist",
            apex: { x: 60, y: 90 },
            legs: [
              { x: 45, y: 0 },
              { x: 75, y: 0 },
            ],
          },
        ],
      }),
      {
        id: "back-panel",
        name: { ar: "الخلف", en: "Back" },
        cut: { quantity: 1, onFold: true, mirror: false, fabric: "main" },
        stitchPath: path,
        edges: backEdges,
        notches: [],
        grainLine: defaultGrainLine(path),
        darts: [],
      },
    ),
};

/** A registry holding only the marks module. */
export const marksRegistry = createRegistry([marksModule]);
