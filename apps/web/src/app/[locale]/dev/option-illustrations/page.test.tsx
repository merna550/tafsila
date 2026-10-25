/** The dev gallery answers 404 in production (issue #241). */
import { afterEach, describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound }));
const appEnv = vi.fn(() => "production");
vi.mock("@tafsila/config", () => ({ loadPublicConfig: () => ({ appEnv: appEnv() }) }));

describe("option illustrations gallery", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns notFound in production", async () => {
    const { default: Page } = await import("./page");
    expect(() => Page()).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("renders one figure per drawing elsewhere", async () => {
    appEnv.mockReturnValue("development");
    const { default: Page } = await import("./page");
    const { renderToStaticMarkup } = await import("react-dom/server");
    expect(renderToStaticMarkup(Page()).match(/<figure/g)).toHaveLength(60);
  });
});
