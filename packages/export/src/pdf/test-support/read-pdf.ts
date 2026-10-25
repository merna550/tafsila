/* eslint-disable no-magic-numbers -- PDF operator operand positions (c has 6 operands, re has 4) */
/** Test helper: reads page sizes and marked drawing back from a PDF without a full parser (decision 282; reused by #288, #290). */
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";

/** A point or size in PDF points. */
export interface PtRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A PDF transformation matrix `[a b c d e f]`. */
type Matrix = readonly [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/**
 * Page sizes in points, in page order.
 *
 * @param bytes - PDF file bytes.
 * @returns Width and height of each page in points.
 */
export async function pageSizes(bytes: Uint8Array): Promise<{ width: number; height: number }[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => p.getSize());
}

/**
 * Decoded content stream of one page, as text.
 *
 * @param bytes - PDF file bytes.
 * @param pageIndex - Zero-based page index.
 * @returns The content stream text.
 */
export async function pageContent(bytes: Uint8Array, pageIndex = 0): Promise<string> {
  const doc = await PDFDocument.load(bytes);
  const contents = doc.getPages()[pageIndex]!.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  return refs
    .map((ref) => {
      const stream = doc.context.lookup(ref);
      return stream instanceof PDFRawStream
        ? Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1")
        : "";
    })
    .join("\n");
}

/**
 * The operator lines between `/<tag> BMC` and its `EMC`, for every block with that tag.
 *
 * @param content - Decoded content stream.
 * @param tag - Marked-content tag name.
 * @returns The operator text of each tagged block.
 */
function markedBlocks(content: string, tag: string): string[] {
  const re = new RegExp(`/${tag} BMC([\\s\\S]*?)\\nEMC`, "g");
  return [...content.matchAll(re)].map((m) => m[1]!);
}

/**
 * Multiplies two PDF matrices (`m` applied first, then `by`).
 *
 * @param m - A matrix or transform.
 * @param by - The matrix applied second.
 * @returns The combined matrix.
 */
function multiply(m: Matrix, by: Matrix): Matrix {
  const [a, b, c, d, e, f] = m;
  const [a2, b2, c2, d2, e2, f2] = by;
  return [
    a * a2 + b * c2,
    a * b2 + b * d2,
    c * a2 + d * c2,
    c * b2 + d * d2,
    e * a2 + f * c2 + e2,
    e * b2 + f * d2 + f2,
  ];
}

/**
 * Applies a matrix to a point.
 *
 * @param m - A matrix or transform.
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @returns The transformed point.
 */
function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/** Graphics state while walking a content stream. */
interface Walk {
  ctm: Matrix;
  readonly stack: Matrix[];
  readonly points: [number, number][];
}

/**
 * The four corners of a rectangle operator.
 *
 * @param x - Left.
 * @param y - Bottom.
 * @param w - Width.
 * @param h - Height.
 * @returns The corners.
 */
const corners = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

/**
 * Applies one operator line to the walk state: q, Q, cm and the path operators that add points.
 *
 * @param walk - The state, changed in place.
 * @param line - One operator line such as `1 0 0 1 5 5 cm`.
 */
function step(walk: Walk, line: string): void {
  const t = line.trim().split(/\s+/);
  const op = t.at(-1);
  const n = t.slice(0, -1).map(Number);
  /**
   * Operand `k` as a number, 0 when missing.
   *
   * @param k - Operand index.
   * @returns The operand value.
   */
  const at = (k: number): number => n[k] ?? 0;
  if (op === "q") walk.stack.push(walk.ctm);
  else if (op === "Q") walk.ctm = walk.stack.pop() ?? IDENTITY;
  else if (op === "cm") walk.ctm = multiply(n as unknown as Matrix, walk.ctm);
  else if (op === "m" || op === "l") walk.points.push(apply(walk.ctm, at(0), at(1)));
  else if (op === "c") walk.points.push(apply(walk.ctm, at(4), at(5)));
  else if (op === "re")
    for (const [px, py] of corners(at(0), at(1), at(2), at(3))) walk.points.push(apply(walk.ctm, px, py));
}

/**
 * Points (path vertices and rectangle corners) drawn in the tagged blocks, in page points. Handles q, Q and cm.
 *
 * @param bytes - PDF file bytes.
 * @param tag - Marked-content tag name.
 * @param pageIndex - Zero-based page index.
 * @returns The points in page points.
 */
export async function markedPoints(
  bytes: Uint8Array,
  tag: string,
  pageIndex = 0,
): Promise<[number, number][]> {
  const content = await pageContent(bytes, pageIndex);
  const points: [number, number][] = [];
  for (const block of markedBlocks(content, tag)) {
    const walk: Walk = { ctm: IDENTITY, stack: [], points };
    for (const line of block.split("\n")) step(walk, line);
  }
  return points;
}

/**
 * Bounding box in points of everything drawn in the tagged blocks.
 *
 * @param bytes - PDF file bytes.
 * @param tag - Marked-content tag name.
 * @param pageIndex - Zero-based page index.
 * @returns The bounding box in points.
 */
export async function markedBounds(bytes: Uint8Array, tag: string, pageIndex = 0): Promise<PtRect> {
  const pts = await markedPoints(bytes, tag, pageIndex);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/**
 * The rectangles of the tagged blocks (which must hold only `re` operators), in page points.
 *
 * @param bytes - PDF file bytes.
 * @param tag - Marked-content tag name.
 * @param pageIndex - Zero-based page index.
 * @returns One rectangle per tagged `re`.
 */
export async function markedRects(bytes: Uint8Array, tag: string, pageIndex = 0): Promise<PtRect[]> {
  const pts = await markedPoints(bytes, tag, pageIndex);
  const rects: PtRect[] = [];
  for (let i = 0; i + 3 < pts.length; i += 4) {
    const quad = pts.slice(i, i + 4);
    const xs = quad.map((p) => p[0]);
    const ys = quad.map((p) => p[1]);
    rects.push({
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    });
  }
  return rects;
}
