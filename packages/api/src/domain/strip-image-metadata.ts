/**
 * Removes location and camera metadata from an image before it leaves for the AI provider (ADR-335, item 6).
 * The browser already strips it before upload; this is the second check. Pure bytes in, bytes out, no I/O.
 */

/** Raised when the bytes are not a JPEG, PNG or WebP image. */
export class UnsupportedImageError extends Error {
  /** Creates the error. */
  constructor() {
    super("Not a JPEG, PNG or WebP image");
    this.name = "UnsupportedImageError";
  }
}

const JPEG_SOI = [0xff, 0xd8];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** JPEG markers dropped: APP1 (Exif and XMP) and APP13 (Photoshop/IPTC). */
const JPEG_DROPPED_MARKERS = new Set([0xe1, 0xed]);
/** JPEG markers that have no length field. */
const JPEG_MARKER_START_OF_SCAN = 0xda;
/** PNG chunks dropped: Exif and every text chunk (XMP travels in `iTXt`). */
const PNG_DROPPED_CHUNKS = new Set(["eXIf", "tEXt", "iTXt", "zTXt"]);
/** WebP chunks dropped. */
const WEBP_DROPPED_CHUNKS = new Set(["EXIF", "XMP "]);
/** VP8X flag bits for Exif and XMP metadata. */
const WEBP_VP8X_METADATA_FLAGS = 0x08 | 0x04;
const MARKER_PREFIX = 0xff;
const BYTE_BITS = 8;

/**
 * Whether the bytes start with the given values.
 *
 * @param bytes - Data to check.
 * @param prefix - Expected first bytes.
 * @returns True when they match.
 */
function startsWith(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

/**
 * Reads four ASCII characters.
 *
 * @param bytes - Data.
 * @param offset - Where the four characters start.
 * @returns The text.
 */
function fourcc(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

/**
 * Joins byte pieces into one array.
 *
 * @param parts - Pieces in order.
 * @returns One array.
 */
function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/**
 * Reads the end offset of the JPEG segment that starts at `offset`.
 *
 * @param bytes - JPEG bytes.
 * @param offset - Start of the marker (`0xff`).
 * @returns The marker byte and the offset just after the segment.
 * @throws {UnsupportedImageError} When the marker is missing or the segment is cut short.
 */
function jpegSegmentEnd(bytes: Uint8Array, offset: number): { marker: number; end: number } {
  const marker = bytes[offset + 1];
  if (bytes[offset] !== MARKER_PREFIX || marker === undefined) throw new UnsupportedImageError();
  if (marker === JPEG_MARKER_START_OF_SCAN) return { marker, end: bytes.length };
  const length = ((bytes[offset + 2] ?? 0) << BYTE_BITS) | (bytes[offset + 3] ?? 0);
  const end = offset + 2 + length;
  if (length < 2 || end > bytes.length) throw new UnsupportedImageError();
  return { marker, end };
}

/**
 * Drops APP1 and APP13 segments of a JPEG; the image data (from the start-of-scan marker) is copied untouched.
 *
 * @param bytes - JPEG bytes.
 * @returns The cleaned bytes, or the same array when nothing was dropped.
 * @throws {UnsupportedImageError} When a segment is cut short.
 */
function stripJpeg(bytes: Uint8Array): Uint8Array {
  const kept: Uint8Array[] = [bytes.subarray(0, JPEG_SOI.length)];
  let dropped = false;
  let offset = JPEG_SOI.length;
  while (offset < bytes.length) {
    const { marker, end } = jpegSegmentEnd(bytes, offset);
    if (marker === JPEG_MARKER_START_OF_SCAN) {
      kept.push(bytes.subarray(offset));
      break;
    }
    if (JPEG_DROPPED_MARKERS.has(marker)) dropped = true;
    else kept.push(bytes.subarray(offset, end));
    offset = end;
  }
  return dropped ? concat(kept) : bytes;
}

/**
 * Drops Exif and text chunks of a PNG.
 *
 * @param bytes - PNG bytes.
 * @returns The cleaned bytes, or the same array when nothing was dropped.
 * @throws {UnsupportedImageError} When a chunk is cut short.
 */
function stripPng(bytes: Uint8Array): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [bytes.subarray(0, PNG_SIGNATURE.length)];
  let dropped = false;
  let offset = PNG_SIGNATURE.length;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new UnsupportedImageError();
    const end = offset + 12 + view.getUint32(offset);
    if (end > bytes.length) throw new UnsupportedImageError();
    if (PNG_DROPPED_CHUNKS.has(fourcc(bytes, offset + 4))) dropped = true;
    else kept.push(bytes.subarray(offset, end));
    offset = end;
  }
  return dropped ? concat(kept) : bytes;
}

/**
 * Drops Exif and XMP chunks of a WebP, clears their flags in the VP8X header and fixes the RIFF size.
 *
 * @param bytes - WebP bytes.
 * @returns The cleaned bytes, or the same array when nothing was dropped.
 * @throws {UnsupportedImageError} When a chunk is cut short.
 */
function stripWebp(bytes: Uint8Array): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const header = 12;
  const kept: Uint8Array[] = [];
  let dropped = false;
  let offset = header;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new UnsupportedImageError();
    const size = view.getUint32(offset + 4, true);
    const end = offset + 8 + size + (size % 2);
    if (end > bytes.length + (size % 2)) throw new UnsupportedImageError();
    const chunk = bytes.slice(offset, Math.min(end, bytes.length));
    if (WEBP_DROPPED_CHUNKS.has(fourcc(bytes, offset))) dropped = true;
    else {
      if (fourcc(bytes, offset) === "VP8X" && chunk.length > 8)
        chunk[8] = (chunk[8] ?? 0) & ~WEBP_VP8X_METADATA_FLAGS;
      kept.push(chunk);
    }
    offset = end;
  }
  if (!dropped) return bytes;
  const out = concat([bytes.slice(0, header), ...kept]);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return out;
}

/**
 * Removes metadata (GPS, camera, text) from a JPEG, PNG or WebP. The kind is read from the bytes, not from a name or type.
 *
 * @param bytes - Image bytes.
 * @returns Bytes with no metadata chunk; the same array when there was none.
 * @throws {UnsupportedImageError} When the bytes are not one of the three formats or are cut short.
 * @example
 * const clean = stripImageMetadata(await readFile("photo.jpg"));
 */
export function stripImageMetadata(bytes: Uint8Array): Uint8Array {
  if (startsWith(bytes, JPEG_SOI)) return stripJpeg(bytes);
  if (startsWith(bytes, PNG_SIGNATURE)) return stripPng(bytes);
  if (fourcc(bytes, 0) === "RIFF" && fourcc(bytes, 8) === "WEBP") return stripWebp(bytes);
  throw new UnsupportedImageError();
}
