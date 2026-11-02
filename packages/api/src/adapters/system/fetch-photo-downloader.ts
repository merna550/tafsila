/** PhotoDownloader over `fetch`: reads a signed URL with a timeout and a size cap (the upload limit, 10 MB). */
import { MAX_PHOTO_BYTES } from "@tafsila/schemas";
import type { PhotoDownloader } from "../../ports/photo-downloader";

/** Longest a photo download may take. */
const DOWNLOAD_TIMEOUT_MS = 20_000;

/**
 * Creates the downloader.
 *
 * @param fetchImpl - The fetch function (defaults to the global one; tests pass a fake).
 * @returns A PhotoDownloader.
 */
export function createFetchPhotoDownloader(fetchImpl: typeof fetch = fetch): PhotoDownloader {
  return {
    async download(url) {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Photo download failed with status ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > MAX_PHOTO_BYTES) throw new Error("Photo is larger than the upload limit");
      return { bytes };
    },
  };
}
