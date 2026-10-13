import { describe, expect, it } from "vitest";
import { isNameChanged, MAX_NAME_LENGTH, profileFormSchema } from "./profile-form.schema";

describe("profileFormSchema", () => {
  it("trims and accepts a normal name", () => {
    expect(profileFormSchema.parse({ name: "  منى  " })).toEqual({ name: "منى" });
  });

  it("rejects an empty or blank name", () => {
    expect(profileFormSchema.safeParse({ name: "   " }).error?.issues[0]?.message).toBe("nameRequired");
  });

  it("rejects a name over the limit", () => {
    const result = profileFormSchema.safeParse({ name: "م".repeat(MAX_NAME_LENGTH + 1) });
    expect(result.error?.issues[0]?.message).toBe("nameTooLong");
  });
});

describe("isNameChanged", () => {
  it("is false for the saved name, with or without spaces, and for null against empty", () => {
    expect(isNameChanged("منى", "منى")).toBe(false);
    expect(isNameChanged(" منى ", "منى")).toBe(false);
    expect(isNameChanged("", null)).toBe(false);
  });

  it("is true when the text differs", () => {
    expect(isNameChanged("هبة", "منى")).toBe(true);
    expect(isNameChanged("هبة", null)).toBe(true);
  });
});
