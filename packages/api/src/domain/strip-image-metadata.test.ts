import { describe, expect, it } from "vitest";
import { stripImageMetadata, UnsupportedImageError } from "./strip-image-metadata";

// A JPEG segment: marker, length (counts itself) and payload.
function segment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...payload];
}

const ascii = (text: string): number[] => [...text].map((c) => c.charCodeAt(0));
const EXIF_GPS = [...ascii("Exif"), 0, 0, ...ascii("GPSLatitude=30.04N")];
const SCAN = [0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0xff, 0x00, 0x33, 0xff, 0xd9];
const clean = [0xff, 0xd8, ...segment(0xdb, [1, 2, 3]), ...SCAN];
const withExif = [0xff, 0xd8, ...segment(0xe1, EXIF_GPS), ...segment(0xdb, [1, 2, 3]), ...SCAN];

// Whether the bytes contain the text.
function contains(bytes: Uint8Array, text: string): boolean {
  return Buffer.from(bytes).includes(text);
}

describe("stripImageMetadata: JPEG", () => {
  it("drops the Exif segment and keeps everything else byte for byte", () => {
    const out = stripImageMetadata(Uint8Array.from(withExif));
    expect(contains(out, "GPSLatitude")).toBe(false);
    expect([...out]).toEqual(clean);
  });

  it("drops APP13 (IPTC) too", () => {
    const iptc = [0xff, 0xd8, ...segment(0xed, ascii("Photoshop 3.0")), ...SCAN];
    expect([...stripImageMetadata(Uint8Array.from(iptc))]).toEqual([0xff, 0xd8, ...SCAN]);
  });

  it("returns a clean JPEG unchanged", () => {
    const input = Uint8Array.from(clean);
    expect(stripImageMetadata(input)).toBe(input);
  });

  it("rejects a cut-off segment and a broken marker", () => {
    expect(() => stripImageMetadata(Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x40, 1]))).toThrow(
      UnsupportedImageError,
    );
    expect(() => stripImageMetadata(Uint8Array.from([0xff, 0xd8, 0x00, 0x01]))).toThrow(
      UnsupportedImageError,
    );
  });
});

// A PNG chunk with a zeroed CRC (the stripper never reads it).
function pngChunk(type: string, data: number[]): number[] {
  const length = data.length;
  return [
    length >>> 24,
    (length >> 16) & 0xff,
    (length >> 8) & 0xff,
    length & 0xff,
    ...ascii(type),
    ...data,
    0,
    0,
    0,
    0,
  ];
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("stripImageMetadata: PNG", () => {
  const ihdr = pngChunk("IHDR", [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
  const idat = pngChunk("IDAT", [1, 2, 3]);
  const iend = pngChunk("IEND", []);

  it("drops eXIf and text chunks and keeps the image chunks", () => {
    const input = [
      ...PNG_SIG,
      ...ihdr,
      ...pngChunk("eXIf", EXIF_GPS),
      ...pngChunk("tEXt", ascii("a\0gps")),
      ...idat,
      ...iend,
    ];
    const out = stripImageMetadata(Uint8Array.from(input));
    expect([...out]).toEqual([...PNG_SIG, ...ihdr, ...idat, ...iend]);
  });

  it("returns a clean PNG unchanged and rejects a cut-off chunk", () => {
    const input = Uint8Array.from([...PNG_SIG, ...ihdr, ...idat, ...iend]);
    expect(stripImageMetadata(input)).toBe(input);
    expect(() => stripImageMetadata(Uint8Array.from([...PNG_SIG, 0, 0, 0, 99, ...ascii("IDAT")]))).toThrow(
      UnsupportedImageError,
    );
  });
});

// A WebP chunk (little-endian size, padded to even).
function webpChunk(type: string, data: number[]): number[] {
  const size = data.length;
  return [...ascii(type), size & 0xff, (size >> 8) & 0xff, 0, 0, ...data, ...(size % 2 ? [0] : [])];
}

// A RIFF/WebP file around the chunks.
function webp(chunks: number[][]): Uint8Array {
  const body = [...ascii("WEBP"), ...chunks.flat()];
  const size = body.length;
  return Uint8Array.from([...ascii("RIFF"), size & 0xff, (size >> 8) & 0xff, 0, 0, ...body]);
}

describe("stripImageMetadata: WebP", () => {
  const vp8x = webpChunk("VP8X", [0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const vp8 = webpChunk("VP8 ", [1, 2, 3, 4, 5]);

  it("drops EXIF and XMP, clears the flags and fixes the RIFF size", () => {
    const out = stripImageMetadata(
      webp([vp8x, vp8, webpChunk("EXIF", EXIF_GPS), webpChunk("XMP ", ascii("<x/>"))]),
    );
    expect(contains(out, "GPSLatitude")).toBe(false);
    expect(new DataView(out.buffer).getUint32(4, true)).toBe(out.length - 8);
    expect(out[20]).toBe(0);
    expect(contains(out, "VP8 ")).toBe(true);
  });

  it("returns a clean WebP unchanged", () => {
    const input = webp([vp8]);
    expect(stripImageMetadata(input)).toBe(input);
  });
});

describe("stripImageMetadata: other bytes", () => {
  it("rejects garbage and empty input without crashing", () => {
    expect(() => stripImageMetadata(Uint8Array.from([1, 2, 3, 4]))).toThrow(UnsupportedImageError);
    expect(() => stripImageMetadata(new Uint8Array())).toThrow(UnsupportedImageError);
    expect(() => stripImageMetadata(Uint8Array.from(ascii("GIF89a")))).toThrow(UnsupportedImageError);
  });
});
