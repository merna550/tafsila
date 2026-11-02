"use client";
/** Hook that holds the photos of the step: validates and prepares them in the worker (FR-DES-01). */
import { useCallback, useReducer, useRef, useState } from "react";
import { ImagePrepareError, preparePhoto, type ImagePrepareCode } from "@/shared/image-prepare";
import { freePlaces, rejectFile, slotAt, type PhotoErrorKey, type PhotoItem } from "../model/photo-rules";
import { photoReducer, type PhotoAction } from "../model/photo-slots";
import { usePreparedPhotos } from "./use-prepared-photos";
import type { PhotoToUpload } from "./start-analysis";

/** What the hook gives the screen. */
export interface PhotoSlots {
  /** Photos in order, front first. */
  readonly items: readonly PhotoItem[];
  /** Preview address per photo id. */
  readonly previews: Readonly<Record<string, string>>;
  /** Message key of the last refused file, or null. */
  readonly notice: PhotoErrorKey | null;
  /** Adds chosen files, as many as fit. */
  readonly addFiles: (files: readonly File[]) => void;
  /** Removes one photo. */
  readonly remove: (id: string) => void;
  /** Applies an action from the upload sequence. */
  readonly dispatch: (action: PhotoAction) => void;
  /** The prepared photos that are not uploaded yet, with their slots. */
  readonly pending: () => readonly PhotoToUpload[];
}

/** Message key per preparation failure. */
const PREPARE_ERROR_KEYS: Record<ImagePrepareCode, PhotoErrorKey> = {
  heic_unsupported: "heic",
  output_too_large: "tooLarge",
  unreadable: "unreadable",
};

/**
 * Maps a preparation failure to its message key.
 *
 * @param error - What the preparation threw.
 * @returns The key under `uploadDesign.errors`.
 */
function errorKeyOf(error: unknown): PhotoErrorKey {
  return error instanceof ImagePrepareError ? PREPARE_ERROR_KEYS[error.code] : "unreadable";
}

/**
 * Keeps the photos of the step.
 *
 * @returns The photos, previews, notice and actions.
 */
export function usePhotoSlots(): PhotoSlots {
  const [items, dispatch] = useReducer(photoReducer, []);
  const [notice, setNotice] = useState<PhotoErrorKey | null>(null);
  const prepared = usePreparedPhotos();
  const itemsRef = useRef<readonly PhotoItem[]>(items);
  itemsRef.current = items;
  const counter = useRef(0);
  const { store, forget, blobOf } = prepared;

  const prepare = useCallback(
    async (id: string, file: File): Promise<void> => {
      try {
        store(id, await preparePhoto(file));
        dispatch({ type: "prepared", id });
      } catch (error) {
        dispatch({ type: "failed", id, errorKey: errorKeyOf(error) });
      }
    },
    [store],
  );

  const addFiles = useCallback(
    (files: readonly File[]): void => {
      const room = freePlaces(itemsRef.current.length);
      const accepted = files.filter((file) => rejectFile(file) === null);
      const firstRejection = files.map(rejectFile).find((rejection) => rejection !== null);
      if (firstRejection) setNotice(firstRejection === "size" ? "tooLarge" : "type");
      else setNotice(accepted.length > room ? "limit" : null);
      for (const file of accepted.slice(0, room)) {
        const id = `photo-${counter.current++}`;
        dispatch({ type: "add", id });
        void prepare(id, file);
      }
    },
    [prepare],
  );

  const remove = useCallback(
    (id: string): void => {
      forget(id);
      dispatch({ type: "remove", id });
    },
    [forget],
  );

  const pending = useCallback(
    (): readonly PhotoToUpload[] =>
      itemsRef.current.flatMap((item, index) => {
        const blob = blobOf(item.id);
        return blob && item.status !== "uploaded" ? [{ id: item.id, slot: slotAt(index), blob }] : [];
      }),
    [blobOf],
  );

  return { items, previews: prepared.previews, notice, addFiles, remove, dispatch, pending };
}
