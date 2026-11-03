import { defaultSpec } from "@tafsila/engine/spec-rules";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readJson } from "@/shared/storage/safe-storage";
import { EMPTY_EDITOR_STATE, acceptDraft } from "../model/editor-state";
import { seedEditorDraft } from "./seed-editor-draft";
import { draftKey, useEditorStore } from "./use-editor-store";

const data = new Map<string, string>();
const base = defaultSpec("dress");
const edited = { ...base, lining: true };

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

describe("seedEditorDraft", () => {
  it("writes a draft that acceptDraft accepts for the default spec", () => {
    expect(seedEditorDraft("d1", "dress", edited)).toBe(true);
    expect(acceptDraft(readJson(draftKey("d1")), base)).toEqual(edited);
  });

  it("makes the editor store start from the seeded spec", () => {
    seedEditorDraft("d1", "dress", edited);
    useEditorStore.getState().hydrate("d1", base);
    expect(useEditorStore.getState().spec).toEqual(edited);
  });

  it("is ignored when the design was made from another server spec", () => {
    seedEditorDraft("d1", "dress", edited);
    expect(acceptDraft(readJson(draftKey("d1")), defaultSpec("skirt"))).toBeNull();
  });
});
