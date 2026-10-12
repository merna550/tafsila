import type { Client, MeasurementSet } from "@tafsila/schemas";
import { sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { initialOf, toClientProfileView, toClientRow, toMeasurementSetView } from "./client-view";

const NOW = new Date("2026-10-12T12:00:00.000Z");
const DAY = 86_400_000;

/**
 * A client with the given summary.
 *
 * @param summary - Summary fields to override.
 * @param name - Client name.
 * @returns A client.
 */
function client(summary: Partial<Client["summary"]> = {}, name = "سلمى عادل"): Client {
  return {
    id: "00000000-0000-4000-8000-0000000000a1",
    name,
    notes: null,
    createdAt: "2026-03-05T10:00:00.000Z",
    summary: { measurementSetCount: 0, latestSizeLabel: null, lastMeasurementAt: null, ...summary },
  };
}

describe("initialOf", () => {
  it("takes the first letter of the first word and uppercases Latin names", () => {
    expect(initialOf("سلمى عادل")).toBe("س");
    expect(initialOf("  mona ali")).toBe("M");
    expect(initialOf("")).toBe("");
  });
});

describe("toClientRow meta line", () => {
  it("says there are no sets", () => {
    expect(toClientRow(client(), NOW, "ar").meta).toEqual({ kind: "none" });
  });

  it("shows the size and when it was saved", () => {
    const summary = {
      measurementSetCount: 1,
      latestSizeLabel: "M",
      lastMeasurementAt: new Date(NOW.getTime() - DAY).toISOString(),
    };
    expect(toClientRow(client(summary), NOW, "ar").meta).toEqual({ kind: "size", size: "M", when: "أمس" });
  });

  it("shows custom measurements when the newest set has no size label", () => {
    const summary = {
      measurementSetCount: 2,
      latestSizeLabel: null,
      lastMeasurementAt: new Date(NOW.getTime() - 3 * DAY).toISOString(),
    };
    expect(toClientRow(client(summary), NOW, "en").meta).toEqual({ kind: "custom", when: "3 days ago" });
  });
});

describe("toClientProfileView", () => {
  it("formats the month she was added", () => {
    expect(toClientProfileView(client(), "ar")).toMatchObject({ since: "مارس 2026", initial: "س" });
    expect(toClientProfileView(client(), "en").since).toBe("March 2026");
  });
});

describe("toMeasurementSetView", () => {
  it("keeps the label and size and says when it was saved", () => {
    const set: MeasurementSet = {
      id: "00000000-0000-4000-8000-0000000000c1",
      clientId: null,
      label: "Summer",
      sizeLabel: "S",
      measurements: sizeM,
      warnings: [],
      createdAt: new Date(NOW.getTime() - 14 * DAY).toISOString(),
    };
    expect(toMeasurementSetView(set, NOW, "en")).toEqual({
      id: set.id,
      label: "Summer",
      sizeLabel: "S",
      when: "2 weeks ago",
    });
  });
});
