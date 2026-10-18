// Tests for the CI savings replay (issue #188).
import { describe, expect, it } from "vitest";
import { ranBefore, replay } from "./ci-savings.mjs";

describe("ci-savings", () => {
  it("counts a docs-only PR as before=always, after=only docs", () => {
    const r = replay([["docs/a.md"]], ["jscpd", "docs", "e2e"]);
    expect(r.jscpd).toEqual({ before: 1, after: 0 });
    expect(r.docs).toEqual({ before: 1, after: 1 });
    expect(r.e2e).toEqual({ before: 0, after: 0 });
  });

  it("old rules ran e2e and docker for engine-only schema and fixture changes", () => {
    expect(ranBefore("e2e", ["packages/schemas/src/pattern.ts"])).toBe(true);
    expect(ranBefore("docker", ["packages/test-fixtures/src/a.ts"])).toBe(true);
    expect(replay([["packages/schemas/src/pattern.ts"]], ["e2e"]).e2e.after).toBe(0);
    expect(replay([["packages/test-fixtures/src/a.ts"]], ["docker"]).docker.after).toBe(0);
  });
});
