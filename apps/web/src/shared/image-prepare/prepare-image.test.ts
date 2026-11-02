import { describe, expect, it, vi, afterEach } from "vitest";
import { ImagePrepareError, isHeic, pickCanvasKind, prepareImage, scaledSize } from "./prepare-image";

afterEach(() => vi.unstubAllGlobals());

describe("scaledSize", () => {
  it("scales 3000x2000 to 1600x1067", () => {
    expect(scaledSize({ width: 3000, height: 2000 })).toEqual({ width: 1600, height: 1067 });
  });
  it("scales portrait photos by the long edge", () => {
    expect(scaledSize({ width: 2000, height: 4000 })).toEqual({ width: 800, height: 1600 });
  });
  it("never enlarges a small photo", () => {
    expect(scaledSize({ width: 1200, height: 800 })).toEqual({ width: 1200, height: 800 });
  });
});

describe("isHeic", () => {
  it("recognises HEIC by type or extension", () => {
    expect(isHeic({ name: "a.jpg", type: "image/heic" })).toBe(true);
    expect(isHeic({ name: "IMG_1.HEIC", type: "" })).toBe(true);
    expect(isHeic({ name: "a.png", type: "image/png" })).toBe(false);
  });
});

describe("pickCanvasKind", () => {
  it("prefers OffscreenCanvas, then the DOM canvas", () => {
    expect(pickCanvasKind({ offscreen: true, document: true })).toBe("offscreen");
    expect(pickCanvasKind({ offscreen: false, document: true })).toBe("dom");
    expect(pickCanvasKind({ offscreen: false, document: false })).toBe("none");
  });
});

describe("prepareImage decode failures", () => {
  it("reports HEIC the browser cannot decode with its own code", async () => {
    vi.stubGlobal("createImageBitmap", () => Promise.reject(new Error("no decoder")));
    const file = new File(["x"], "IMG_1.HEIC", { type: "image/heic" });
    await expect(prepareImage(file)).rejects.toMatchObject({ code: "heic_unsupported" });
  });
  it("reports other unreadable files", async () => {
    vi.stubGlobal("createImageBitmap", () => Promise.reject(new Error("bad")));
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    const failure = prepareImage(file);
    await expect(failure).rejects.toBeInstanceOf(ImagePrepareError);
    await expect(failure).rejects.toMatchObject({ code: "unreadable" });
  });
});
