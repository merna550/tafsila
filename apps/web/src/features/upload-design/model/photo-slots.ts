/** Reducer of the photo list: add, finish, fail, replace, remove and upload progress, with no React. */
import { MAX_PHOTOS } from "@tafsila/schemas";
import type { PhotoErrorKey, PhotoItem } from "./photo-rules";

/** Actions the photo list understands. */
export type PhotoAction =
  | { readonly type: "add"; readonly id: string }
  | { readonly type: "prepared"; readonly id: string }
  | { readonly type: "failed"; readonly id: string; readonly errorKey: PhotoErrorKey }
  | { readonly type: "remove"; readonly id: string }
  | {
      readonly type: "status";
      readonly id: string;
      readonly status: PhotoItem["status"];
      readonly errorKey?: PhotoErrorKey;
    }
  | { readonly type: "progress"; readonly id: string; readonly progress: number };

/**
 * Applies one action to the photo list; the list never holds more than 3 photos.
 *
 * @param items - The current photos.
 * @param action - What happened.
 * @returns The next list.
 */
export function photoReducer(items: readonly PhotoItem[], action: PhotoAction): readonly PhotoItem[] {
  switch (action.type) {
    case "add":
      return items.length >= MAX_PHOTOS
        ? items
        : [...items, { id: action.id, status: "preparing", progress: 0 }];
    case "prepared":
      return patch(items, action.id, { status: "ready" });
    case "failed":
      return patch(items, action.id, { status: "failed", errorKey: action.errorKey });
    case "remove":
      return items.filter((item) => item.id !== action.id);
    case "status":
      return items.map((item) =>
        item.id === action.id ? withStatus(item, action.status, action.errorKey) : item,
      );
    case "progress":
      return patch(items, action.id, { progress: action.progress });
  }
}

/**
 * Changes fields of one photo.
 *
 * @param items - The photos.
 * @param id - Which photo.
 * @param fields - The new field values.
 * @returns The list with the change.
 */
function patch(items: readonly PhotoItem[], id: string, fields: Partial<PhotoItem>): readonly PhotoItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...fields } : item));
}

/**
 * Sets the status of a photo; the error text is kept only when the new status brings one.
 *
 * @param item - The photo.
 * @param status - The new status.
 * @param errorKey - The error message key, if any.
 * @returns The changed photo.
 */
function withStatus(item: PhotoItem, status: PhotoItem["status"], errorKey?: PhotoErrorKey): PhotoItem {
  return { id: item.id, status, progress: item.progress, ...(errorKey === undefined ? {} : { errorKey }) };
}
