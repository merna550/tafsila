// Tests for the staging smoke check (issue #19) with a fake fetch.
import { describe, expect, it } from "vitest";
import { checkHealth, waitForHealth } from "./smoke-health.mjs";

/**
 * Builds a fake fetch that answers with a fixed status and JSON body.
 *
 * @param {number} status HTTP status.
 * @param {object} body JSON body.
 * @returns {typeof fetch} Fake fetch.
 */
const fakeFetch = (status, body) => async () => ({ status, json: async () => body });
const good = { status: "ok", environment: "staging", gitSha: "abc" };

describe("checkHealth", () => {
  it("passes on a matching body", async () => {
    expect(await checkHealth("https://x", "abc", "staging", fakeFetch(200, good))).toBeNull();
  });

  it("fails on the wrong environment", async () => {
    const r = await checkHealth(
      "https://x",
      "abc",
      "staging",
      fakeFetch(200, { ...good, environment: "preview" }),
    );
    expect(r).toContain("environment");
  });

  it("fails on the wrong SHA", async () => {
    const r = await checkHealth("https://x", "def", "staging", fakeFetch(200, good));
    expect(r).toContain("gitSha");
  });

  it("fails on a non-200 answer and on a network error", async () => {
    expect(await checkHealth("https://x", "abc", "staging", fakeFetch(503, {}))).toBe("HTTP 503");
    const broken = async () => {
      throw new Error("down");
    };
    expect(await checkHealth("https://x", "abc", "staging", broken)).toContain("down");
  });
});

describe("waitForHealth", () => {
  it("retries until healthy", async () => {
    let calls = 0;
    const flaky = async () =>
      ++calls < 3 ? { status: 503, json: async () => ({}) } : { status: 200, json: async () => good };
    const r = await waitForHealth({
      url: "https://x",
      sha: "abc",
      environment: "staging",
      delayMs: 0,
      fetchFn: flaky,
    });
    expect(r).toBeNull();
    expect(calls).toBe(3);
  });

  it("returns the last reason after the attempts run out", async () => {
    const r = await waitForHealth({
      url: "https://x",
      sha: "abc",
      environment: "staging",
      attempts: 2,
      delayMs: 0,
      fetchFn: fakeFetch(503, {}),
    });
    expect(r).toBe("HTTP 503");
  });
});
