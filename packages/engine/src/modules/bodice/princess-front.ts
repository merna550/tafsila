/**
 * Front princess panels (issue #138, FR-PAT-05): the bust dart pivoted into a style line from the shoulder or the
 * armhole through the bust level, the waist dart extended up to it, and the front cut into a centre front panel
 * (on the fold) and a side front panel (a pair). Aldrich 6th ed., ch. 3, princess line bodice (decision 138).
 */
import type { EngineOptions, Point } from "@tafsila/schemas";
import { PRINCESS_SHOULDER_SHARE } from "../../constants/bodice-shaping";
import { trueDartLegs } from "../../blocks/shared/darts";
import {
  BACK_CENTRE_PIECE_ID,
  BACK_SIDE_PIECE_ID,
  FRONT_CENTRE_PIECE_ID,
  FRONT_SIDE_PIECE_ID,
  type BodiceDraft,
  type FrontPointName,
} from "../../blocks/bodice";
import { cubicLength, distance, lineSeg, reverseSegment } from "../../geometry";
import { edgeSegments } from "../../pieces/measure";
import type { PieceDraft } from "../../pipeline/draft-context";
import { bustDartPivot } from "./dart-pivot";
import { panelTops, type PanelTops, type PrincessVariant } from "./panel-parts";
import { centrePanel, sidePanel, type HalfLines } from "./panels";
import { lowerEnds, styleCurve, trueStyleCurve, upperEnds } from "./style-line";

/**
 * The front key point with the given name.
 *
 * @param d - The bodice block.
 * @param name - Key point name.
 * @returns The point.
 */
function frontPoint(d: BodiceDraft, name: FrontPointName): Point {
  return d.keyPoints[`bodice.front.${name}`];
}

/**
 * The front lines: the top cut at the style start with its side part turned, and the princess seam, whose upper
 * stretch runs from the style start to the pivot and lower stretch along the extended waist dart leg. The side
 * panel's stretches are trued to the centre panel's lengths (decision 138, 3).
 *
 * @param tops - The front top cut at the style start, side part turned.
 * @param centreStart - Style start on the centre panel (before the turn).
 * @param pivot - The pivot.
 * @param waistLegs - The waist dart legs, centre side first.
 * @returns The shared lines of both front panels.
 */
function frontLines(
  tops: PanelTops,
  centreStart: Point,
  pivot: Point,
  waistLegs: readonly [Point, Point],
): HalfLines {
  const [centreLeg, sideLeg] = trueDartLegs(pivot, waistLegs[0], waistLegs[1]);
  const centreUpper = styleCurve(upperEnds(centreStart, pivot));
  const centreLower = styleCurve(lowerEnds(pivot, centreLeg));
  const sideUpper = trueStyleCurve(upperEnds(tops.start, pivot), cubicLength(centreUpper));
  const sideLower = trueStyleCurve(lowerEnds(pivot, sideLeg), cubicLength(centreLower));
  return {
    tops,
    centreStyle: [centreUpper, centreLower],
    sideStyle: [reverseSegment(sideLower), reverseSegment(sideUpper)],
    legs: [centreLeg, sideLeg],
  };
}

/**
 * The two front princess panels. The style line starts mid-shoulder or a third down the armhole, the bust dart is
 * closed by turning the side panel about the pivot (its intake opens between the panels above the bust), and the
 * waist dart's legs run up to the pivot. Aldrich 6th ed., ch. 3 (decision 138, 1-4).
 *
 * @param d - The bodice block (with the bust dart at the side and, when drafted, the waist dart).
 * @param variant - Shoulder or armhole princess line.
 * @param options - Engine options, for the seam allowances.
 * @returns The centre front and side front panels.
 */
export function frontPrincessPanels(
  d: BodiceDraft,
  variant: PrincessVariant,
  options: Pick<EngineOptions, "seamAllowance">,
): [PieceDraft, PieceDraft] {
  const neckPoint = frontPoint(d, "neckPoint");
  const tip = frontPoint(d, "shoulderTip");
  const lower = frontPoint(d, "bustDartLower");
  const pivot = bustDartPivot({
    bustPoint: frontPoint(d, "bustPoint"),
    upper: frontPoint(d, "bustDartUpper"),
    lower,
  });
  const shoulderStartMm = distance(neckPoint, tip) * PRINCESS_SHOULDER_SHARE;
  const tops = panelTops({ neckPoint, tip, armhole: d.armhole.front }, variant, shoulderStartMm);
  const turned: PanelTops = { ...tops, start: pivot.turn(tops.start), side: pivot.turn(tops.side) };
  const lines = frontLines(turned, tops.start, pivot.pivot, [
    frontPoint(d, "waistDartLeft"),
    frontPoint(d, "waistDartRight"),
  ]);
  const underarm = pivot.turn(frontPoint(d, "underarm"));
  const centre = centrePanel(
    lines,
    {
      id: FRONT_CENTRE_PIECE_ID,
      sideId: FRONT_SIDE_PIECE_ID,
      neck: edgeSegments(d.front, "neck"),
      neckCentre: frontPoint(d, "neckCF"),
      waistCentre: frontPoint(d, "waistCF"),
      foldEdgeId: "cf",
      shoulderPair: { pieceId: BACK_CENTRE_PIECE_ID, edgeId: "shoulder" },
      bust: { id: "bodice-bust", measurement: "bust", kind: "horizontal", atMm: pivot.pivot.y },
    },
    options,
  );
  const side = sidePanel(
    lines,
    {
      id: FRONT_SIDE_PIECE_ID,
      centreId: FRONT_CENTRE_PIECE_ID,
      sideSeam: [lineSeg(underarm, lower), lineSeg(lower, frontPoint(d, "sideWaist"))],
      sidePair: { pieceId: BACK_SIDE_PIECE_ID, edgeId: "side" },
      shoulderPair: { pieceId: BACK_SIDE_PIECE_ID, edgeId: "shoulder" },
      bust: { id: "bodice-bust", measurement: "bust", kind: "polyline", points: [pivot.pivot, lower] },
      underarmY: underarm.y,
    },
    options,
  );
  return [centre, side];
}
