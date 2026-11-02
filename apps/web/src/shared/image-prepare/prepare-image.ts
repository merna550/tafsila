/** Resizes a photo to at most 1600 px on the long edge and re-encodes it to JPEG, which drops every metadata block including GPS (FR-DES-01, NFR-05). */
import { MAX_PHOTO_BYTES } from "@tafsila/schemas";

/** Longest edge of a prepared photo, in pixels. */
export const MAX_EDGE_PX = 1600;

/** JPEG quality of the re-encode. */
export const JPEG_QUALITY = 0.85;

/** Content type of every prepared photo. */
export const PREPARED_TYPE = "image/jpeg";

/** Why a photo could not be prepared. */
export type ImagePrepareCode = "unreadable" | "heic_unsupported" | "output_too_large";

/** Error thrown by {@link prepareImage}; the code picks the message shown to the user. */
export class ImagePrepareError extends Error {
  /**
   * Builds the error.
   *
   * @param code - Why preparing failed.
   */
  constructor(readonly code: ImagePrepareCode) {
    super(code);
    this.name = "ImagePrepareError";
  }
}

/** Width and height in pixels. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Scales a size down so its long edge is at most `maxEdge`; smaller images are never enlarged.
 *
 * @param size - The decoded size.
 * @param maxEdge - Longest edge allowed.
 * @returns The target size, rounded to whole pixels (at least 1).
 */
export function scaledSize(size: Size, maxEdge: number = MAX_EDGE_PX): Size {
  const longEdge = Math.max(size.width, size.height);
  if (longEdge <= maxEdge) return size;
  const ratio = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  };
}

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

/**
 * Tells whether a file is HEIC or HEIF, by content type or extension.
 *
 * @param file - The chosen file.
 * @returns True for HEIC and HEIF files.
 */
export function isHeic(file: Pick<File, "name" | "type">): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** What the environment offers for drawing; the worker has no `document`. */
export interface CanvasSupport {
  readonly offscreen: boolean;
  readonly document: boolean;
}

/** Which way the photo is drawn and encoded. */
export type CanvasKind = "offscreen" | "dom" | "none";

/**
 * Picks the canvas to use: OffscreenCanvas when present, the main-thread canvas otherwise (older Safari).
 *
 * @param support - What the environment has.
 * @returns The kind to use.
 */
export function pickCanvasKind(support: CanvasSupport): CanvasKind {
  if (support.offscreen) return "offscreen";
  return support.document ? "dom" : "none";
}

/**
 * Detects the canvas support of the current global scope.
 *
 * @returns Offscreen and document availability.
 */
export function detectCanvasSupport(): CanvasSupport {
  return { offscreen: typeof OffscreenCanvas !== "undefined", document: typeof document !== "undefined" };
}

/**
 * Decodes a file with the EXIF orientation applied.
 *
 * @param file - The chosen photo.
 * @returns The decoded bitmap.
 * @throws {ImagePrepareError} `heic_unsupported` for a HEIC this browser cannot decode, `unreadable` otherwise.
 */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImagePrepareError(isHeic(file) ? "heic_unsupported" : "unreadable");
  }
}

/**
 * Draws the bitmap at the target size and encodes it to JPEG.
 *
 * @param bitmap - The decoded photo.
 * @param target - The size to draw at.
 * @param kind - Canvas to use.
 * @returns The encoded blob.
 */
async function encode(bitmap: ImageBitmap, target: Size, kind: CanvasKind): Promise<Blob> {
  if (kind === "offscreen") {
    const canvas = new OffscreenCanvas(target.width, target.height);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, target.width, target.height);
    return canvas.convertToBlob({ type: PREPARED_TYPE, quality: JPEG_QUALITY });
  }
  if (kind === "dom") {
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, target.width, target.height);
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new ImagePrepareError("unreadable"))),
        PREPARED_TYPE,
        JPEG_QUALITY,
      ),
    );
  }
  throw new ImagePrepareError("unreadable");
}

/**
 * Prepares one photo for upload: decode, scale to at most 1600 px, re-encode to JPEG without metadata.
 *
 * @param file - The chosen photo.
 * @param support - Canvas support; defaults to the current scope.
 * @returns The JPEG blob, at most 10 MB.
 * @throws {ImagePrepareError} When the photo cannot be read or the result is still too large.
 */
export async function prepareImage(
  file: File,
  support: CanvasSupport = detectCanvasSupport(),
): Promise<Blob> {
  const bitmap = await decode(file);
  try {
    const blob = await encode(bitmap, scaledSize(bitmap), pickCanvasKind(support));
    if (blob.size > MAX_PHOTO_BYTES) throw new ImagePrepareError("output_too_large");
    return blob;
  } finally {
    bitmap.close();
  }
}
