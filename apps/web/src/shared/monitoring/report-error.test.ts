import * as Sentry from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";
import { reportError } from "./monitoring";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn(), getClient: vi.fn(), init: vi.fn() }));

describe("reportError", () => {
  it("tags the Sentry event with the request id", () => {
    const error = new Error("boom");
    reportError(error, "req-7");
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { tags: { request_id: "req-7" } });
  });
});
