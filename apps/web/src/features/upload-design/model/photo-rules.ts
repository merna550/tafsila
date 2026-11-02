/** Pure rules for the photo step: which files are accepted, which slot a photo takes and when the analysis may start (FR-DES-01). */
import { MAX_PHOTOS, MAX_PHOTO_BYTES, type PhotoSlot } from "@tafsila/schemas";

/** Slots in the order photos fill them: the first photo is always the front. */
export const SLOT_ORDER: readonly PhotoSlot[] = ["front", "back", "side"];

/** Content types accepted before the resize. */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Extensions accepted when the browser gives no content type (common for HEIC). */
const ACCEPTED_EXTENSION = /\.(jpe?g|png|webp|heic|heif)$/i;

/** Why a chosen file was refused before any work. */
export type FileRejection = "type" | "size";

/** Where one photo stands. */
export type PhotoStatus = "preparing" | "ready" | "uploading" | "uploaded" | "failed";

/** Keys of `uploadDesign.errors`: what can go wrong with a file or a photo. */
export type PhotoErrorKey = "type" | "tooLarge" | "unreadable" | "heic" | "limit" | "uploadFailed";

/** One photo in the step. */
export interface PhotoItem {
  /** Stable id used as the React key. */
  readonly id: string;
  /** Status of the photo. */
  readonly status: PhotoStatus;
  /** Upload progress, 0 to 1. */
  readonly progress: number;
  /** Message key (under `uploadDesign.errors`) when the photo failed or its upload failed. */
  readonly errorKey?: PhotoErrorKey;
}

/**
 * Checks a chosen file by type and by size before the resize.
 *
 * @param file - Name, type and size of the file.
 * @returns The reason it is refused, or null when it is accepted.
 */
export function rejectFile(file: Pick<File, "name" | "type" | "size">): FileRejection | null {
  const typeOk = ACCEPTED_TYPES.includes(file.type.toLowerCase()) || ACCEPTED_EXTENSION.test(file.name);
  if (!typeOk) return "type";
  return file.size > MAX_PHOTO_BYTES ? "size" : null;
}

/**
 * Tells how many more photos fit.
 *
 * @param count - Photos already added.
 * @returns The free places, never negative.
 */
export function freePlaces(count: number): number {
  return Math.max(0, MAX_PHOTOS - count);
}

/**
 * Names the slot of the photo at a position: front first, then back, then side.
 *
 * @param index - Position in the list.
 * @returns The slot.
 */
export function slotAt(index: number): PhotoSlot {
  return SLOT_ORDER[index] ?? "side";
}

/**
 * Tells whether the analysis may start: a front photo exists and no photo is still being prepared or has failed.
 *
 * @param items - The photos, front first.
 * @returns True when "Start analysis" is enabled.
 */
export function canStartAnalysis(items: readonly PhotoItem[]): boolean {
  return items.length > 0 && items.every((item) => item.status !== "preparing" && item.status !== "failed");
}
