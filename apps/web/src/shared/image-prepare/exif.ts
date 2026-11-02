/** Finds EXIF metadata in a JPEG, to verify that the re-encode removed it (NFR-05). Free of imports so the e2e tests can use it. */

/** Start-of-image bytes of every JPEG. */
const JPEG_START = "\xff\xd8";

/** First byte of every segment marker. */
const MARKER_PREFIX = JPEG_START.charCodeAt(0);

/** Position of the 2-byte segment length inside a segment header. */
const LENGTH_AT = 2;

/** Marker byte of the APP1 segment, where EXIF lives. */
const APP1_MARKER = 0xe1;

/** Marker byte of the start of the image data; no metadata follows it. */
const SCAN_MARKER = 0xda;

/** Bytes of a segment header: 0xFF, the marker and a 2-byte length. */
const SEGMENT_HEADER = 4;

/** "Exif" followed by two zero bytes, the start of an EXIF segment's data. */
const EXIF_HEADER = "Exif\0\0";

/** Bits in a byte, used to read the 2-byte segment length. */
const BYTE_BITS = 8;

/**
 * Checks that the bytes at a position match a pattern.
 *
 * @param bytes - The file content.
 * @param at - Position of the first byte to compare.
 * @param pattern - The expected bytes.
 * @returns True when every byte matches.
 */
function matchesAt(bytes: Uint8Array, at: number, pattern: string): boolean {
  return [...pattern].every((char, index) => bytes[at + index] === char.charCodeAt(0));
}

/**
 * Tells whether a JPEG still carries an EXIF block (APP1 with the "Exif" header); used to verify the strip.
 *
 * @param bytes - The file content.
 * @returns True when an EXIF segment is found before the image data.
 */
export function hasExif(bytes: Uint8Array): boolean {
  if (!matchesAt(bytes, 0, JPEG_START)) return false;
  let offset = JPEG_START.length;
  while (offset + SEGMENT_HEADER <= bytes.length && bytes[offset] === MARKER_PREFIX) {
    const marker = bytes[offset + 1];
    if (marker === SCAN_MARKER) return false;
    if (marker === APP1_MARKER && matchesAt(bytes, offset + SEGMENT_HEADER, EXIF_HEADER)) return true;
    const length = ((bytes[offset + LENGTH_AT] ?? 0) << BYTE_BITS) | (bytes[offset + LENGTH_AT + 1] ?? 0);
    offset += JPEG_START.length + length;
  }
  return false;
}
