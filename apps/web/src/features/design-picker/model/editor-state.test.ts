import { defaultSpec } from "@tafsila/engine/spec-rules";
import { describe, expect, it } from "vitest";
import {
  EMPTY_EDITOR_STATE,
  acceptDraft,
  dismissNoticeState,
  hydrateState,
  isDirty,
  markSavedState,
  setFeatureState,
  undoState,
} from "./editor-state";

const dress = defaultSpec("dress");
const start = hydrateState("d1", dress, null);

describe("editor state", () => {
  it("setFeature sets the value and marks the design dirty", () => {
    const next = setFeatureState(start, "sleeve.type", "puff");
    expect(next.spec?.sleeve?.type).toBe("puff");
    expect(isDirty(next)).toBe(true);
    expect(isDirty(start)).toBe(false);
  });

  it("records the features the rules changed", () => {
    const seamless = setFeatureState(
      hydrateState("d1", { ...dress, skirt: { type: "gathered", length: "knee" } }, null),
      "bodice.waistSeam",
      false,
    );
    expect(seamless.resetPaths).toEqual(["skirt.type"]);
  });

  it("undo restores exactly the previous spec and clears the notice", () => {
    const changed = setFeatureState(start, "sleeve.type", "puff");
    const back = undoState(changed);
    expect(back.spec).toEqual(dress);
    expect(back.resetPaths).toEqual([]);
    expect(undoState(back)).toBe(back);
  });

  it("markSaved clears dirty and undo", () => {
    const changed = setFeatureState(start, "sleeve.type", "puff");
    const saved = markSavedState(changed, changed.spec!);
    expect(isDirty(saved)).toBe(false);
    expect(saved.previous).toBeNull();
  });

  it("dismissNotice only clears the reset paths", () => {
    const state = { ...start, resetPaths: ["skirt.type" as const] };
    expect(dismissNoticeState(state).resetPaths).toEqual([]);
    expect(dismissNoticeState(start)).toBe(start);
  });

  it("ignores changes before a design is loaded", () => {
    expect(setFeatureState(EMPTY_EDITOR_STATE, "belt", "none")).toBe(EMPTY_EDITOR_STATE);
  });

  it("uses a draft only when its baseSpec equals the server spec", () => {
    const edited = { ...dress, lining: true };
    expect(acceptDraft({ spec: edited, baseSpec: dress }, dress)).toEqual(edited);
    expect(acceptDraft({ spec: edited, baseSpec: defaultSpec("skirt") }, dress)).toBeNull();
    expect(acceptDraft({ spec: { bad: 1 }, baseSpec: dress }, dress)).toBeNull();
    expect(acceptDraft(null, dress)).toBeNull();
    const hydrated = hydrateState("d1", dress, edited);
    expect(hydrated.spec).toEqual(edited);
    expect(isDirty(hydrated)).toBe(true);
  });
});
