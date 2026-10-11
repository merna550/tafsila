import { describe, expect, it } from "vitest";
import { mapAuthError } from "./map-auth-error";

describe("mapAuthError", () => {
  it.each(["over_request_rate_limit", "over_email_send_rate_limit"])("maps %s to RATE_LIMITED", (code) => {
    expect(mapAuthError({ code, status: 429 })).toMatchObject({
      code: "RATE_LIMITED",
      kind: "rate-limited",
      status: 429,
    });
  });

  it.each(["session_expired", "refresh_token_not_found", "bad_jwt"])("maps %s to UNAUTHENTICATED", (code) => {
    expect(mapAuthError({ code, status: 401 })).toMatchObject({
      code: "UNAUTHENTICATED",
      kind: "unauthenticated",
    });
  });

  it("maps a network failure to NETWORK_ERROR", () => {
    expect(mapAuthError({ name: "AuthRetryableFetchError", status: 0 }).code).toBe("NETWORK_ERROR");
  });

  it("maps an unknown code to INTERNAL_ERROR with Arabic and English text", () => {
    const error = mapAuthError({ code: "something_new", status: 500 });
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.messageAr).toBeTruthy();
    expect(error.messageEn).toBeTruthy();
  });
});
