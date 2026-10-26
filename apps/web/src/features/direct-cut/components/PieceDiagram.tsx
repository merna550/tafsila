/** The reference drawing of a piece: the cut line, the reference lines and the marked points with their labels. */
import type { ReactElement } from "react";
import type { CutPiecePlan } from "@/shared/pattern-preview";

/** Props of {@link PieceDiagram}. */
interface PieceDiagramProps {
  /** The piece to draw. */
  readonly piece: CutPiecePlan;
  /** Accessible name of the drawing. */
  readonly label: string;
}

/** Margin around the drawing, as a share of its longer side. */
const MARGIN_SHARE = 0.08;

/** Label size, as a share of the longer side. */
const LABEL_SHARE = 0.035;

/** Thinnest line, mm, and the share of the longer side a line is drawn at. */
const MIN_STROKE_MM = 0.6;
const STROKE_DIVISOR = 400;

/** The cut line is this many times thicker than the reference lines. */
const CUT_LINE_FACTOR = 1.5;

/** Dash and gap of a reference line, in line widths. */
const DASH = "6 4";

/** Point dot radius in line widths, and the label's offset from the point in label sizes. */
const DOT_RADIUS_FACTOR = 2.5;
const LABEL_DX = 0.5;
const LABEL_DY = -0.4;

/**
 * Draws the piece in its own millimetre frame. Geometry only comes from the plan; nothing is computed here.
 * The labels are Latin letters, so the drawing reads the same in both languages.
 *
 * @param props - The piece and the drawing's name.
 * @returns The SVG.
 */
export function PieceDiagram({ piece, label }: Readonly<PieceDiagramProps>): ReactElement {
  const { widthMm, heightMm, outlineD } = piece.diagram;
  const longest = Math.max(widthMm, heightMm);
  const margin = longest * MARGIN_SHARE;
  const fontSize = longest * LABEL_SHARE;
  const stroke = Math.max(longest / STROKE_DIVISOR, MIN_STROKE_MM);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-margin} ${-margin} ${widthMm + margin * 2} ${heightMm + margin * 2}`}
      className="h-auto max-h-96 w-full"
      data-testid="piece-diagram"
    >
      {piece.reference.lines.map((line) => (
        <line
          key={line.id}
          x1={line.from.x}
          y1={line.from.y}
          x2={line.to.x}
          y2={line.to.y}
          className="stroke-muted"
          strokeWidth={stroke}
          strokeDasharray={DASH.split(" ")
            .map((n) => Number(n) * stroke)
            .join(" ")}
        />
      ))}
      <path d={outlineD} className="fill-none stroke-primary" strokeWidth={stroke * CUT_LINE_FACTOR} />
      {piece.points.map((point) => (
        <g key={point.id}>
          <circle cx={point.at.x} cy={point.at.y} r={stroke * DOT_RADIUS_FACTOR} className="fill-primary" />
          <text
            x={point.at.x + fontSize * LABEL_DX}
            y={point.at.y + fontSize * LABEL_DY}
            fontSize={fontSize}
            className="fill-text"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
