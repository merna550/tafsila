import { describe, expect, it } from "vitest";
import { deleteAccountInputSchema, profileSchema, updateProfileInputSchema } from "./profile";

describe("profile schemas", () => {
  it("trims the name and rejects an empty or too long one", () => {
    expect(updateProfileInputSchema.parse({ name: "  منى " }).name).toBe("منى");
    expect(updateProfileInputSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(updateProfileInputSchema.safeParse({ name: "x".repeat(121) }).success).toBe(false);
    expect(updateProfileInputSchema.safeParse({ name: "x".repeat(120) }).success).toBe(true);
  });

  it("accepts a null name in the response but not in a patch", () => {
    expect(profileSchema.safeParse({ name: null, locale: "ar", email: null }).success).toBe(true);
    expect(updateProfileInputSchema.safeParse({ name: null }).success).toBe(false);
  });

  it("rejects an unknown locale and an empty patch", () => {
    expect(updateProfileInputSchema.safeParse({ locale: "fr" }).success).toBe(false);
    expect(updateProfileInputSchema.safeParse({}).success).toBe(false);
    expect(updateProfileInputSchema.safeParse({ locale: "en" }).success).toBe(true);
  });

  it("rejects fields outside the contract such as a user id", () => {
    expect(updateProfileInputSchema.safeParse({ name: "منى", userId: "x" }).success).toBe(false);
    expect(deleteAccountInputSchema.safeParse({ confirm: "DELETE_MY_ACCOUNT", userId: "x" }).success).toBe(
      false,
    );
  });

  it("accepts only the exact confirmation literal", () => {
    expect(deleteAccountInputSchema.safeParse({ confirm: "DELETE_MY_ACCOUNT" }).success).toBe(true);
    expect(deleteAccountInputSchema.safeParse({ confirm: "delete_my_account" }).success).toBe(false);
    expect(deleteAccountInputSchema.safeParse({ confirm: "حذف" }).success).toBe(false);
    expect(deleteAccountInputSchema.safeParse({}).success).toBe(false);
  });
});
