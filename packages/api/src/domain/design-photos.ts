/** Rules for design photos: what may be uploaded, where it is stored and how a stored path maps back to a slot. No I/O. */
import { MAX_PHOTO_BYTES, MAX_PHOTOS, type CreatePhotoUploadsInput, type PhotoSlot } from "@tafsila/schemas";
import { AppError } from "./errors";

/** File extension per accepted content type (HEIC is converted to JPEG in the browser, so it is not listed). */
const EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** A photo about to be uploaded: its slot and the object path it will live at. */
export interface PlannedPhoto {
  readonly slot: PhotoSlot;
  readonly path: string;
}

/**
 * Builds the object path of a photo, `<userId>/<designId>/<slot>.<ext>` (the first folder is the owner, so account deletion covers it).
 *
 * @param userId - Owner.
 * @param designId - Design.
 * @param slot - Photo slot.
 * @param extension - File extension without a dot.
 * @returns The path inside the bucket.
 */
export function photoPath(userId: string, designId: string, slot: PhotoSlot, extension: string): string {
  return `${userId}/${designId}/${slot}.${extension}`;
}

/**
 * Reads the slot out of a stored path.
 *
 * @param path - A path made by {@link photoPath}.
 * @returns The slot, or undefined for a path that does not follow the layout.
 */
export function slotOfPath(path: string): PhotoSlot | undefined {
  const name = path.split("/").pop() ?? "";
  const slot = name.slice(0, name.lastIndexOf("."));
  return slot === "front" || slot === "back" || slot === "side" ? slot : undefined;
}

/**
 * Checks an upload request and decides the object path of each photo.
 *
 * @param userId - Owner.
 * @param designId - Design.
 * @param existingPaths - Paths already stored on the design.
 * @param input - The requested photos.
 * @returns One planned photo per request item, in request order.
 * @throws {AppError} PHOTO_LIMIT_REACHED, PHOTO_TYPE_NOT_ALLOWED, PHOTO_TOO_LARGE or PHOTO_FRONT_REQUIRED.
 */
export function planPhotoUploads(
  userId: string,
  designId: string,
  existingPaths: readonly string[],
  input: CreatePhotoUploadsInput,
): PlannedPhoto[] {
  if (input.photos.length > MAX_PHOTOS) throw new AppError("PHOTO_LIMIT_REACHED");
  const planned = input.photos.map((item): PlannedPhoto => {
    const extension = EXTENSIONS[item.contentType.toLowerCase()];
    if (!extension) throw new AppError("PHOTO_TYPE_NOT_ALLOWED");
    if (item.sizeBytes > MAX_PHOTO_BYTES) throw new AppError("PHOTO_TOO_LARGE");
    return { slot: item.slot, path: photoPath(userId, designId, item.slot, extension) };
  });
  const hasFront =
    planned.some((photo) => photo.slot === "front") || existingPaths.some((p) => slotOfPath(p) === "front");
  if (!hasFront) throw new AppError("PHOTO_FRONT_REQUIRED");
  return planned;
}

/**
 * Merges new photos into the stored paths: a new photo replaces the one in the same slot.
 *
 * @param existingPaths - Paths stored now.
 * @param planned - Photos being uploaded.
 * @returns The new path list and the old paths that were replaced under a different name (their objects can go).
 */
export function mergePhotoPaths(
  existingPaths: readonly string[],
  planned: readonly PlannedPhoto[],
): { paths: string[]; stale: string[] } {
  const replacedSlots = new Set(planned.map((photo) => photo.slot));
  const kept = existingPaths.filter((path) => !replacedSlots.has(slotOfPath(path) as PhotoSlot));
  const newPaths = planned.map((photo) => photo.path);
  const stale = existingPaths.filter((path) => !kept.includes(path) && !newPaths.includes(path));
  return { paths: [...kept, ...newPaths], stale };
}
