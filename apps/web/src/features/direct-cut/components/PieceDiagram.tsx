/** The reference drawing of a piece: the cut line, the reference lines and the marked points with their labels. */
import type { ReactElement } from "react";
import type { CutPiecePlan, CutPlanGuide, CutPlanPoint } from "@/shared/pattern-preview";
import { formatCm, type DigitStyle } from "../model/format";
import type { Highlight } from "../model/steps";

/** Props of {@link PieceDiagram}. */
interface PieceDiagramProps {
  /** The piece to draw. */
  readonly piece: CutPiecePlan;
  /** Accessible name of the drawing. */
  readonly label: string;
  /** Points and guides to highlight; without it every point is drawn normally. */
  readonly highlight?: Highlight | null;
  /** The page language (picks the unit of the guide labels). */
  readonly locale: "ar" | "en";
  /** The digits to show in the guide labels. */
  readonly digits: DigitStyle;
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

/** The drawing never mirrors; React's SVG typings lack `dir`, so it is spread in as a plain attribute. */
const LTR = { dir: "ltr" };

/** A highlighted point is this many times bigger than a normal one. */
const CURRENT_DOT_FACTOR = 1.6;

/** Font weights of a point letter, normal and highlighted; the dash and gap of a guide in line widths. */
const WEIGHT_NORMAL = 400;
const WEIGHT_CURRENT = 700;
const GUIDE_DASH = 3;
const GUIDE_GAP = 2;

/** Props of {@link GuideMark}. */
interface GuideMarkProps {
  /** The segment. */
  readonly guide: CutPlanGuide;
  /** Label size. */
  readonly fontSize: number;
  /** Line width. */
  readonly stroke: number;
  /** The length label, already formatted. */
  readonly text: string;
}

/**
 * A dashed distance segment with its length written at the middle.
 *
 * @param props - The segment, sizes and label.
 * @returns The SVG group.
 */
function GuideMark({ guide, fontSize, stroke, text }: Readonly<GuideMarkProps>): ReactElement {
  return (
    <g data-guide="">
      <line
        x1={guide.from.x}
        y1={guide.from.y}
        x2={guide.to.x}
        y2={guide.to.y}
        className="stroke-accent"
        strokeWidth={stroke}
        strokeDasharray={`${stroke * GUIDE_DASH} ${stroke * GUIDE_GAP}`}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={(guide.from.x + guide.to.x) / 2}
        y={(guide.from.y + guide.to.y) / 2}
        fontSize={fontSize}
        textAnchor="middle"
        className="fill-accent"
      >
        {text}
      </text>
    </g>
  );
}

/** Props of {@link PointMark}. */
interface PointMarkProps {
  /** The point. */
  readonly point: CutPlanPoint;
  /** Label size. */
  readonly fontSize: number;
  /** Line width. */
  readonly stroke: number;
  /** True when the point belongs to the highlighted step. */
  readonly current: boolean;
  /** True when another step is highlighted. */
  readonly dimmed: boolean;
}

/**
 * A point dot with its letter; big and bold when current, faded when dimmed.
 *
 * @param props - The point, sizes and state.
 * @returns The SVG group.
 */
function PointMark({ point, fontSize, stroke, current, dimmed }: Readonly<PointMarkProps>): ReactElement {
  return (
    <g
      data-point-id={point.id}
      data-current={current ? "true" : undefined}
      data-dimmed={dimmed ? "true" : undefined}
      className={dimmed ? "opacity-40" : undefined}
    >
      <circle
        cx={point.at.x}
        cy={point.at.y}
        r={stroke * DOT_RADIUS_FACTOR * (current ? CURRENT_DOT_FACTOR : 1)}
        className="fill-primary"
      />
      <text
        x={point.at.x + fontSize * LABEL_DX}
        y={point.at.y + fontSize * LABEL_DY}
        fontSize={fontSize}
        fontWeight={current ? WEIGHT_CURRENT : WEIGHT_NORMAL}
        className="fill-text"
      >
        {point.label}
      </text>
    </g>
  );
}

/**
 * Draws the piece in its own millimetre frame. Geometry only comes from the plan; nothing is computed here.
 * The drawing never mirrors (it is `dir="ltr"`, like the pattern viewer). Point letters are Latin; only the guide
 * labels follow the language. With a highlight the chosen points are big and the rest dimmed (issue #292).
 *
 * @param props - The piece, the drawing's name, the highlight and the language.
 * @returns The SVG.
 */
export function PieceDiagram({
  piece,
  label,
  highlight = null,
  locale,
  digits,
}: Readonly<PieceDiagramProps>): ReactElement {
  const { widthMm, heightMm, outlineD } = piece.diagram;
  const longest = Math.max(widthMm, heightMm);
  const margin = longest * MARGIN_SHARE;
  const fontSize = longest * LABEL_SHARE;
  const stroke = Math.max(longest / STROKE_DIVISOR, MIN_STROKE_MM);
  const current = new Set(highlight?.pointIds ?? []);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-margin} ${-margin} ${widthMm + margin * 2} ${heightMm + margin * 2}`}
      {...LTR}
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
      {highlight?.guides.map((guide, index) => (
        <GuideMark
          key={index}
          guide={guide}
          fontSize={fontSize}
          stroke={stroke}
          text={formatCm(guide.mm, locale, digits)}
        />
      ))}
      {piece.points.map((point) => (
        <PointMark
          key={point.id}
          point={point}
          fontSize={fontSize}
          stroke={stroke}
          current={current.has(point.id)}
          dimmed={highlight !== null && !current.has(point.id)}
        />
      ))}
    </svg>
  );
}
