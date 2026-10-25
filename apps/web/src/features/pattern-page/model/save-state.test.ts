import { describe, expect, it } from "vitest";
import { canSave, saveStateOf, type SaveStateInput } from "./save-state";

const input = { spec: {}, measurements: {} };
const base = { id: "v1", versionNo: 2, inputHash: "fnv1a64:aaaa" };

/**
 * Builds a state input that reads "done, pass, unsaved" unless overridden.
 *
 * @param patch - Fields to change.
 * @returns The input.
 */
function make(patch: Partial<SaveStateInput> = {}): SaveStateInput {
  return {
    loading: false,
    currentInput: input,
    preview: {
      status: "done",
      input,
      result: { validation: { status: "pass" }, meta: { createdFrom: "fnv1a64:bbbb" } } as never,
    },
    rejected: false,
    saving: false,
    dirty: true,
    baseVersion: null,
    ...patch,
  };
}

describe("saveStateOf", () => {
  it("is loading first", () => {
    expect(saveStateOf(make({ loading: true, currentInput: null })).kind).toBe("loading");
  });
  it("is no-set without a preview input", () => {
    expect(saveStateOf(make({ currentInput: null })).kind).toBe("no-set");
  });
  it("is previewing while running, idle or when the draft answered older inputs", () => {
    expect(saveStateOf(make({ preview: { status: "running" } })).kind).toBe("previewing");
    expect(saveStateOf(make({ preview: { status: "idle" } })).kind).toBe("previewing");
    const stale = make();
    expect(saveStateOf({ ...stale, currentInput: { ...input } }).kind).toBe("previewing");
  });
  it("is preview-error when the worker failed on the current input", () => {
    expect(saveStateOf(make({ preview: { status: "error", input } })).kind).toBe("preview-error");
  });
  it("is server-rejected while the same inputs stay refused", () => {
    expect(saveStateOf(make({ rejected: true })).kind).toBe("server-rejected");
  });
  it("is fail for a failed report", () => {
    const failing = make({
      preview: { status: "done", input, result: { validation: { status: "fail" } } as never },
    });
    expect(saveStateOf(failing).kind).toBe("fail");
  });
  it("is saving while a request runs", () => {
    expect(saveStateOf(make({ saving: true })).kind).toBe("saving");
  });
  it("is saved when the hash equals the base version, even with edits made and undone", () => {
    const state = saveStateOf(make({ baseVersion: { ...base, inputHash: "fnv1a64:bbbb" } }));
    expect(state).toEqual({ kind: "saved", versionNo: 2 });
    expect(canSave(state)).toBe(false);
  });
  it("is outdated when nothing was edited but the hash differs", () => {
    const state = saveStateOf(make({ baseVersion: base, dirty: false }));
    expect(state).toEqual({ kind: "outdated", versionNo: 2 });
    expect(canSave(state)).toBe(true);
  });
  it("is unsaved otherwise", () => {
    expect(saveStateOf(make({ baseVersion: base })).kind).toBe("unsaved");
    expect(canSave(saveStateOf(make()))).toBe(true);
  });
  it("lets Save through only for unsaved and outdated", () => {
    for (const kind of [
      "loading",
      "no-set",
      "previewing",
      "preview-error",
      "server-rejected",
      "fail",
      "saving",
      "saved",
    ] as const) {
      expect(canSave({ kind })).toBe(false);
    }
  });
});
