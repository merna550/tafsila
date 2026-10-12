import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/shared/i18n/testing";
import { isPhoneErrorCode, ruleFor, type PhoneErrorCode } from "./phone-errors";

const CODES: PhoneErrorCode[] = [
  "PHONE_INVALID",
  "PHONE_TEST_ONLY",
  "PHONE_ALREADY_USED",
  "PHONE_ALREADY_VERIFIED",
  "PHONE_CODE_INVALID",
  "PHONE_RESEND_TOO_SOON",
  "PHONE_TOO_MANY_ATTEMPTS",
  "PHONE_SEND_FAILED",
];

describe("phone error rules", () => {
  it("recognises the PHONE_* codes and nothing else", () => {
    for (const code of CODES) expect(isPhoneErrorCode(code)).toBe(true);
    expect(isPhoneErrorCode("VALIDATION_ERROR")).toBe(false);
    expect(isPhoneErrorCode("toString")).toBe(false);
  });

  it("has a text in both languages for every code", () => {
    for (const code of CODES) {
      expect(MESSAGES.ar.phoneVerification.errors[code].length).toBeGreaterThan(0);
      expect(MESSAGES.en.phoneVerification.errors[code].length).toBeGreaterThan(0);
    }
  });

  it("shows number problems under the number and a wrong code under the code", () => {
    expect(ruleFor("PHONE_INVALID", "phone").target).toBe("phone");
    expect(ruleFor("PHONE_ALREADY_USED", "phone").target).toBe("phone");
    expect(ruleFor("PHONE_CODE_INVALID", "code").target).toBe("code");
  });

  it("moves limit errors under the code boxes while the code step is open", () => {
    expect(ruleFor("PHONE_TOO_MANY_ATTEMPTS", "code").target).toBe("code");
    expect(ruleFor("PHONE_RESEND_TOO_SOON", "code").target).toBe("code");
    expect(ruleFor("PHONE_TOO_MANY_ATTEMPTS", "phone").target).toBe("phone");
  });

  it("treats an already verified phone as done", () => {
    expect(ruleFor("PHONE_ALREADY_VERIFIED", "phone").target).toBe("done");
  });
});
