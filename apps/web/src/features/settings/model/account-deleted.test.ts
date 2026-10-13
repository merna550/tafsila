import { describe, expect, it } from "vitest";
import { accountDeletedPath, hasAccountDeletedFlag, withoutAccountDeletedFlag } from "./account-deleted";

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

describe("withoutAccountDeletedFlag", () => {
  it("drops only the flag and keeps the rest of the address", () => {
    expect(withoutAccountDeletedFlag("https://x.test/?account=deleted")).toBe("/");
    expect(withoutAccountDeletedFlag("https://x.test/en?account=deleted&a=1#top")).toBe("/en?a=1#top");
  });
});
