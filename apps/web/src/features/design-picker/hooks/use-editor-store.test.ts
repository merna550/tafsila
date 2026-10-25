import { defaultSpec } from "@tafsila/engine/spec-rules";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_EDITOR_STATE } from "../model/editor-state";
import { draftKey, selectIsDirty, useEditorStore } from "./use-editor-store";

const data = new Map<string, string>();
const dress = defaultSpec("dress");

beforeEach(() => {
  data.clear();
  useEditorStore.setState({ ...EMPTY_EDITOR_STATE });
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
      removeItem: (k: string) => {
        data.delete(k);
      },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("editor store", () => {
  it("writes a draft on change and removes it on markSaved", () => {
    const store = useEditorStore.getState();
    store.hydrate("d1", dress);
    useEditorStore.getState().setFeature("sleeve.type", "puff");
    expect(data.has(draftKey("d1"))).toBe(true);
    expect(selectIsDirty(useEditorStore.getState())).toBe(true);
    useEditorStore.getState().markSaved(useEditorStore.getState().spec!);
    expect(data.has(draftKey("d1"))).toBe(false);
    expect(selectIsDirty(useEditorStore.getState())).toBe(false);
  });

  it("restores the draft after a reload and ignores a draft of another base", () => {
    useEditorStore.getState().hydrate("d1", dress);
    useEditorStore.getState().setFeature("lining", true);
    useEditorStore.setState({ ...EMPTY_EDITOR_STATE });
    useEditorStore.getState().hydrate("d1", dress);
    expect(useEditorStore.getState().spec?.lining).toBe(true);
    useEditorStore.setState({ ...EMPTY_EDITOR_STATE });
    useEditorStore.getState().hydrate("d1", { ...dress, belt: "self-tie" });
    expect(useEditorStore.getState().spec?.lining).toBe(false);
  });

  it("still edits when storage throws", () => {
    const blocked = (): never => {
      throw new Error("blocked");
    };
    vi.stubGlobal("window", { localStorage: { getItem: blocked, setItem: blocked, removeItem: blocked } });
    useEditorStore.getState().hydrate("d2", dress);
    useEditorStore.getState().setFeature("sleeve.type", "puff");
    expect(useEditorStore.getState().spec?.sleeve?.type).toBe("puff");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().spec).toEqual(dress);
  });
});
