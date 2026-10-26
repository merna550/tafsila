import { describe, expect, it } from "vitest";
import { localizeDigits, showText } from "./format";

describe("localizeDigits", () => {
  it("converts digits and the decimal point to Arabic-Indic", () => {
    expect(localizeDigits("22.5 سم", "arabic-indic")).toBe("٢٢٫٥ سم");
    expect(localizeDigits("10.0", "arabic-indic")).toBe("١٠٫٠");
  });

  it("leaves labels and sentence full stops alone", () => {
    expect(localizeDigits("النقطة A. ثم B.", "arabic-indic")).toBe("النقطة A. ثم B.");
  });

  it("returns the text unchanged in Western style", () => {
    expect(localizeDigits("22.5 سم", "western")).toBe("22.5 سم");
  });
});

describe("showText", () => {
  it("picks the language and defaults to Western digits", () => {
    expect(showText({ ar: "٢ سم", en: "2 cm" }, "en")).toBe("2 cm");
    expect(showText({ ar: "2 سم", en: "2 cm" }, "ar", "arabic-indic")).toBe("٢ سم");
  });
});
