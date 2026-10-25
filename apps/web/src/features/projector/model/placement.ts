/** Where each piece sits on the projected sheet: an offset from the layout and a turn of 0 or 180 degrees only (issues #286, #287). Pure, no React. */
import type { PatternScene } from "@tafsila/engine/viewer";
import type { Point } from "@tafsila/schemas";
import { screenDeltaToSceneMm } from "./projector-view";

/** The only turns a piece can have: the grain line must stay parallel to the fabric grain. */
// eslint-disable-next-line no-magic-numbers -- the half turn is the one allowed angle
export type Rotation = 0 | 180;

/** The half turn, in degrees. */
const HALF_TURN_DEG = 180;

/** A piece moved from its place on the sheet. */
export interface Placement {
  /** Move in sheet mm. */
  readonly offsetMm: Point;
  /** Turn about the centre of the cut box. */
  readonly rotationDeg: Rotation;
}

/** Placements by piece id; a piece without an entry stays where the layout put it. */
export type Placements = Readonly<Record<string, Placement>>;

/** The piece stays where the layout put it. */
export const IDENTITY_PLACEMENT: Placement = { offsetMm: { x: 0, y: 0 }, rotationDeg: 0 };

/** What the piece handling of the projector holds. */
export interface PlacementState {
  /** Which pieces are drawn: "all", or the id of one piece. */
  readonly selection: string;
  /** The piece the arrow keys move, or null (then they pan the view). Never stored. */
  readonly activePieceId: string | null;
  /** Where pieces were moved to. */
  readonly placements: Placements;
}

/** The part of a scene piece the placement needs: its cut box on the sheet. */
export interface PlacedPiece {
  readonly cell: Point;
  readonly bboxMm: { readonly widthMm: number; readonly heightMm: number };
}

/** Everything in place, every piece shown, nothing active. */
export const INITIAL_PLACEMENT_STATE: PlacementState = {
  selection: "all",
  activePieceId: null,
  placements: {},
};

/**
 * The state before anything was moved.
 *
 * @returns Identity placements, all pieces shown.
 */
export function resetPlacements(): PlacementState {
  return INITIAL_PLACEMENT_STATE;
}

/**
 * Turns a placement by half a turn: 0 becomes 180 and 180 becomes 0. No other turn exists.
 *
 * @param p - The placement.
 * @returns The placement turned.
 */
export function rotate180(p: Placement): Placement {
  return { ...p, rotationDeg: p.rotationDeg === 0 ? HALF_TURN_DEG : 0 };
}

/**
 * Turns one piece by 180 degrees.
 *
 * @param state - The state.
 * @param pieceId - The piece.
 * @returns The new state.
 */
export function rotatePiece(state: PlacementState, pieceId: string): PlacementState {
  const current = state.placements[pieceId] ?? IDENTITY_PLACEMENT;
  return { ...state, placements: { ...state.placements, [pieceId]: rotate180(current) } };
}

/**
 * Moves one piece by a move seen on the screen. The size of the piece never changes.
 *
 * @param state - The state.
 * @param pieceId - The piece.
 * @param screenDeltaMm - Move on the screen, right and down positive.
 * @param mirror - Whether the pattern is mirrored.
 * @returns The new state.
 */
export function movePiece(
  state: PlacementState,
  pieceId: string,
  screenDeltaMm: Point,
  mirror: boolean,
): PlacementState {
  const d = screenDeltaToSceneMm(screenDeltaMm, mirror);
  const current = state.placements[pieceId] ?? IDENTITY_PLACEMENT;
  const moved: Placement = {
    ...current,
    offsetMm: { x: current.offsetMm.x + d.x, y: current.offsetMm.y + d.y },
  };
  return { ...state, placements: { ...state.placements, [pieceId]: moved } };
}

/**
 * The pieces to draw.
 *
 * @param scene - The scene.
 * @param selection - "all" or a piece id.
 * @returns "all", or the one id when the scene has that piece (otherwise "all").
 */
export function visiblePieceIds(scene: PatternScene, selection: string): readonly string[] | "all" {
  return selection !== "all" && scene.pieces.some((p) => p.id === selection) ? [selection] : "all";
}

/**
 * Drops what no longer exists in the scene (the engine changed since it was stored).
 *
 * @param state - The state.
 * @param scene - The scene.
 * @returns The state with only known pieces.
 */
export function pruneToScene(state: PlacementState, scene: PatternScene): PlacementState {
  const known = new Set(scene.pieces.map((p) => p.id));
  const placements = Object.fromEntries(Object.entries(state.placements).filter(([id]) => known.has(id)));
  return {
    selection: state.selection === "all" || known.has(state.selection) ? state.selection : "all",
    activePieceId:
      state.activePieceId !== null && known.has(state.activePieceId) ? state.activePieceId : null,
    placements,
  };
}

/**
 * The piece after or before another, wrapping around.
 *
 * @param scene - The scene.
 * @param current - The piece now, or null to start from the first (next) or last (previous).
 * @param step - 1 for next, -1 for previous.
 * @returns The piece id, or null for a scene without pieces.
 */
export function nextPieceId(scene: PatternScene, current: string | null, step: 1 | -1): string | null {
  const n = scene.pieces.length;
  if (n === 0) return null;
  const i = scene.pieces.findIndex((p) => p.id === current);
  const start = step === 1 ? 0 : n - 1;
  const next = i === -1 ? start : (i + step + n) % n;
  return scene.pieces[next]?.id ?? null;
}

/**
 * The view pan (screen mm) that puts the centre of a placed piece at the centre of the screen.
 *
 * @param scene - The scene.
 * @param placements - Where pieces were moved to.
 * @param pieceId - The piece.
 * @param mirror - Whether the pattern is mirrored.
 * @returns The pan, or zero for an unknown piece.
 */
export function centreOnPiece(
  scene: PatternScene,
  placements: Placements,
  pieceId: string,
  mirror: boolean,
): Point {
  const piece = scene.pieces.find((p) => p.id === pieceId);
  if (!piece) return { x: 0, y: 0 };
  const offset = (placements[pieceId] ?? IDENTITY_PLACEMENT).offsetMm;
  const cx = piece.cell.x + offset.x + piece.bboxMm.widthMm / 2 - scene.widthMm / 2;
  const cy = piece.cell.y + offset.y + piece.bboxMm.heightMm / 2 - scene.heightMm / 2;
  return { x: mirror ? cx : -cx, y: -cy };
}

/**
 * The SVG transform of one piece for its placement: a move, then a half turn about the centre of the cut box.
 *
 * @param piece - The piece with its box.
 * @param placement - Where it sits; the identity gives an empty string.
 * @returns The `transform` attribute value.
 */
export function placementTransform(piece: PlacedPiece, placement: Placement): string {
  const cx = piece.cell.x + piece.bboxMm.widthMm / 2;
  const cy = piece.cell.y + piece.bboxMm.heightMm / 2;
  const parts: string[] = [];
  if (placement.offsetMm.x !== 0 || placement.offsetMm.y !== 0) {
    parts.push(`translate(${placement.offsetMm.x} ${placement.offsetMm.y})`);
  }
  if (placement.rotationDeg !== 0) parts.push(`rotate(${placement.rotationDeg} ${cx} ${cy})`);
  return parts.join(" ");
}
