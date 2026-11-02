/** Tests for describing a difference in words (issue #345). */
import { describe, expect, it } from "vitest";
import { describeDifference, type DescribeWords } from "./describe-difference";

const WORDS: DescribeWords = { absent: "None", yes: "Yes", no: "No", cm: (v) => `${v} cm` };
const MESSAGES = {
  designPicker: {
    paths: { sleeve_length: "Sleeve length" },
    options: { sleeve_length: { short: "Short", long: "Long" }, pockets: { patch: "Patch pocket" } },
  },
  measurements: { labels: { waist: "Waist" } },
  patternOptions: { ease: { title: "Ease", profiles: { loose: "Loose" } } },
};

describe("describeDifference", () => {
  it("uses the picker's label and option names", () => {
    expect(
      describeDifference(
        { group: "feature", key: "sleeve_length", from: "short", to: "long" },
        MESSAGES,
        WORDS,
      ),
    ).toEqual({
      label: "Sleeve length",
      from: "Short",
      to: "Long",
    });
  });

  it("falls back to the raw key and value", () => {
    const text = describeDifference(
      { group: "feature", key: "mystery", from: "a", to: true },
      MESSAGES,
      WORDS,
    );
    expect(text).toEqual({ label: "mystery", from: "a", to: "Yes" });
  });

  it("writes measurements in cm, ease by name, missing parts as none and pockets as a list", () => {
    expect(
      describeDifference({ group: "measurement", key: "waist", from: 700, to: 725 }, MESSAGES, WORDS),
    ).toMatchObject({ to: "72.5 cm" });
    expect(
      describeDifference({ group: "ease", key: "ease", from: undefined, to: "loose" }, MESSAGES, WORDS),
    ).toEqual({
      label: "Ease",
      from: "None",
      to: "Loose",
    });
    expect(
      describeDifference({ group: "feature", key: "pockets", from: "", to: "patch,x" }, MESSAGES, WORDS).to,
    ).toBe("Patch pocket, x");
  });
});
