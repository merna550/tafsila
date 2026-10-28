import { describe, expect, it } from "vitest";
import { ApiError } from "../api";
import { fabricReducer, IDLE_FABRIC_STATE } from "./fabric-state";
import type { FabricAnswer } from "./protocol";

const ANSWER: FabricAnswer = { kinds: [], doesNotFit: [], suggestOpen: false, nestingVersion: "1.0.0" };
const ERROR = new ApiError({ code: "X", kind: "unknown", status: 0, messageAr: "a", messageEn: "e" });

describe("fabricReducer", () => {
  it("runs, reports progress and finishes", () => {
    let state = fabricReducer(IDLE_FABRIC_STATE, { type: "start" });
    expect(state).toEqual({ status: "running", progress: null });
    state = fabricReducer(state, { type: "progress", progress: { stage: "nest" } });
    expect(state).toEqual({ status: "running", progress: { stage: "nest" } });
    expect(fabricReducer(state, { type: "done", answer: ANSWER })).toEqual({
      status: "done",
      answer: ANSWER,
    });
  });

  it("keeps an error until reset", () => {
    const running = fabricReducer(IDLE_FABRIC_STATE, { type: "start" });
    const failed = fabricReducer(running, { type: "fail", error: ERROR });
    expect(failed).toEqual({ status: "error", error: ERROR });
    expect(fabricReducer(failed, { type: "reset" })).toEqual(IDLE_FABRIC_STATE);
  });

  it("ignores a late answer after a cancel", () => {
    expect(fabricReducer(IDLE_FABRIC_STATE, { type: "done", answer: ANSWER })).toEqual(IDLE_FABRIC_STATE);
  });
});
