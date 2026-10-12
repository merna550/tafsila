import { describe, expect, it } from "vitest";
import { clientFormSchema, toCreateBody, toUpdateBody } from "./client-form.schema";

/**
 * The first error message of a failed parse.
 *
 * @param values - Form values to check.
 * @returns The message key, or undefined when valid.
 */
function firstError(values: { name: string; notes: string }): string | undefined {
  const result = clientFormSchema.safeParse(values);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("clientFormSchema", () => {
  it("requires a name, also when it is only spaces", () => {
    expect(firstError({ name: "", notes: "" })).toBe("nameRequired");
    expect(firstError({ name: "   ", notes: "" })).toBe("nameRequired");
  });

  it("limits the name to 120 characters and the notes to 2000", () => {
    expect(firstError({ name: "a".repeat(120), notes: "" })).toBeUndefined();
    expect(firstError({ name: "a".repeat(121), notes: "" })).toBe("nameTooLong");
    expect(firstError({ name: "منى", notes: "a".repeat(2000) })).toBeUndefined();
    expect(firstError({ name: "منى", notes: "a".repeat(2001) })).toBe("notesTooLong");
  });

  it("trims both fields", () => {
    expect(clientFormSchema.parse({ name: "  منى ", notes: " x " })).toEqual({ name: "منى", notes: "x" });
  });
});

describe("request bodies", () => {
  it("leaves empty notes out on create and clears them with null on update", () => {
    expect(toCreateBody({ name: "منى", notes: "" })).toEqual({ name: "منى" });
    expect(toCreateBody({ name: "منى", notes: "n" })).toEqual({ name: "منى", notes: "n" });
    expect(toUpdateBody({ name: "منى", notes: "" })).toEqual({ name: "منى", notes: null });
  });
});
