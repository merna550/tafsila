/**
 * Back princess panels (issue #138, FR-PAT-05): a style line from the shoulder or the armhole to the back waist dart
 * apex, then down both dart legs, cutting the back into a centre back panel (on the fold) and a side back panel (a
 * pair). The back has no bust dart, so nothing turns: the two panels share the upper stretch, and the lower
 * stretches mirror each other about the dart's centre line (decision 138, 4).
 */
import type { EngineOptions, Point } from "@tafsila/schemas";
import { BACK_SHOULDER_EASE_MM } from "../../constants/bodice";
import { PRINCESS_SHOULDER_SHARE } from "../../constants/bodice-shaping";
import {
  BACK_CENTRE_PIECE_ID,
  BACK_SIDE_PIECE_ID,
  FRONT_CENTRE_PIECE_ID,
  FRONT_SIDE_PIECE_ID,
  type BackPointName,
  type BodiceDraft,
} from "../../blocks/bodice";
import { distance, lineSeg, reverseSegment } from "../../geometry";
import { edgeSegments } from "../../pieces/measure";
import type { PieceDraft } from "../../pipeline/draft-context";
import { panelTops, type PrincessVariant } from "./panel-parts";
import { centrePanel, sidePanel, type HalfLines } from "./panels";
import { lowerEnds, styleCurve, upperEnds } from "./style-line";

/**
 * The back key point with the given name.
 *
 * @param d - The bodice block.
 * @param name - Key point name.
 * @returns The point.
 */
function backPoint(d: BodiceDraft, name: BackPointName): Point {
  return d.keyPoints[`bodice.back.${name}`];
}

/**
 * The back lines. A shoulder line starts as far from the back neck point as the front one does from the front neck
 * point, so the shoulder seams pair panel to panel; the back shoulder ease stays on the side panel.
 *
 * @param d - The bodice block.
 * @param variant - Shoulder or armhole princess line.
 * @returns The shared lines of both back panels.
 */
function backLines(d: BodiceDraft, variant: PrincessVariant): HalfLines {
  const frontShoulderMm = distance(
    d.keyPoints["bodice.front.neckPoint"],
    d.keyPoints["bodice.front.shoulderTip"],
  );
  const top = {
    neckPoint: backPoint(d, "neckPoint"),
    tip: backPoint(d, "shoulderTip"),
    armhole: d.armhole.back,
  };
  const tops = panelTops(top, variant, frontShoulderMm * PRINCESS_SHOULDER_SHARE);
  const apex = backPoint(d, "waistDartApex");
  const centreLeg = backPoint(d, "waistDartLeft");
  const sideLeg = backPoint(d, "waistDartRight");
  const upper = styleCurve(upperEnds(tops.start, apex));
  return {
    tops,
    centreStyle: [upper, styleCurve(lowerEnds(apex, centreLeg))],
    sideStyle: [reverseSegment(styleCurve(lowerEnds(apex, sideLeg))), reverseSegment(upper)],
    legs: [centreLeg, sideLeg],
  };
}

/**
 * The two back princess panels. Aldrich 6th ed., ch. 3, princess line bodice, back (decision 138, 4).
 *
 * @param d - The bodice block.
 * @param variant - Shoulder or armhole princess line.
 * @param options - Engine options, for the seam allowances.
 * @returns The centre back and side back panels.
 */
export function backPrincessPanels(
  d: BodiceDraft,
  variant: PrincessVariant,
  options: Pick<EngineOptions, "seamAllowance">,
): [PieceDraft, PieceDraft] {
  const lines = backLines(d, variant);
  const underarm = backPoint(d, "underarm");
  const bust = { id: "bodice-bust", measurement: "bust", kind: "horizontal", atMm: underarm.y } as const;
  const centre = centrePanel(
    lines,
    {
      id: BACK_CENTRE_PIECE_ID,
      sideId: BACK_SIDE_PIECE_ID,
      neck: edgeSegments(d.back, "neck"),
      neckCentre: backPoint(d, "nape"),
      waistCentre: backPoint(d, "waistCB"),
      foldEdgeId: "cb",
      shoulderPair: {
        pieceId: FRONT_CENTRE_PIECE_ID,
        edgeId: "shoulder",
        ...(variant === "armhole" ? { intendedEaseMm: BACK_SHOULDER_EASE_MM } : {}),
      },
      bust,
    },
    options,
  );
  const side = sidePanel(
    lines,
    {
      id: BACK_SIDE_PIECE_ID,
      centreId: BACK_CENTRE_PIECE_ID,
      sideSeam: [lineSeg(underarm, backPoint(d, "sideWaist"))],
      sidePair: { pieceId: FRONT_SIDE_PIECE_ID, edgeId: "side" },
      shoulderPair: {
        pieceId: FRONT_SIDE_PIECE_ID,
        edgeId: "shoulder",
        intendedEaseMm: BACK_SHOULDER_EASE_MM,
      },
      bust,
      underarmY: underarm.y,
    },
    options,
  );
  return [centre, side];
}
