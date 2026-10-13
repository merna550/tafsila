import { describe, expect, it } from "vitest";
import { accountDeletedPath, hasAccountDeletedFlag } from "./account-deleted";

describe("account deleted flag", () => {
  it("builds the home path per language", () => {
    expect(accountDeletedPath("ar")).toBe("/?account=deleted");
    expect(accountDeletedPath("en")).toBe("/en?account=deleted");
  });

  it("reads only the exact flag", () => {
    expect(hasAccountDeletedFlag("?account=deleted")).toBe(true);
    expect(hasAccountDeletedFlag("account=deleted&x=1")).toBe(true);
    expect(hasAccountDeletedFlag("?account=other")).toBe(false);
    expect(hasAccountDeletedFlag("")).toBe(false);
  });
});
