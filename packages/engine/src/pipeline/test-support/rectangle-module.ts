/** Test-only module proving a module can add a piece and a rule. Not in the default registry. */
import type { Piece, ValidationCheck } from "@tafsila/schemas";
import { lineSeg } from "../../geometry";
import { withPiece, type DraftContext } from "../draft-context";
import type { FeatureModule } from "../feature-module";
import { createRegistry } from "../registry";

const WIDTH_MM = 200;
const HEIGHT_MM = 300;

/** The closed 200 x 300 mm rectangle path. */
const rectanglePath: Piece["stitchPath"] = [
  lineSeg({ x: 0, y: 0 }, { x: WIDTH_MM, y: 0 }),
  lineSeg({ x: WIDTH_MM, y: 0 }, { x: WIDTH_MM, y: HEIGHT_MM }),
  lineSeg({ x: WIDTH_MM, y: HEIGHT_MM }, { x: 0, y: HEIGHT_MM }),
  lineSeg({ x: 0, y: HEIGHT_MM }, { x: 0, y: 0 }),
];

/** Adds one rectangle piece and an FR-VAL-06 rule that checks its width. */
export const rectangleModule: FeatureModule = {
  id: "test-rectangle",
  order: 1,
  appliesTo: () => true,
  draft: (ctx) =>
    withPiece(ctx, {
      id: "front-panel",
      name: { ar: "الأمام", en: "Front" },
      cut: { quantity: 1, onFold: false, mirror: false, fabric: "main" },
      stitchPath: rectanglePath,
      edges: [],
      notches: [],
      grainLine: [
        { x: 100, y: 50 },
        { x: 100, y: 250 },
      ],
      darts: [],
    }),
  validations: [
    {
      id: "FR-VAL-06",
      appliesTo: () => true,
      run: (ctx: DraftContext): ValidationCheck => {
        const bboxWidth = ctx.pieces[0]?.stitchPath[0]?.to.x ?? 0;
        return {
          id: "FR-VAL-06",
          status: bboxWidth === WIDTH_MM ? "pass" : "fail",
          message: { ar: "عرض القطعة مطابق", en: "Piece width matches" },
          measuredMm: bboxWidth,
          expectedMm: WIDTH_MM,
        };
      },
    },
  ],
};

/** A registry holding only the rectangle module. */
export const rectangleRegistry = createRegistry([rectangleModule]);
