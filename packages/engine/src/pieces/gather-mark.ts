/** The gather construction mark shared by the skirts (issue #137) and the sleeves (issue #142), decision 137. */
import type { Mark } from "@tafsila/schemas";
import type { Point } from "../geometry";

/**
 * A gather line along an edge, with the length it is gathered to in its words.
 *
 * @param edgeId - The gathered edge.
 * @param from - Start of the gathered run (piece coordinates).
 * @param to - End of the gathered run.
 * @param gatheredToMm - Length after gathering.
 * @returns The mark, id `gather-<edgeId>`.
 */
export function gatherLineMark(edgeId: string, from: Point, to: Point, gatheredToMm: number): Mark {
  const mm = Math.round(gatheredToMm);
  return {
    id: `gather-${edgeId}`,
    kind: "gather",
    shape: "line",
    edgeId,
    from,
    to,
    lengthMm: gatheredToMm,
    text: { ar: `جمّعي إلى ${mm} مم`, en: `Gather to ${mm} mm` },
  };
}
