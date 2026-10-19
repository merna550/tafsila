import { describe, expect, it } from "vitest";
import * as withUserModule from "./with-user";
import { escapeLike } from "./escape-like";

describe("withUser guard", () => {
  it("exports only the two factories (the raw Drizzle client is never exported)", () => {
    expect(Object.keys(withUserModule).sort((a, b) => a.localeCompare(b))).toEqual([
      "createWithApiRole",
      "createWithUser",
    ]);
  });

  it("rejects a context without a matching sub before touching the database", async () => {
    const withUser = withUserModule.createWithUser("postgresql://api_app:x@127.0.0.1:1/postgres");
    const run = () => Promise.resolve("never");
    await expect(withUser({ userId: "u", role: "user", claims: {} }, run)).rejects.toThrow(/sub/);
    await expect(withUser({ userId: "u", role: "user", claims: { sub: "other" } }, run)).rejects.toThrow(
      /sub/,
    );
  });
});

describe("escapeLike", () => {
  it("escapes %, _ and backslash so a search term is literal", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});
