import { describe, expect, it } from "vitest";
import { routeError } from "../error-display/route-error";
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

  it.each([
    ["invalid_credentials", "AUTH_INVALID_CREDENTIALS", 401],
    ["email_not_confirmed", "AUTH_EMAIL_NOT_CONFIRMED", 401],
    ["email_exists", "AUTH_EMAIL_TAKEN", 409],
    ["identity_already_exists", "AUTH_EMAIL_TAKEN", 409],
    ["weak_password", "AUTH_WEAK_PASSWORD", 400],
    ["otp_expired", "AUTH_LINK_INVALID", 400],
  ])("maps %s to %s as a form error with Arabic and English text", (supabaseCode, code, status) => {
    const error = mapAuthError({ code: supabaseCode, status });
    expect(error).toMatchObject({ code, kind: "validation", status });
    expect(Object.keys(error.fieldErrors)).toEqual(["form"]);
    expect(error.messageAr).toMatch(/[؀-ۿ]/);
    expect(error.messageEn).toBeTruthy();
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

  it("shows form errors under the form and never redirects to sign-in", () => {
    for (const code of ["invalid_credentials", "email_not_confirmed", "weak_password"]) {
      const route = routeError(mapAuthError({ code, status: 400 }), "action", "ar");
      expect(route.place).toBe("field");
      expect(route.message).toMatch(/[؀-ۿ]/);
    }
  });
});
