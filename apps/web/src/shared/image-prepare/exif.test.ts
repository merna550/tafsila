import { describe, expect, it } from "vitest";
import { hasExif } from "./exif";

/**
 * Builds a minimal JPEG: SOI, optional APP1 Exif segment, then start-of-scan.
 *
 * @param withExif - Whether to include the EXIF segment.
 * @returns The bytes.
 */
function jpeg(withExif: boolean): Uint8Array {
  const exif = [0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  return new Uint8Array([0xff, 0xd8, ...(withExif ? exif : []), 0xff, 0xda, 0x00, 0x02]);
}

describe("hasExif", () => {
  it("finds an EXIF segment and reports its absence", () => {
    expect(hasExif(jpeg(true))).toBe(true);
    expect(hasExif(jpeg(false))).toBe(false);
  });
  it("ignores bytes that are not a JPEG", () => {
    expect(hasExif(new Uint8Array([1, 2, 3, 4, 5]))).toBe(false);
  });
});
