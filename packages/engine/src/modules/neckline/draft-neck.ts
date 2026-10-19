/**
 * Drafts the neckline of both halves for a run (issue #139): reads the bodice block's neck and shoulder, resolves
 * the style depth and width, and builds each half's new neck. Pure, so the module and its rules share it.
 */
import type { Point } from "@tafsila/schemas";
import {
  BACK_CENTRE_PIECE_ID,
  BACK_PIECE_ID,
  FRONT_CENTRE_PIECE_ID,
  FRONT_PIECE_ID,
  bodiceInputFrom,
  draftBodice,
} from "../../blocks/bodice";
import {
  FACING_SHOULDER_CLEARANCE_MM,
  FACING_WIDTH_MM,
  NECK_MIN_SHOULDER_LEFT_MM,
} from "../../constants/neckline";
import { DraftingError } from "../../errors/drafting-error";
import { add, distance, normalize, pt, scale, segmentLength, sub } from "../../geometry";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import { type NecklineStyle, necklineCurve } from "./curves";
import { type NeckHalf, type NeckResolution, type NecklineSpec, resolveNeck } from "./resolve";
import { NECK_EDGE_ID, type NewNeck } from "./splice";

/** Bodice pieces that can hold the neck of each half. */
const NECK_PIECE_IDS: Readonly<Record<NeckHalf, readonly string[]>> = {
  front: [FRONT_PIECE_ID, FRONT_CENTRE_PIECE_ID],
  back: [BACK_PIECE_ID, BACK_CENTRE_PIECE_ID],
};

/** Both halves, front first. */
export const NECK_HALVES: readonly NeckHalf[] = ["front", "back"];

/** The block's neck of one half. */
interface BlockNeck {
  /** Neck point on the HPS level. */
  readonly hps: Point;
  /** Block neck point on the centre line. */
  readonly centre: Point;
  /** Shoulder tip. */
  readonly tip: Point;
  /** The armscye line on the centre line. */
  readonly scye: Point;
  /** The bust point (front) or the armscye line (back): the neck stays above it. */
  readonly bust: Point;
}

/** One half's drafted neck. */
export interface HalfNeck {
  /** The bodice piece that holds the neck (block half or princess centre panel). */
  readonly piece: PieceDraft;
  /** The new neck. */
  readonly neck: NewNeck;
  /** Shoulder left from the new neck point to the shoulder tip. */
  readonly shoulderLeftMm: number;
}

/** The drafted neck of a run. */
export interface DraftedNeck {
  /** Depths and width, with their limits. */
  readonly resolution: NeckResolution;
  /** Each half's neck. */
  readonly halves: Readonly<Record<NeckHalf, HalfNeck>>;
  /** Facing width: `FACING_WIDTH_MM`, less when the shoulder is too short for it. */
  readonly facingWidthMm: number;
}

/**
 * The piece holding the neck of one half.
 *
 * @param ctx - Context after the bodice shaping modules.
 * @param half - Front or back.
 * @returns The piece.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when no bodice piece holds the neck.
 */
function neckPiece(ctx: DraftContext, half: NeckHalf): PieceDraft {
  const piece = ctx.pieces.find(
    (p) => NECK_PIECE_IDS[half].includes(p.id) && p.edges.some((e) => e.id === NECK_EDGE_ID),
  );
  if (!piece) throw new DraftingError("PIPELINE_STEP_ORDER", "The neckline needs the bodice block first");
  return piece;
}

/**
 * The block neck of both halves, from a fresh (pure, so identical) draft of the run's bodice block.
 *
 * @param ctx - Context after the blocks step.
 * @returns Both halves' block necks.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the resolve step has not run.
 */
function blockNecks(ctx: DraftContext): Record<NeckHalf, BlockNeck> {
  if (!ctx.inputs)
    throw new DraftingError("PIPELINE_STEP_ORDER", "The neckline needs the resolve step first");
  const k = draftBodice(bodiceInputFrom(ctx.measurements, ctx.spec, ctx.inputs), ctx.options).keyPoints;
  return {
    front: {
      hps: k["bodice.front.neckPoint"],
      centre: k["bodice.front.neckCF"],
      tip: k["bodice.front.shoulderTip"],
      scye: k["bodice.front.scyeLineCF"],
      bust: k["bodice.front.bustPoint"],
    },
    back: {
      hps: k["bodice.back.neckPoint"],
      centre: k["bodice.back.nape"],
      tip: k["bodice.back.shoulderTip"],
      scye: k["bodice.back.scyeLineCB"],
      bust: k["bodice.back.scyeLineCB"],
    },
  };
}

/**
 * Length of the first shoulder segment of a piece holding the neck (the part a wider neck eats into).
 *
 * @param piece - Bodice piece.
 * @returns Length in mm.
 */
function firstShoulderMm(piece: PieceDraft): number {
  const shoulder = piece.edges.find((e) => e.id === "shoulder");
  return shoulder ? segmentLength(piece.stitchPath[shoulder.fromSegment]!) : 0;
}

/**
 * One half's new neck: the neck point moved along the shoulder, the centre lowered or raised, and the style curve.
 *
 * @param block - The half's block neck.
 * @param style - The half's style.
 * @param depthMm - Resolved depth below the moved neck point.
 * @param widenMm - Resolved widening.
 * @returns The new neck.
 */
function halfNeck(block: BlockNeck, style: NecklineStyle, depthMm: number, widenMm: number): NewNeck {
  const shoulderDir = normalize(sub(block.tip, block.hps));
  const neckPoint = add(block.hps, scale(shoulderDir, widenMm));
  const centre = pt(block.centre.x, neckPoint.y + depthMm);
  return { segments: necklineCurve(style, { centre, neckPoint, shoulderDir }), centre, neckPoint };
}

/**
 * Drafts the neck of both halves. Aldrich 6th ed., ch. 4, necklines (decision 139, 1-4).
 *
 * @param ctx - Context after the bodice shaping modules.
 * @param neckline - The design's neckline.
 * @returns The resolution, each half's neck and the facing width.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the bodice is not drafted.
 */
export function draftNeck(ctx: DraftContext, neckline: NecklineSpec): DraftedNeck {
  const blocks = blockNecks(ctx);
  const pieces = { front: neckPiece(ctx, "front"), back: neckPiece(ctx, "back") };
  const resolution = resolveNeck(neckline, {
    blockDepthMm: {
      front: blocks.front.centre.y - blocks.front.hps.y,
      back: blocks.back.centre.y - blocks.back.hps.y,
    },
    scyeDepthMm: {
      front: blocks.front.scye.y - blocks.front.hps.y,
      back: blocks.back.scye.y - blocks.back.hps.y,
    },
    bustDepthMm: blocks.front.bust.y - blocks.front.hps.y,
    dropPerWidenMm: {
      front: normalize(sub(blocks.front.tip, blocks.front.hps)).y,
      back: normalize(sub(blocks.back.tip, blocks.back.hps)).y,
    },
    maxWidenMm:
      Math.min(firstShoulderMm(pieces.front), firstShoulderMm(pieces.back)) - NECK_MIN_SHOULDER_LEFT_MM,
  });
  const styles: Record<NeckHalf, NecklineStyle> = { front: neckline.front, back: neckline.back };
  const halves = Object.fromEntries(
    NECK_HALVES.map((half) => {
      const neck = halfNeck(
        blocks[half],
        styles[half],
        resolution.depth[half].valueMm,
        resolution.widen.valueMm,
      );
      return [
        half,
        { piece: pieces[half], neck, shoulderLeftMm: distance(neck.neckPoint, blocks[half].tip) },
      ];
    }),
  ) as Record<NeckHalf, HalfNeck>;
  const shortest = Math.min(halves.front.shoulderLeftMm, halves.back.shoulderLeftMm);
  return {
    resolution,
    halves,
    facingWidthMm: Math.min(FACING_WIDTH_MM, shortest - FACING_SHOULDER_CLEARANCE_MM),
  };
}
