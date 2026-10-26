import { describe, expect, it } from "vitest";
import { clientApiError } from "../api";
import { exportReducer, IDLE_EXPORT_STATE, type ExportFile, type ExportState } from "./export-state";

const FILE: ExportFile = {
  fileName: "a-v1-A4.pdf",
  mime: "application/pdf",
  bytes: new ArrayBuffer(1),
  pageCount: 3,
};
const RUNNING: ExportState = { status: "running", kind: "a4", progress: null };

describe("exportReducer", () => {
  it("goes idle -> running -> progress -> done", () => {
    let state = exportReducer(IDLE_EXPORT_STATE, { type: "start", kind: "a4" });
    expect(state).toEqual(RUNNING);
    state = exportReducer(state, { type: "progress", progress: { done: 1, total: 3 } });
    expect(state).toEqual({ status: "running", kind: "a4", progress: { done: 1, total: 3 } });
    state = exportReducer(state, { type: "done", file: FILE });
    expect(state).toEqual({ status: "done", kind: "a4", file: FILE });
  });

  it("goes running -> error and starts again from error", () => {
    const error = clientApiError("unknown");
    const failed = exportReducer(RUNNING, { type: "fail", error });
    expect(failed).toEqual({ status: "error", kind: "a4", error });
    expect(exportReducer(failed, { type: "start", kind: "svg" })).toEqual({
      status: "running",
      kind: "svg",
      progress: null,
    });
  });

  it("reset returns to idle from every state, also while running", () => {
    expect(exportReducer(RUNNING, { type: "reset" })).toBe(IDLE_EXPORT_STATE);
    expect(exportReducer({ status: "done", kind: "a4", file: FILE }, { type: "reset" })).toBe(
      IDLE_EXPORT_STATE,
    );
  });

  it("ignores a late answer after cancel", () => {
    expect(exportReducer(IDLE_EXPORT_STATE, { type: "done", file: FILE })).toBe(IDLE_EXPORT_STATE);
    expect(exportReducer(IDLE_EXPORT_STATE, { type: "progress", progress: { done: 1, total: 2 } })).toBe(
      IDLE_EXPORT_STATE,
    );
    expect(exportReducer(IDLE_EXPORT_STATE, { type: "fail", error: clientApiError("unknown") })).toBe(
      IDLE_EXPORT_STATE,
    );
  });
});
