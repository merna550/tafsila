import { describe, expect, it } from "vitest";
import { createNoopIdentityEraser } from "../noop/noop-identity-eraser";
import { createPosthogIdentityEraser } from "./posthog-identity-eraser";

const config = { host: "https://eu.posthog.test/", personalApiKey: "phx_secret", projectId: "42" };

/**
 * Builds a fake fetch that answers from a list of responses in order and records the requests.
 *
 * @param responses - Status and JSON body per call.
 * @returns The fake and the recorded calls.
 */
function fakeFetch(responses: { status: number; body?: unknown }[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = responses[calls.length - 1] ?? { status: 200 };
    return Promise.resolve(new Response(JSON.stringify(next.body ?? {}), { status: next.status }));
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe("posthog identity eraser", () => {
  it("finds the person by distinct id and deletes them with their events", async () => {
    const { calls, fetchImpl } = fakeFetch([
      { status: 200, body: { results: [{ id: 7 }] } },
      { status: 200 },
    ]);
    await createPosthogIdentityEraser({ ...config, fetchImpl }).erase("user-1");
    expect(calls[0]?.url).toBe("https://eu.posthog.test/api/projects/42/persons/?distinct_id=user-1");
    expect(calls[0]?.init?.headers).toMatchObject({ authorization: "Bearer phx_secret" });
    expect(calls[1]?.url).toBe("https://eu.posthog.test/api/projects/42/persons/7/?delete_events=true");
    expect(calls[1]?.init?.method).toBe("DELETE");
  });

  it("does nothing more when the person is not found", async () => {
    const { calls, fetchImpl } = fakeFetch([{ status: 200, body: { results: [] } }]);
    await createPosthogIdentityEraser({ ...config, fetchImpl }).erase("user-1");
    expect(calls).toHaveLength(1);
  });

  it("fails on a provider error without the key in the message", async () => {
    const { fetchImpl } = fakeFetch([{ status: 401 }]);
    const failure = createPosthogIdentityEraser({ ...config, fetchImpl }).erase("user-1");
    await expect(failure).rejects.toThrow("PostHog person lookup failed with 401");
    await expect(failure).rejects.not.toThrow(/phx_secret/);
  });

  it("fails when the delete is refused", async () => {
    const { fetchImpl } = fakeFetch([{ status: 200, body: { results: [{ id: 7 }] } }, { status: 500 }]);
    await expect(createPosthogIdentityEraser({ ...config, fetchImpl }).erase("user-1")).rejects.toThrow(
      "PostHog person delete failed with 500",
    );
  });
});

describe("noop identity eraser", () => {
  it("logs one warning and succeeds", async () => {
    const lines: string[] = [];
    await createNoopIdentityEraser((line) => lines.push(line)).erase("user-1");
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain("user-1");
  });
});
