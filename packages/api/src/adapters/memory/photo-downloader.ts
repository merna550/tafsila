/** In-memory PhotoDownloader for tests: serves fixed bytes (a JPEG with a GPS block by default) and records what was asked. */
import type { PhotoDownloader } from "../../ports/photo-downloader";

/** The downloader plus the URLs it served and a failure switch. */
export interface MemoryPhotoDownloader extends PhotoDownloader {
  /** URLs downloaded, in order. */
  readonly urls: string[];
  /** The bytes served for every URL. */
  bytes: Uint8Array;
  /** When true the next downloads fail. */
  failing: boolean;
}

/** A tiny JPEG whose Exif segment holds a GPS text, to prove it is stripped before the provider is called. */
export const JPEG_WITH_GPS = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x0c, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x47, 0x50, 0x53, 0x21, 0xff, 0xda,
  0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0xff, 0xd9,
]);

/**
 * Creates the in-memory downloader.
 *
 * @returns The downloader.
 */
export function createMemoryPhotoDownloader(): MemoryPhotoDownloader {
  const state: MemoryPhotoDownloader = {
    urls: [],
    bytes: JPEG_WITH_GPS,
    failing: false,
    download(url) {
      state.urls.push(url);
      if (state.failing) return Promise.reject(new Error("download failed"));
      return Promise.resolve({ bytes: state.bytes });
    },
  };
  return state;
}
