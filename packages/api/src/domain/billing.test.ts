import { describe, expect, it } from "vitest";
import { isRenewSoon, toGrants } from "./billing";

const NOW = new Date("2026-11-01T00:00:00.000Z");
const inDays = (days: number): Date => new Date(NOW.getTime() + days * 86_400_000);

describe("isRenewSoon", () => {
  it("is false at 8 days, true at 7 and 1, false once over", () => {
    expect(isRenewSoon(inDays(8), NOW)).toBe(false);
    expect(isRenewSoon(inDays(7), NOW)).toBe(true);
    expect(isRenewSoon(inDays(1), NOW)).toBe(true);
    expect(isRenewSoon(inDays(0), NOW)).toBe(false);
    expect(isRenewSoon(inDays(-1), NOW)).toBe(false);
  });
});

describe("toGrants", () => {
  it("sorts by expiry with never-expiring lots last", () => {
    const grants = toGrants([
      { remaining: 3, expiresAt: null },
      { remaining: 5, expiresAt: "2026-12-01T00:00:00.000Z" },
      { remaining: 1, expiresAt: "2026-11-05T00:00:00.000Z" },
    ]);
    expect(grants.map((g) => g.credits)).toEqual([1, 5, 3]);
  });

  it("returns an empty list for no lots", () => {
    expect(toGrants([])).toEqual([]);
  });
});
