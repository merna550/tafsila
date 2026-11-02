/** The drawing of the overlay: both versions' pieces in one SVG, the first solid and the second dashed (issue #345). */
import type { ReactElement } from "react";
import { overlayBox, type MatchedPiece } from "../model/match-pieces";

/** Space kept around the pieces, in mm. */
const MARGIN_MM = 40;

/** Props of {@link CompareOverlay}. */
interface CompareOverlayProps {
  /** The matched pieces. */
  readonly pieces: readonly MatchedPiece[];
  /** Whether the first version is drawn. */
  readonly showA: boolean;
  /** Whether the second version is drawn. */
  readonly showB: boolean;
  /** Zoom factor; 1 fits the width. */
  readonly zoom: number;
  /** Accessible name of the drawing. */
  readonly label: string;
}

/**
 * Draws the cut lines of both versions in the same coordinates. A piece only in the first version is red, a piece only
 * in the second is green; the rest uses the two version colours. Lines keep their width at any zoom.
 *
 * @param props - Pieces, which sides to draw, zoom and label.
 * @returns The `<svg>`.
 */
export function CompareOverlay({
  pieces,
  showA,
  showB,
  zoom,
  label,
}: Readonly<CompareOverlayProps>): ReactElement {
  const box = overlayBox(pieces, MARGIN_MM);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      style={{ width: `${zoom * 100}%`, aspectRatio: `${box.width} / ${box.height}` }}
      className="block select-none"
      data-testid="compare-overlay"
    >
      {pieces.map((m) => (
        <g key={m.id} data-piece={m.id} data-status={m.status}>
          {showA && m.a ? (
            <path
              d={m.a.cutD}
              fill="none"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              className={m.status === "removed" ? "stroke-danger" : "stroke-primary"}
              data-side="a"
            />
          ) : null}
          {showB && m.b ? (
            <path
              d={m.b.cutD}
              transform={`translate(${m.shift.x} ${m.shift.y})`}
              fill="none"
              strokeWidth={2}
              strokeDasharray="8 5"
              vectorEffect="non-scaling-stroke"
              className={m.status === "added" ? "stroke-success" : "stroke-accent"}
              data-side="b"
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
