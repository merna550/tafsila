/**
 * Contract of the direct-cut marking steps (issue #284, FR-CUT-01, FR-CUT-02). Plain JSON, so it crosses the Web Worker
 * boundary as is. Points are in piece coordinates (mm); distances are in mm along and across the piece's reference.
 */
import type { Point } from "@tafsila/schemas";
import type { Bilingual } from "../i18n/pieces";

/** Message key of one marking step; the texts live in `src/i18n/cut-steps.ts`. */
export type CutStepKey =
  | "cut.reference.fold"
  | "cut.reference.grain"
  | "cut.reference.top"
  | "cut.mark.corner"
  | "cut.mark.curve"
  | "cut.mark.notch"
  | "cut.mark.dart"
  | "cut.mark.grain"
  | "cut.connect.straight"
  | "cut.connect.curve"
  | "cut.connect.dart"
  | "cut.connect.grain"
  | "cut.cut";

/** Every step key, in the order a piece uses them; the i18n test checks each has a text. */
export const CUT_STEP_KEYS: readonly CutStepKey[] = [
  "cut.reference.fold",
  "cut.reference.grain",
  "cut.reference.top",
  "cut.mark.corner",
  "cut.mark.curve",
  "cut.mark.notch",
  "cut.mark.dart",
  "cut.mark.grain",
  "cut.connect.straight",
  "cut.connect.curve",
  "cut.connect.dart",
  "cut.connect.grain",
  "cut.cut",
];

/**
 * The reference frame of one piece (ADR-281 item 5). `along` runs down the reference line (the fold, or a line
 * parallel to the grain through the selvedge side); `across` is square to it, signed so every cut point is at
 * across ≥ 0. `origin` is on the reference, level with the top of the cut line. Vectors are unit length.
 */
export interface CutFrame {
  /** Whether the reference is the fold or a grain-parallel line. */
  readonly kind: "fold" | "grain";
  /** Where the reference meets the top line, in piece mm. */
  readonly origin: Point;
  /** Unit vector down the reference line. */
  readonly along: Point;
  /** Unit vector from the reference into the piece. */
  readonly across: Point;
}

/** What a marked point is: a corner or curve point of the cut line, a notch, a dart point, or a grain-line end. */
export type CutPointKind = "corner" | "curve" | "notch" | "dart" | "grain";

/** One point the tailor marks on the fabric. */
export interface CutPoint {
  /** Latin label, `A`..`Z`, `AA`.., unique in its piece and the same in every language. */
  readonly label: string;
  /** What the point is. */
  readonly kind: CutPointKind;
  /** Position in piece coordinates, mm (for the diagram, #292). */
  readonly at: Point;
  /** Distance down the reference from the top line, mm (≥ 0). */
  readonly alongMm: number;
  /** Distance from the reference into the piece, mm (≥ 0). */
  readonly acrossMm: number;
}

/** Parameters of one step: point labels, distances in mm (`…Mm`) and cut details. */
export type CutStepParams = Readonly<Record<string, string | number>>;

/** One numbered marking step. */
export interface CutStep {
  /** Step number, 1..N in the piece without gaps. */
  readonly n: number;
  /** Message key of the text. */
  readonly key: CutStepKey;
  /** Labels of the points the step uses, in order. */
  readonly points: readonly string[];
  /** Values the text template fills in. */
  readonly params: CutStepParams;
}

/** The marking steps of one piece. */
export interface PieceCutSteps {
  /** Id of the piece in the pattern. */
  readonly pieceId: string;
  /** Piece name in both languages. */
  readonly name: Bilingual;
  /** The piece's reference frame. */
  readonly frame: CutFrame;
  /** Every marked point, in label order. */
  readonly points: readonly CutPoint[];
  /** The steps, in order. */
  readonly steps: readonly CutStep[];
}

/** The marking steps of a whole pattern. */
export interface CutSteps {
  /** Engine version that drafted the pattern, printed on the checklist (ADR-281 item 1). */
  readonly engineVersion: string;
  /** Gap between curve points, mm. */
  readonly curveStepMm: number;
  /** One entry per piece, in pattern order. */
  readonly pieces: readonly PieceCutSteps[];
}
