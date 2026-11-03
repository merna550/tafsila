import { describe, expect, it } from "vitest";
import { applyStateOf } from "./apply-state";
import type { ProposalItem } from "./chat-view";

const item: ProposalItem = {
  kind: "proposal",
  id: "m1",
  lines: ["a"],
  baseVersionId: "v1",
  appliedVersionId: null,
  request: "x",
};

describe("applyStateOf", () => {
  it("is idle for a pending proposal on the current version", () => {
    expect(applyStateOf(item, undefined, "v1")).toEqual({ kind: "idle" });
  });

  it("is stale when the page moved to another version, without calling the server", () => {
    expect(applyStateOf(item, undefined, "v2")).toEqual({ kind: "stale" });
  });

  it("shows applying and the number the server answered with", () => {
    expect(applyStateOf(item, { kind: "applying" }, "v1")).toEqual({ kind: "applying" });
    expect(applyStateOf(item, { kind: "applied", versionNo: 2 }, "v2")).toEqual({
      kind: "applied",
      versionNo: 2,
    });
  });

  it("knows a proposal applied earlier from the history, without a number", () => {
    expect(applyStateOf({ ...item, appliedVersionId: "v2" }, undefined, "v2")).toEqual({
      kind: "applied",
      versionNo: null,
    });
  });

  it("keeps a stale answer from the server", () => {
    expect(applyStateOf(item, { kind: "stale" }, "v1")).toEqual({ kind: "stale" });
  });
});
