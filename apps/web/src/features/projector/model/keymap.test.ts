import { describe, expect, it } from "vitest";
import { HELP_ROWS, keyAction } from "./keymap";

const KEY = { key: "", shiftKey: false, altKey: false };

describe("keyAction", () => {
  it("maps every key of the help list to an action", () => {
    for (const row of HELP_ROWS) expect(keyAction(row.sample), row.id).not.toBeNull();
  });

  it("pans by 10 mm with Shift and ArrowLeft", () => {
    expect(keyAction({ ...KEY, code: "ArrowLeft", shiftKey: true })).toEqual({
      kind: "pan",
      dx: -1,
      dy: 0,
      stepMm: 10,
    });
  });

  it("works on any keyboard layout because it reads the key code", () => {
    expect(keyAction({ ...KEY, code: "KeyM", key: "ئ" })).toEqual({ kind: "mirror" });
    expect(keyAction({ ...KEY, code: "Slash", key: "؟", shiftKey: true })).toEqual({ kind: "help" });
  });

  it("changes the line width with the bracket keys", () => {
    expect(keyAction({ ...KEY, code: "BracketRight" })).toEqual({ kind: "lineWidth", delta: 1 });
    expect(keyAction({ ...KEY, code: "BracketLeft" })).toEqual({ kind: "lineWidth", delta: -1 });
  });

  it("gives null for a key the page does not use", () => {
    expect(keyAction({ ...KEY, code: "KeyQ" })).toBeNull();
    expect(keyAction({ ...KEY, code: "Slash" })).toBeNull();
  });
});
