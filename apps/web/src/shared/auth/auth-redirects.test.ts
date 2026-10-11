import { describe, expect, it } from "vitest";
import { callbackDestination, confirmDestination, parseConfirmType } from "./auth-redirects";

const NOW = new Date("2026-10-11T12:00:00Z");

describe("parseConfirmType", () => {
  it("accepts the types of our two mails and nothing else", () => {
    expect(parseConfirmType("signup")).toBe("signup");
    expect(parseConfirmType("email")).toBe("email");
    expect(parseConfirmType("recovery")).toBe("recovery");
    expect(parseConfirmType("magiclink")).toBeNull();
    expect(parseConfirmType(null)).toBeNull();
  });
});

describe("confirmDestination", () => {
  it("sends recovery links to the reset form and confirmations to the dashboard welcome", () => {
    expect(confirmDestination("recovery")).toBe("/reset-password");
    expect(confirmDestination("signup")).toBe("/dashboard?welcome=1");
    expect(confirmDestination("email")).toBe("/dashboard?welcome=1");
  });
});

describe("callbackDestination", () => {
  it("welcomes an account created a few seconds ago", () => {
    expect(callbackDestination(null, "2026-10-11T11:59:50Z", NOW)).toBe("/dashboard?welcome=1&method=google");
  });

  it("follows a safe next for an older account", () => {
    expect(callbackDestination("/dashboard", "2026-10-01T00:00:00Z", NOW)).toBe("/dashboard");
    expect(callbackDestination("/en/dashboard", "2026-10-01T00:00:00Z", NOW)).toBe("/en/dashboard");
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil", null])("ignores the unsafe next %s", (next) => {
    expect(callbackDestination(next, "2026-10-01T00:00:00Z", NOW)).toBe("/dashboard");
  });

  it("treats a missing creation time as an existing account", () => {
    expect(callbackDestination(null, undefined, NOW)).toBe("/dashboard");
  });
});
