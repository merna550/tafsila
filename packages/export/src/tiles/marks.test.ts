/** Unit tests of alignment marks (issue #283). */
import { describe, expect, it } from "vitest";
import { alignmentMarks } from "./marks";

const WINDOW = { minX: 0, minY: 0, maxX: 190, maxY: 277 };
const ALL = () => true;

describe("alignmentMarks", () => {
  it("a corner tile of a 2 x 2 A4 grid has marks 10 mm inside its right and bottom edges", () => {
    const marks = alignmentMarks(
      { col: 0, row: 0, window: WINDOW },
      { cols: 2, rows: 2, overlapMm: 10, isPrinted: ALL },
    );
    expect(marks.map((m) => [m.side, m.neighbour])).toEqual([
      ["right", "B1"],
      ["bottom", "A2"],
    ]);
    expect(marks[0]!.from.x).toBe(180);
    expect(marks[1]!.from.y).toBe(267);
  });

  it("marks the left and top sides of the opposite corner", () => {
    const marks = alignmentMarks(
      { col: 1, row: 1, window: WINDOW },
      { cols: 2, rows: 2, overlapMm: 10, isPrinted: ALL },
    );
    expect(marks.map((m) => [m.side, m.neighbour, m.from.x, m.from.y])).toEqual([
      ["left", "A2", 10, 0],
      ["top", "B1", 0, 10],
    ]);
  });

  it("A0 marks sit on the window edges", () => {
    const marks = alignmentMarks(
      { col: 0, row: 0, window: WINDOW },
      { cols: 2, rows: 2, overlapMm: 0, isPrinted: ALL },
    );
    expect(marks.map((m) => m.from.x === 190 || m.from.y === 277)).toEqual([true, true]);
  });

  it("skips neighbours that are not printed", () => {
    expect(
      alignmentMarks(
        { col: 0, row: 0, window: WINDOW },
        { cols: 2, rows: 2, overlapMm: 10, isPrinted: () => false },
      ),
    ).toEqual([]);
  });
});
