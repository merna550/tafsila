/** Label file tests (issue #338): the sample labels CI runs on are valid, and a bad label is refused. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SAMPLE_LABELS_PATH } from "./cli";
import { parseLabels } from "./labels";

/** The sample file's text. */
const sample = readFileSync(SAMPLE_LABELS_PATH, "utf8");

describe("parseLabels", () => {
  it("parses the sample labels against designSpecSchema, sorted by id", () => {
    const labels = parseLabels(sample);
    expect(labels.map((label) => label.category)).toEqual(["dress", "skirt", "blouse"]);
    expect(labels[1]?.unsupported).toEqual(["asymmetric hem"]);
  });

  it("refuses a label with an invalid enum value", () => {
    const [first] = JSON.parse(sample) as [{ spec: { neckline: { front: string } } }];
    first.spec.neckline.front = "keyhole";
    expect(() => parseLabels(JSON.stringify([first]))).toThrow(/neckline/);
  });

  it("refuses a category that differs from the spec, and repeated ids", () => {
    const [first] = JSON.parse(sample) as [{ category: string }];
    expect(() => parseLabels(JSON.stringify([{ ...first, category: "skirt" }]))).toThrow(/category/);
    expect(() => parseLabels(JSON.stringify([first, first]))).toThrow(/unique/);
  });

  it("sorts by id whatever the file order", () => {
    const labels = JSON.parse(sample) as { id: string }[];
    expect(parseLabels(JSON.stringify(labels.toReversed())).map((label) => label.id)).toEqual([
      "sample-01",
      "sample-02",
      "sample-03",
    ]);
  });
});
