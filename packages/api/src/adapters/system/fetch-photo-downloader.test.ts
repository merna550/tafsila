import { describe, expect, it } from "vitest";
import { createFetchPhotoDownloader } from "./fetch-photo-downloader";

describe("fetch photo downloader", () => {
  it("returns the bytes of an ok response", async () => {
    const downloader = createFetchPhotoDownloader(() =>
      Promise.resolve(new Response(new Uint8Array([1, 2, 3]))),
    );
    expect([...(await downloader.download("https://x.test/p")).bytes]).toEqual([1, 2, 3]);
  });

  it("fails on a bad status and on an oversized photo", async () => {
    const missing = createFetchPhotoDownloader(() => Promise.resolve(new Response("no", { status: 404 })));
    await expect(missing.download("https://x.test/p")).rejects.toThrow(/404/);
    const huge = createFetchPhotoDownloader(() => Promise.resolve(new Response(new Uint8Array(10_485_761))));
    await expect(huge.download("https://x.test/p")).rejects.toThrow(/larger/);
  });
});
