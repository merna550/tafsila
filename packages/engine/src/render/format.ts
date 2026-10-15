/** Text helpers for the SVG renderer: one number format, XML escaping and path data (NFR-08). */
import type { Point, Segment } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";

/** Decimal places written for every coordinate, so equal geometry gives equal text. */
export const SVG_DECIMALS = 2;

/**
 * Formats a number with a fixed 2 decimals; `-0.00` is written as `0.00`.
 *
 * @param value - A finite number.
 * @returns The text, for example `12.50`.
 * @throws {DraftingError} RENDER_NON_FINITE when the value is NaN or infinite.
 */
export function fmt(value: number): string {
  if (!Number.isFinite(value)) {
    throw new DraftingError("RENDER_NON_FINITE", `Cannot write ${value} into an SVG`);
  }
  const text = value.toFixed(SVG_DECIMALS);
  return Number(text) === 0 ? (0).toFixed(SVG_DECIMALS) : text;
}

/**
 * Formats a point as `x y`.
 *
 * @param p - The point in mm.
 * @returns The text.
 */
export function fmtPoint(p: Point): string {
  return `${fmt(p.x)} ${fmt(p.y)}`;
}

/** Characters that must be escaped in XML text and attribute values. */
const XML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/**
 * Escapes text for use in XML text nodes and attribute values.
 *
 * @param text - Raw text.
 * @returns Safe text.
 */
export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]!);
}

/**
 * Writes one segment as an SVG path command (cubics stay cubics, nothing is sampled).
 *
 * @param seg - The segment.
 * @returns `L x y` or `C x1 y1 x2 y2 x y`.
 */
function segmentCommand(seg: Segment): string {
  if (seg.kind === "line") return `L ${fmtPoint(seg.to)}`;
  return `C ${fmtPoint(seg.c1)} ${fmtPoint(seg.c2)} ${fmtPoint(seg.to)}`;
}

/**
 * Path data for a path, optionally closed with `Z`.
 *
 * @param segments - The segments, already in sheet coordinates.
 * @param closed - Whether to close the path.
 * @returns The `d` attribute value.
 */
export function pathData(segments: readonly Segment[], closed: boolean): string {
  const first = segments[0];
  if (!first) return "";
  const commands = [`M ${fmtPoint(first.from)}`, ...segments.map(segmentCommand)];
  return (closed ? [...commands, "Z"] : commands).join(" ");
}
