import { describe, expect, it } from "vitest";
import { fabricAltName, fabricName, pickLocalized } from "./localized";

const FABRIC = { nameAr: "كريب", nameEn: "Crepe" };

describe("pickLocalized", () => {
  it("returns the side that matches the language", () => {
    const text = { ar: "ينسدل بنعومة", en: "Drapes softly" };
    expect(pickLocalized(text, "ar")).toBe("ينسدل بنعومة");
    expect(pickLocalized(text, "en")).toBe("Drapes softly");
  });
});

describe("fabricName and fabricAltName", () => {
  it("show the interface language first and the other one as the small name", () => {
    expect(fabricName(FABRIC, "ar")).toBe("كريب");
    expect(fabricAltName(FABRIC, "ar")).toBe("Crepe");
    expect(fabricName(FABRIC, "en")).toBe("Crepe");
    expect(fabricAltName(FABRIC, "en")).toBe("كريب");
  });
});
