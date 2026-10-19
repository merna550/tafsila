/** Where a design's closure opens (issue #143): blocks and modules read it to cut a centre line as a seam or a fold. */
import type { DesignSpec } from "@tafsila/schemas";

/**
 * Whether the closure opens at a position. `none` opens nowhere, whatever its position says (decision 143, 1).
 *
 * @param closure - The design's closure.
 * @param position - The position asked about.
 * @returns True for a zip or buttons at that position.
 * @example
 * closureOpensAt({ type: "none", position: "center-back" }, "center-back") // false
 */
export function closureOpensAt(
  closure: DesignSpec["closure"],
  position: DesignSpec["closure"]["position"],
): boolean {
  return closure.type !== "none" && closure.position === position;
}
