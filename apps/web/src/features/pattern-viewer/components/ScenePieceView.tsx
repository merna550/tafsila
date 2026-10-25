/** One piece of the scene as SVG, in sheet mm, with the layers switched on (issue #243). */
import type { CSSProperties, ReactElement } from "react";
import { isPartTargeted, isPieceTargeted } from "../model/scene-selectors";
import type { ScenePiece, ViewerLayers, ViewerTarget } from "../model/types";

/** Keeps a line the same thickness on screen at any zoom, so thin lines stay thin when zoomed in. */
const SCREEN_STROKE: CSSProperties = { vectorEffect: "non-scaling-stroke" };
/** Dash and gap of the stitch line, in screen pixels. */
const STITCH_DASH_PX = "6 4";
/** Width of the invisible band around an edge that catches a tap, in screen pixels. */
const EDGE_HIT_PX = 14;
/** Width of a highlighted edge, in screen pixels. */
const EDGE_HIGHLIGHT_PX = 4;
/** Width of a highlighted dart or piece outline, in screen pixels. */
const OUTLINE_HIGHLIGHT_PX = 3;
/** Width of the cut line, in screen pixels. */
const CUT_LINE_PX = 1.5;

/** Props of {@link ScenePieceView}. */
interface ScenePieceViewProps {
  /** The piece. */
  readonly piece: ScenePiece;
  /** Layers shown. */
  readonly layers: ViewerLayers;
  /** Whether the piece is selected. */
  readonly selected: boolean;
  /** Highlighted targets of the whole scene. */
  readonly highlight: readonly ViewerTarget[];
}

/**
 * The stitch line with one path per edge: invisible and wide to catch a tap, drawn in the highlight style when asked.
 *
 * @param props - Component props.
 * @param props.piece - The piece.
 * @param props.highlight - Highlighted targets.
 * @returns The stitch layer.
 */
function StitchLayer({
  piece,
  highlight,
}: Readonly<Pick<ScenePieceViewProps, "piece" | "highlight">>): ReactElement {
  return (
    <g data-layer="stitch">
      <path
        d={piece.stitchD}
        fill="none"
        strokeWidth={1}
        strokeDasharray={STITCH_DASH_PX}
        className="stroke-text"
        style={SCREEN_STROKE}
      />
      {piece.edges.map((edge) => {
        const lit = isPartTargeted(highlight, piece.id, { edgeId: edge.id });
        return (
          <path
            key={edge.id}
            d={edge.d}
            data-edge-id={edge.id}
            data-highlighted={lit || undefined}
            fill="none"
            strokeWidth={lit ? EDGE_HIGHLIGHT_PX : EDGE_HIT_PX}
            strokeLinecap="round"
            className={lit ? "stroke-accent" : "stroke-transparent"}
            style={SCREEN_STROKE}
          />
        );
      })}
    </g>
  );
}

/**
 * Notches, darts and the grain line.
 *
 * @param props - Component props.
 * @param props.piece - The piece.
 * @param props.highlight - Highlighted targets.
 * @returns The marks layer.
 */
function MarksLayer({
  piece,
  highlight,
}: Readonly<Pick<ScenePieceViewProps, "piece" | "highlight">>): ReactElement {
  return (
    <g data-layer="notches" fill="none" className="stroke-text">
      <path d={piece.grainD} strokeWidth={1} style={SCREEN_STROKE} />
      {piece.notches.map((n) => (
        <path key={n.id} d={n.d} data-notch-id={n.id} strokeWidth={1.5} style={SCREEN_STROKE} />
      ))}
      {piece.darts.map((dart) => {
        const lit = isPartTargeted(highlight, piece.id, { dartId: dart.id });
        return (
          <path
            key={dart.id}
            d={dart.d}
            data-dart-id={dart.id}
            data-highlighted={lit || undefined}
            strokeWidth={lit ? OUTLINE_HIGHLIGHT_PX : 1}
            className={lit ? "stroke-accent" : undefined}
            style={SCREEN_STROKE}
          />
        );
      })}
    </g>
  );
}

/**
 * Piece names and cut instructions, in Arabic and right to left as the engine prints them.
 *
 * @param props - Component props.
 * @param props.piece - The piece.
 * @returns The labels layer.
 */
function LabelsLayer({ piece }: Readonly<Pick<ScenePieceViewProps, "piece">>): ReactElement {
  return (
    <g data-layer="labels" className="pointer-events-none fill-text font-sans" textAnchor="middle">
      {piece.labels.map((label) => (
        <text
          key={label.id}
          x={label.at.x}
          y={label.at.y}
          fontSize={label.sizeMm}
          direction="rtl"
          unicodeBidi="plaintext"
          transform={
            label.rotationDeg === 0 ? undefined : `rotate(${label.rotationDeg} ${label.at.x} ${label.at.y})`
          }
        >
          {label.text.ar}
        </text>
      ))}
    </g>
  );
}

/**
 * Draws one piece: a hit area, then the layers that are on.
 *
 * @param props - Component props.
 * @returns The piece group, carrying `data-piece-id` and, when set, `data-selected` and `data-highlighted`.
 */
export function ScenePieceView({
  piece,
  layers,
  selected,
  highlight,
}: Readonly<ScenePieceViewProps>): ReactElement {
  const lit = isPieceTargeted(highlight, piece.id);
  return (
    <g data-piece-id={piece.id} data-selected={selected || undefined} data-highlighted={lit || undefined}>
      <path
        d={piece.cutD}
        className={selected ? "fill-primary-soft stroke-none" : "fill-transparent stroke-none"}
      />
      {layers.cut ? (
        <g data-layer="cut">
          <path
            d={piece.cutD}
            fill="none"
            strokeWidth={lit ? OUTLINE_HIGHLIGHT_PX : CUT_LINE_PX}
            className={lit ? "stroke-accent" : "stroke-primary"}
            style={SCREEN_STROKE}
          />
        </g>
      ) : null}
      {layers.stitch ? <StitchLayer piece={piece} highlight={highlight} /> : null}
      {layers.notches ? <MarksLayer piece={piece} highlight={highlight} /> : null}
      {layers.labels ? <LabelsLayer piece={piece} /> : null}
    </g>
  );
}
