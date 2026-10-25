import { describe, expect, it } from "vitest";
import type { PatternOptionsValue } from "@/features/pattern-options";
import { usePageStore } from "./use-page-store";

describe("page store replace", () => {
  it("makes restored options the baseline and records the base version", () => {
    const first = { easeProfile: "regular" } as PatternOptionsValue;
    const restored = { easeProfile: "loose" } as PatternOptionsValue;
    usePageStore.getState().load("d1", first, null);
    usePageStore.getState().replace(restored, { id: "v3", versionNo: 3, inputHash: "h" });
    const state = usePageStore.getState();
    expect(state.options).toBe(restored);
    expect(state.baseline).toBe(restored);
    expect(state.baseVersion).toEqual({ id: "v3", versionNo: 3, inputHash: "h" });
    expect(state.designId).toBe("d1");
  });
});
