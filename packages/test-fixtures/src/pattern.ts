/** Shared PatternResult fixture for tests. */
import type { PatternResult, Point } from "@tafsila/schemas";

/** A rectangle's four corners, clockwise from the origin. */
const corners: Point[] = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 200, y: 300 },
  { x: 0, y: 300 },
];

/**
 * Builds a closed path of line segments through the given corners.
 *
 * @param points - Corners in order.
 * @returns The closed path.
 */
function rectanglePath(points: Point[]): PatternResult["pieces"][number]["stitchPath"] {
  return points.map((from, i) => ({
    kind: "line" as const,
    from,
    to: points[(i + 1) % points.length]!,
  }));
}

/** A 200 x 300 mm rectangle piece with one paired edge, a grain line, labels and a passing report. */
export const rectanglePattern: PatternResult = {
  engineVersion: "0.1.0",
  pieces: [
    {
      id: "front-panel",
      name: { ar: "الأمام", en: "Front" },
      cut: { quantity: 1, onFold: false, mirror: false, fabric: "main" },
      stitchPath: rectanglePath(corners),
      cutPath: rectanglePath([
        { x: -15, y: -15 },
        { x: 215, y: -15 },
        { x: 215, y: 315 },
        { x: -15, y: 315 },
      ]),
      edges: [
        {
          id: "side",
          fromSegment: 1,
          toSegment: 1,
          seamAllowanceMm: 15,
          pairsWith: { pieceId: "back-panel", edgeId: "side" },
        },
      ],
      notches: [{ id: "n1", edgeId: "side", atMm: 150 }],
      bodyLines: [],
      grainLine: [
        { x: 100, y: 50 },
        { x: 100, y: 250 },
      ],
      darts: [],
      labels: [
        {
          id: "l1",
          kind: "name",
          text: { ar: "الأمام", en: "Front" },
          at: { x: 100, y: 150 },
          rotationDeg: 0,
        },
      ],
      bbox: { widthMm: 200, heightMm: 300 },
    },
  ],
  sewingOrder: [
    { order: 1, action: "sew", edges: ["side"], text: { ar: "خيّطي الجنب", en: "Sew the side" } },
  ],
  validation: {
    status: "pass",
    checks: [{ id: "FR-VAL-01", status: "pass", message: { ar: "سليم", en: "OK" } }],
  },
  meta: { category: "skirt", sizeLabel: "M", createdFrom: "fixture" },
};
