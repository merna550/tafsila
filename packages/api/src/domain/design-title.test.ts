import { describe, expect, it } from "vitest";
import { defaultDesignTitle } from "./design-title";

describe("defaultDesignTitle", () => {
  it("uses the category word in the user's language and the date", () => {
    const now = new Date("2026-10-19T10:00:00Z");
    expect(defaultDesignTitle("dress", "ar", now)).toBe("فستان 2026-10-19");
    expect(defaultDesignTitle("skirt", "en", now)).toBe("Skirt 2026-10-19");
    expect(defaultDesignTitle("blouse", "ar", now)).toBe("بلوزة 2026-10-19");
  });

  it("uses the Cairo calendar day, not UTC", () => {
    expect(defaultDesignTitle("dress", "en", new Date("2026-10-19T22:30:00Z"))).toBe("Dress 2026-10-20");
  });
});
