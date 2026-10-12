import { describe, expect, it } from "vitest";
import { MESSAGES } from "../i18n/testing";
import { CLIENT_ERROR_MESSAGES, apiErrorFromBody, clientApiError } from "./api-error";

/** Words of Egyptian dialect and feminine imperatives that docs/design/copy.md forbids in Arabic UI text. */
const FORBIDDEN_ARABIC = ["مفيش", "اتأكد", "تاني", "شوية", "كتير", "أخد", "حاولي", "سجّلي"];

describe("client error messages", () => {
  it("come from messages/ar.json and messages/en.json", () => {
    expect(CLIENT_ERROR_MESSAGES.network.ar).toBe(MESSAGES.ar.clientErrors.network);
    expect(CLIENT_ERROR_MESSAGES.network.en).toBe(MESSAGES.en.clientErrors.network);
  });

  it("follow the copy rules: no dialect and no feminine imperative", () => {
    for (const { ar } of Object.values(CLIENT_ERROR_MESSAGES)) {
      for (const word of FORBIDDEN_ARABIC) expect(ar).not.toContain(word);
    }
  });

  it("keep the same behaviour for clientApiError", () => {
    const error = clientApiError("timeout");
    expect(error.code).toBe("TIMEOUT");
    expect(error.messageAr).toBe(MESSAGES.ar.clientErrors.timeout);
    expect(error.messageEn).toBe(MESSAGES.en.clientErrors.timeout);
  });
});

describe("apiErrorFromBody", () => {
  it("keeps the retry delay of a rate-limited answer", () => {
    const error = apiErrorFromBody(
      {
        code: "PHONE_RESEND_TOO_SOON",
        message_ar: "ar",
        message_en: "en",
        details: { retryAfterSeconds: 42 },
        request_id: "req-1",
      },
      429,
    );
    expect(error.kind).toBe("rate-limited");
    expect(error.retryAfterSeconds).toBe(42);
  });

  it("has no retry delay when the server sent none", () => {
    const error = apiErrorFromBody(
      { code: "PHONE_INVALID", message_ar: "ar", message_en: "en", request_id: "req-2" },
      400,
    );
    expect(error.retryAfterSeconds).toBeUndefined();
  });
});
