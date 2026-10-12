import { describe, expect, it } from "vitest";
import { formatEgyptianMobile, maskPhones, normalizeEgyptianMobile, toAsciiDigits } from "./phone";

describe("normalizeEgyptianMobile", () => {
  it.each([
    "01012345678",
    "010 1234 5678",
    "010-1234-5678",
    "1012345678",
    "+201012345678",
    "00201012345678",
    "201012345678",
    "+2001012345678",
    "+20 010 1234 5678",
    "٠١٠١٢٣٤٥٦٧٨",
    "۰۱۰۱۲۳۴۵۶۷۸",
    "‎+20 101 234 5678",
    "(010) 1234.5678",
  ])("accepts %s", (input) => {
    expect(normalizeEgyptianMobile(input)).toBe("+201012345678");
  });

  it.each([
    ["01112345678", "+201112345678"],
    ["01212345678", "+201212345678"],
    ["01512345678", "+201512345678"],
    ["‎+20 115 123 4567", "+201151234567"],
    ["۰۱۱۱۲۳۴۵۶۷۸", "+201112345678"],
  ])("accepts %s as %s", (input, expected) => {
    expect(normalizeEgyptianMobile(input)).toBe(expected);
  });

  it.each([
    "0221234567",
    "02123456789",
    "0312345678",
    "01312345678",
    "01412345678",
    "01612345678",
    "01912345678",
    "0101234567",
    "010123456789",
    "+966501234567",
    "+2010123456a",
    "",
    "+20",
    "2001012345678",
  ])("rejects %j", (input) => {
    expect(normalizeEgyptianMobile(input)).toBeNull();
  });
});

describe("formatEgyptianMobile", () => {
  it("groups as 010 1234 5678", () => {
    expect(formatEgyptianMobile("+201012345678")).toBe("010 1234 5678");
  });
  it("leaves other text unchanged", () => {
    expect(formatEgyptianMobile("abc")).toBe("abc");
  });
});

describe("toAsciiDigits and maskPhones", () => {
  it("converts eastern digits", () => {
    expect(toAsciiDigits("٠١٢٣٤٥٦٧٨٩۰۹")).toBe("01234567890" + "9");
  });
  it("masks phone-shaped text", () => {
    expect(maskPhones("/x?p=+201012345678&q=010 1234 5678")).toBe("/x?p=[phone]&q=[phone]");
    expect(maskPhones("hello")).toBe("hello");
  });
});
