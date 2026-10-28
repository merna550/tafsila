import { describe, expect, it } from "vitest";
import { fieldMessage } from "./field-message";

describe("fieldMessage", () => {
  it("translates a schema key and passes API text through", () => {
    const translate = (key: string): string => `t:${key}`;
    expect(fieldMessage("nameArRequired", ["nameArRequired"], translate)).toBe("t:nameArRequired");
    expect(fieldMessage("Already used", ["nameArRequired"], translate)).toBe("Already used");
    expect(fieldMessage(undefined, ["nameArRequired"], translate)).toBeUndefined();
  });
});
