/**
 * The flutter sleeve (issue #142, decision 142, 3). Aldrich 6th ed., ch. 2 (sleeve variations: circular frill): a
 * half-circle ruffle whose inner arc is sewn into the armhole between the balance notches, eased by the set-in cap
 * ease; its outer arc is the narrow-hemmed flare. Grain on the bisector; cut two, mirrored.
 */
import type { EngineOptions } from "@tafsila/schemas";
import type { BodiceArmholeParts } from "../../blocks/bodice/armhole-parts";
import { SLEEVE_EDGE } from "../../blocks/sleeve/ids";
import type { SleeveInput } from "../../blocks/sleeve/types";
import {
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM,
  SLEEVE_CAP_TARGET_EASE_MM,
  SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
} from "../../constants/sleeve-block";
import {
  FLUTTER_DEPTH_MM,
  FLUTTER_SWEEP_RAD,
  PARTIAL_SLEEVE_GRAIN_INSET_MM,
} from "../../constants/sleeve-style";
import { arcToCubics, lineSeg, pt, splitAtLength } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";
import { partialSleevePiece } from "./partial";

/** Id of the flutter piece. */
export const FLUTTER_PIECE_ID = "flutter-sleeve";

/** Edge ids of the flutter beyond the cap halves. */
export const FLUTTER_EDGE = { endFront: "end-front", hem: SLEEVE_EDGE.hem, endBack: "end-back" } as const;

/** The ruffle hangs on the +y bisector. */
const BISECTOR_RAD = Math.PI / 2;

/** Arms. */
const PAIR = 2;

/**
 * Drafts the flutter ruffle.
 *
 * @param input - The sleeve input (armhole lengths).
 * @param length - Flutter length (cap or short).
 * @param armholes - Bodice pieces holding each armhole.
 * @param options - Engine options, for the seam allowances.
 * @returns The flutter piece.
 */
export function flutterPiece(
  input: SleeveInput,
  length: "cap" | "short",
  armholes: BodiceArmholeParts,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  const spanBackMm = input.armholeBackMm - SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM;
  const spanMm = spanBackMm + input.armholeFrontMm - SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM;
  const innerMm = spanMm + SLEEVE_CAP_TARGET_EASE_MM;
  const innerRadiusMm = innerMm / FLUTTER_SWEEP_RAD;
  const outerRadiusMm = innerRadiusMm + FLUTTER_DEPTH_MM[length];
  const backRad = BISECTOR_RAD + FLUTTER_SWEEP_RAD / 2;
  const frontRad = BISECTOR_RAD - FLUTTER_SWEEP_RAD / 2;
  const centre = pt(0, 0);
  const inner = arcToCubics({ center: centre, radiusMm: innerRadiusMm, fromRad: backRad, toRad: frontRad });
  const outer = arcToCubics({ center: centre, radiusMm: outerRadiusMm, fromRad: frontRad, toRad: backRad });
  const [capBack, capFront] = splitAtLength(inner, (innerMm * spanBackMm) / spanMm);
  return partialSleevePiece(
    {
      id: FLUTTER_PIECE_ID,
      quantity: PAIR,
      capBack,
      capFront,
      rest: [
        lineSeg(capFront.at(-1)!.to, outer[0]!.from),
        ...outer,
        lineSeg(outer.at(-1)!.to, capBack[0]!.from),
      ],
      restEdges: [
        { id: FLUTTER_EDGE.endFront, kind: "other", segments: 1 },
        { id: FLUTTER_EDGE.hem, kind: "other", segments: outer.length },
        { id: FLUTTER_EDGE.endBack, kind: "other", segments: 1 },
      ],
      grainLine: [
        pt(0, innerRadiusMm + PARTIAL_SLEEVE_GRAIN_INSET_MM),
        pt(0, outerRadiusMm - PARTIAL_SLEEVE_GRAIN_INSET_MM),
      ],
    },
    armholes,
    options,
  );
}
