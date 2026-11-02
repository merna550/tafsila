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
