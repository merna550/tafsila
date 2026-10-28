/** The two modes of the projector: the pattern pieces, or the marker of a fabric layout (issue #321, FR-FAB-04). Pure: scene conversion, pan limits and the piece controller of a marker. */
import type { PatternScene, ScenePiece } from "@tafsila/engine/viewer";
import type { Point } from "@tafsila/schemas";
import type { FabricKind, MarkerScene } from "@/shared/fabric-nesting";
import type { PiecesController } from "./controllers";

/** The fabric kinds a layout can be projected for, in the order the calculator lists them. */
export const LAYOUT_KINDS: readonly FabricKind[] = ["main", "lining", "interfacing"];

/** Query parameter of the projector route that switches to layout mode. */
export const LAYOUT_PARAM = "layout";

/** Space kept past either end of the marker when panning, in mm. */
const EDGE_MARGIN_MM = 20;

/** Text height of a piece name on the projected marker, in mm. */
const LABEL_SIZE_MM = 34;

/** A fold or selvedge line drawn with the scene. */
export interface SceneLine {
  /** Which line it is. */
  readonly kind: "fold" | "selvedge";
  /** Path data in mm. */
  readonly d: string;
}

/** What the projector canvas draws: a pattern scene, optionally with the fold and selvedge lines of a marker. */
export type ProjectorSceneData = PatternScene & { readonly lines?: readonly SceneLine[] };

/**
 * Reads the `layout` query value.
 *
 * @param value - The raw query value.
 * @returns The fabric kind, or null for pattern mode (missing or unknown value).
 */
export function parseLayoutKind(value: string | readonly string[] | undefined): FabricKind | null {
  const first = typeof value === "string" ? value : value?.[0];
  return LAYOUT_KINDS.find((kind) => kind === first) ?? null;
}

/**
 * The query string that keeps layout mode across the calibration page.
 *
 * @param kind - The fabric kind, or undefined in pattern mode.
 * @returns `?layout=<kind>`, or an empty string.
 */
export function layoutQuery(kind: FabricKind | undefined | null): string {
  return kind ? `?${LAYOUT_PARAM}=${kind}` : "";
}

/**
 * The projector route of a version in layout mode.
 *
 * @param designId - Design id.
 * @param versionId - Version id.
 * @param kind - The fabric kind to project.
 * @returns The path, without the locale.
 */
export function layoutHref(designId: string, versionId: string, kind: FabricKind): string {
  return `/designs/${designId}/versions/${versionId}/projector${layoutQuery(kind)}`;
}

/**
 * Turns a marker scene into the shape the projector canvas draws: placed outlines and grain lines are pieces, the strip is the sheet.
 *
 * @param marker - The marker scene of one fabric kind.
 * @returns The scene with its fold and selvedge lines.
 */
export function markerToScene(marker: MarkerScene): ProjectorSceneData {
  const pieces: ScenePiece[] = marker.pieces.map((piece) => ({
    id: piece.shapeId,
    name: piece.name,
    cut: { quantity: 1, onFold: false, mirror: false, fabric: marker.kind },
    bboxMm: { widthMm: 0, heightMm: 0 },
    cell: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    cutD: piece.cutD,
    stitchD: "",
    grainD: piece.grainD,
    edges: [],
    notches: [],
    darts: [],
    labels: [
      {
        id: `${piece.shapeId}-name`,
        text: piece.name,
        at: piece.labelAt,
        rotationDeg: 0,
        sizeMm: LABEL_SIZE_MM,
      },
    ],
    snapPoints: [],
  }));
  return { widthMm: marker.widthMm, heightMm: marker.heightMm, pieces, lines: marker.lines };
}

/**
 * Half the distance the marker can move along one axis: zero when it fits the screen, else what brings either end to the middle edge.
 *
 * @param sheetMm - Marker size on this axis.
 * @param viewportMm - Screen size on this axis.
 * @returns The limit in mm, margin included.
 */
function panLimit(sheetMm: number, viewportMm: number): number {
  return Math.max(0, (sheetMm - viewportMm) / 2) + EDGE_MARGIN_MM;
}

/**
 * Keeps the pan inside the marker: both ends can be reached, nothing further.
 *
 * @param pan - Wanted pan in screen mm.
 * @param sheet - Marker size in mm.
 * @param sheet.widthMm - Length along the selvedge.
 * @param sheet.heightMm - Width across the fabric.
 * @param viewportMm - Screen size in mm.
 * @returns The pan inside the limits.
 */
export function clampPan(
  pan: Point,
  sheet: { readonly widthMm: number; readonly heightMm: number },
  viewportMm: Point,
): Point {
  const lx = panLimit(sheet.widthMm, viewportMm.x);
  const ly = panLimit(sheet.heightMm, viewportMm.y);
  return { x: Math.min(lx, Math.max(-lx, pan.x)), y: Math.min(ly, Math.max(-ly, pan.y)) };
}

/**
 * The pan that puts the start of the strip (and the fold) at the top-start corner of the screen.
 *
 * @param sheet - Marker size in mm.
 * @param sheet.widthMm - Length along the selvedge.
 * @param sheet.heightMm - Width across the fabric.
 * @param viewportMm - Screen size in mm.
 * @returns The pan in screen mm.
 */
export function startPan(
  sheet: { readonly widthMm: number; readonly heightMm: number },
  viewportMm: Point,
): Point {
  return { x: panLimit(sheet.widthMm, viewportMm.x), y: panLimit(sheet.heightMm, viewportMm.y) };
}

/**
 * Makes a piece controller that cannot select, move or turn pieces: the whole marker is one scene and its grain is fixed (ADR-312 item 9).
 * Arrow keys then always pan; reset returns to the start of the strip.
 *
 * @param base - The controller of the shared piece hook.
 * @param reset - Puts the view back at the start of the strip.
 * @returns The controller for layout mode.
 */
export function layoutPieces(base: PiecesController, reset: () => void): PiecesController {
  /**
   * Does nothing: a marker has no pieces to choose, move or turn.
   *
   * @returns Nothing.
   */
  const nothing = (): void => undefined;
  return {
    ...base,
    visible: "all",
    choose: nothing,
    showAll: nothing,
    step: nothing,
    activate: nothing,
    move: nothing,
    moveActive: () => false,
    rotateActive: () => false,
    reset,
  };
}
