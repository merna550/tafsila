/** The viewer contract: props, state and handle shared by the pattern page and the panels around it (issue #243). */
import type { PatternScene, ScenePiece, SnapPoint, ViewerTarget } from "@tafsila/engine/viewer";

export type { PatternScene, ScenePiece, SnapPoint, ViewerTarget };

/** Which layers of the pattern are drawn. */
export interface ViewerLayers {
  /** Cut line, grain line and the piece hit area. */
  readonly cut: boolean;
  /** Stitch line and its edges. */
  readonly stitch: boolean;
  /** Notches, darts and grain line. */
  readonly notches: boolean;
  /** Piece names and cut instructions. */
  readonly labels: boolean;
  /** Background grid. */
  readonly grid: boolean;
}

/** The measure tool state: up to two snapped points. Inert until the measure tool (#253) arrives. */
export interface ViewerMeasure {
  /** Whether the tool is on. */
  readonly active: boolean;
  /** The picked points, zero to two. */
  readonly points: readonly SnapPoint[];
}

/** Props of the controlled viewer. Zoom and pan stay inside the viewer. */
export interface PatternViewerProps {
  /** What to draw. */
  readonly scene: PatternScene;
  /** Which layers to draw. */
  readonly layers: ViewerLayers;
  /** The selected piece, or null. */
  readonly selectedPieceId: string | null;
  /** Called on a tap or click on a piece (its id), on empty canvas or Escape (null). */
  readonly onSelectPiece: (id: string | null) => void;
  /** Pieces, edges or darts drawn in the highlight style. */
  readonly highlight: readonly ViewerTarget[];
  /** The measure tool state. */
  readonly measure: ViewerMeasure;
  /** Called when the measure tool changes its state. */
  readonly onMeasureChange: (measure: ViewerMeasure) => void;
  /** Extra classes for the outer element. */
  readonly className?: string;
}

/** What a parent can ask of the viewer through its ref. */
export interface PatternViewerHandle {
  /** Fits the whole sheet in view. */
  fit(): void;
  /** Frames the given pieces, edges or darts. */
  zoomTo(targets: readonly ViewerTarget[]): void;
}

/** A point or size in screen pixels. */
export interface PxPoint {
  /** Horizontal pixels. */
  readonly x: number;
  /** Vertical pixels. */
  readonly y: number;
}

/** Container size in pixels. */
export interface PxSize {
  /** Width in pixels. */
  readonly width: number;
  /** Height in pixels. */
  readonly height: number;
}

/** A rectangle on the sheet, in mm. */
export interface MmBox {
  /** Left. */
  readonly x: number;
  /** Top. */
  readonly y: number;
  /** Width. */
  readonly widthMm: number;
  /** Height. */
  readonly heightMm: number;
}

/** Zoom and pan: a sheet point (mm) lands at `mm * zoom + (tx, ty)` pixels. */
export interface Viewport {
  /** Pixels per mm. */
  readonly zoom: number;
  /** Horizontal shift in pixels. */
  readonly tx: number;
  /** Vertical shift in pixels. */
  readonly ty: number;
}
