import { describe, expect, it, vi } from "vitest";
import { startAnalysis, withRetry, type PhotoUpdate } from "./start-analysis";

const api = vi.hoisted(() => ({ apiRequest: vi.fn(), uploadToSignedUrl: vi.fn() }));
vi.mock("@/shared/api", () => api);

const instant = (): Promise<void> => Promise.resolve();
const photo = { id: "p1", slot: "front" as const, blob: new Blob(["a"]) };

/**
 * Builds a plan with recording callbacks.
 *
 * @param extra - Fields to override.
 * @returns The plan and the recorded updates.
 */
function plan(extra: Record<string, unknown> = {}): {
  plan: Parameters<typeof startAnalysis>[0];
  updates: PhotoUpdate["kind"][];
} {
  const updates: PhotoUpdate["kind"][] = [];
  return {
    updates,
    plan: {
      existingDesignId: undefined,
      category: "dress",
      hint: undefined,
      photos: [photo],
      onDesign: vi.fn(),
      onPhoto: (_id: string, update: PhotoUpdate) => updates.push(update.kind),
      sleep: instant,
      ...extra,
    },
  };
}

describe("withRetry", () => {
  it("retries twice and then gives up", async () => {
    const action = vi.fn().mockRejectedValue(new Error("x"));
    await expect(withRetry(action, instant)).rejects.toThrow("x");
    expect(action).toHaveBeenCalledTimes(3);
  });
  it("returns the first success", async () => {
    const action = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue("ok");
    await expect(withRetry(action, instant)).resolves.toBe("ok");
  });
});

describe("startAnalysis", () => {
  it("creates the design, uploads and requests the analysis with the hint", async () => {
    api.apiRequest.mockReset().mockImplementation((path: string) => {
      if (path === "/designs") return Promise.resolve({ id: "d1" });
      if (path.endsWith("/photos")) return Promise.resolve({ uploads: [{ slot: "front", signedUrl: "u" }] });
      return Promise.resolve({ status: "pending" });
    });
    api.uploadToSignedUrl.mockReset().mockResolvedValue(undefined);
    const { plan: p, updates } = plan({ hint: "skirt", category: "skirt" });
    await expect(startAnalysis(p)).resolves.toBe("d1");
    const analyze = api.apiRequest.mock.calls.find(([path]) => String(path).endsWith("/analyze"));
    expect(analyze?.[1]).toMatchObject({ body: { categoryHint: "skirt" } });
    expect(updates).toContain("uploaded");
  });

  it("reuses the design of an earlier try and skips the photo request when nothing is left to upload", async () => {
    api.apiRequest.mockReset().mockResolvedValue({ status: "pending" });
    const { plan: p } = plan({ existingDesignId: "d0", photos: [] });
    await expect(startAnalysis(p)).resolves.toBe("d0");
    expect(api.apiRequest).toHaveBeenCalledTimes(1);
  });

  it("marks the photo failed and stops before the analysis when an upload keeps failing", async () => {
    api.apiRequest
      .mockReset()
      .mockImplementation((path: string) =>
        Promise.resolve(
          path === "/designs" ? { id: "d1" } : { uploads: [{ slot: "front", signedUrl: "u" }] },
        ),
      );
    api.uploadToSignedUrl.mockReset().mockRejectedValue(new Error("net"));
    const { plan: p, updates } = plan();
    await expect(startAnalysis(p)).rejects.toThrow("net");
    expect(updates).toContain("failed");
    expect(api.apiRequest.mock.calls.some(([path]) => String(path).endsWith("/analyze"))).toBe(false);
  });
});
