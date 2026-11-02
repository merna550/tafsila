/** Component tests for the compare overlay, legend and difference list (issue #345). */
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { VersionDifference } from "../model/diff-versions";
import type { MatchedPiece, ScenePiece } from "../model/match-pieces";
import { CompareLegend } from "./CompareLegend";
import { CompareOverlay } from "./CompareOverlay";
import { DifferenceList } from "./DifferenceList";

const noop = (): void => undefined;

/**
 * Builds a matched piece with minimal geometry.
 *
 * @param id - Piece id.
 * @param status - How it compares.
 * @returns The matched piece.
 */
function matched(id: string, status: MatchedPiece["status"]): MatchedPiece {
  const piece = {
    id,
    name: { ar: `${id}-ar`, en: `${id}-en` },
    cell: { x: 0, y: 0 },
    bboxMm: { widthMm: 10, heightMm: 10 },
    cutD: "M0 0",
  } as unknown as ScenePiece;
  return {
    id,
    name: piece.name,
    status,
    a: status === "added" ? undefined : piece,
    b: status === "removed" ? undefined : piece,
    shift: { x: 0, y: 0 },
  };
}

describe("CompareOverlay", () => {
  const pieces = [matched("sleeve", "changed"), matched("pocket", "added"), matched("cuff", "removed")];
  const draw = (showA: boolean, showB: boolean): string =>
    renderWithIntl(<CompareOverlay pieces={pieces} showA={showA} showB={showB} zoom={1} label="x" />, "en");

  it("draws both sides, and uses the added and removed colours", () => {
    const out = draw(true, true);
    expect(out).toContain('data-side="a"');
    expect(out).toContain('data-side="b"');
    expect(out).toContain("stroke-success");
    expect(out).toContain("stroke-danger");
  });

  it("draws only the first side or only the second", () => {
    expect(draw(true, false)).not.toContain('data-side="b"');
    expect(draw(false, true)).not.toContain('data-side="a"');
  });
});

describe("CompareLegend", () => {
  it("names both versions with their dates", () => {
    const out = renderWithIntl(
      <CompareLegend
        a={{ versionNo: 2, date: "Oct 1", shown: true, onChange: noop }}
        b={{ versionNo: 3, date: "Oct 5", shown: true, onChange: noop }}
      />,
      "en",
    );
    expect(out).toContain("Version 2");
    expect(out).toContain("Version 3");
    expect(out).toContain("Oct 5");
  });
});

describe("DifferenceList", () => {
  const sleeve: VersionDifference = { group: "feature", key: "sleeve_length", from: "short", to: "long" };

  it("lists a difference in the picker's words", () => {
    const out = renderWithIntl(
      <DifferenceList differences={[sleeve]} pieces={[]} engineDiffers={false} />,
      "en",
    );
    expect(out).toContain("Sleeve length");
    expect(out).toContain("Short");
    expect(out).toContain("Long");
    expect(out).not.toContain("engine-differs");
  });

  it("falls back to the raw value, and shows measurements in cm and ease by name", () => {
    const out = renderWithIntl(
      <DifferenceList
        differences={[
          { group: "feature", key: "sleeve_length", from: "mystery", to: "long" },
          { group: "measurement", key: "waist", from: 700, to: 725 },
          { group: "ease", key: "ease", from: "regular", to: "loose" },
        ]}
        pieces={[]}
        engineDiffers={false}
      />,
      "en",
    );
    expect(out).toContain("mystery");
    expect(out).toContain("72.5 cm");
    expect(out).toContain("Loose");
  });

  it("lists added and removed pieces and the engine note, in Arabic too", () => {
    const pieces = [matched("pocket", "added"), matched("cuff", "removed")];
    const out = renderWithIntl(<DifferenceList differences={[]} pieces={pieces} engineDiffers />, "ar");
    expect(out).toContain("pocket-ar");
    expect(out).toContain("cuff-ar");
    expect(out).toContain("engine-differs");
  });

  it("says nothing differs", () => {
    const out = renderWithIntl(<DifferenceList differences={[]} pieces={[]} engineDiffers={false} />, "en");
    expect(out).toContain("No difference");
  });
});
