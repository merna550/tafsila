import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError } from "./api-error";
import { apiRequest } from "./client";
import { isRetryable, placementFor, supportReference } from "./error-display";

const schema = z.object({ status: z.string() });
const errorBody = (code: string, extra: object = {}): string =>
  JSON.stringify({ code, message_ar: "رسالة", message_en: "message", request_id: "req-1", ...extra });
const respond = (body: string, status: number) => () => Promise.resolve(new Response(body, { status }));

/**
 * Runs a request and returns the thrown ApiError.
 *
 * @param fetchFn - Fake fetch.
 * @returns The error the client threw.
 */
async function failure(fetchFn: typeof fetch): Promise<ApiError> {
  const error: unknown = await apiRequest("/x", { schema, fetchFn }).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

describe("apiRequest", () => {
  it("returns the parsed body on success", async () => {
    const ok = respond(JSON.stringify({ status: "ok" }), 200);
    await expect(apiRequest("/health", { schema, fetchFn: ok })).resolves.toEqual({ status: "ok" });
  });

  it("turns a validation response into field errors", async () => {
    const body = errorBody("VALIDATION_FAILED", { details: { fields: { chest_mm: "مطلوب" } } });
    const error = await failure(respond(body, 400));
    expect(error.kind).toBe("validation");
    expect(error.fieldErrors).toEqual({ chest_mm: "مطلوب" });
    expect(error.localizedMessage("ar")).toBe("رسالة");
    expect(placementFor(error, "action")).toBe("field");
  });

  it("maps 401, 403 and 500 to their display places", async () => {
    expect(placementFor(await failure(respond(errorBody("UNAUTHENTICATED"), 401)), "load")).toBe(
      "redirect-sign-in",
    );
    expect(placementFor(await failure(respond(errorBody("FORBIDDEN"), 403)), "action")).toBe("no-permission");
    const server = await failure(respond(errorBody("INTERNAL_ERROR"), 500));
    expect(placementFor(server, "load")).toBe("page-error-state");
    expect(placementFor(server, "action")).toBe("toast");
    expect(supportReference(server)).toBe("req-1");
    expect(isRetryable(server)).toBe(true);
  });

  it("turns a network failure into a banner error with a fixed Arabic message", async () => {
    const error = await failure(() => Promise.reject(new TypeError("Failed to fetch")));
    expect(error.kind).toBe("network");
    expect(error.messageAr).not.toContain("TypeError");
    expect(placementFor(error, "action")).toBe("connection-banner");
  });

  it("turns a timeout into a timeout error", async () => {
    const error = await failure(() => Promise.reject(new DOMException("t", "TimeoutError")));
    expect(error.kind).toBe("timeout");
  });

  it("never leaks a non-standard error body or a wrong success shape", async () => {
    const html = await failure(respond("<html>502 Bad Gateway TypeError</html>", 502));
    expect(html.kind).toBe("unknown");
    expect(html.messageAr).not.toContain("502");
    const wrong = await failure(respond(JSON.stringify({ nope: 1 }), 200));
    expect(wrong.code).toBe("UNKNOWN_ERROR");
  });

  it("sends the bearer token from the token source, and none when signed out", async () => {
    const seen: (HeadersInit | undefined)[] = [];
    const fetchFn = ((_url: string, init?: RequestInit) => {
      seen.push(init?.headers);
      return Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    }) as unknown as typeof fetch;
    await apiRequest("/me", { schema, fetchFn, getToken: () => Promise.resolve("tok") });
    await apiRequest("/me", { schema, fetchFn, getToken: () => Promise.resolve(null) });
    await apiRequest("/me", { schema, fetchFn, getToken: () => Promise.reject(new Error("x")) });
    expect(seen).toEqual([{ authorization: "Bearer tok" }, undefined, undefined]);
  });
});
