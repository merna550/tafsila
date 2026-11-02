"use client";
/** Hook that keeps the prepared blobs and their preview addresses, and frees the addresses on removal and unmount. */
import { useCallback, useEffect, useRef, useState } from "react";

/** What the hook gives its caller. */
export interface PreparedPhotos {
  /** Preview address per photo id. */
  readonly previews: Readonly<Record<string, string>>;
  /** Stores the prepared blob of a photo and makes its preview. */
  readonly store: (id: string, blob: Blob) => void;
  /** Frees a photo's blob and preview. */
  readonly forget: (id: string) => void;
  /** Reads the prepared blob of a photo. */
  readonly blobOf: (id: string) => Blob | undefined;
}

/**
 * Keeps blobs and previews of the prepared photos.
 *
 * @returns The previews and the store, forget and read actions.
 */
export function usePreparedPhotos(): PreparedPhotos {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const blobs = useRef(new Map<string, Blob>());
  const latest = useRef(previews);
  latest.current = previews;

  useEffect(
    () => () => {
      for (const url of Object.values(latest.current)) URL.revokeObjectURL(url);
    },
    [],
  );

  const store = useCallback((id: string, blob: Blob): void => {
    blobs.current.set(id, blob);
    setPreviews((current) => ({ ...current, [id]: URL.createObjectURL(blob) }));
  }, []);

  const forget = useCallback((id: string): void => {
    blobs.current.delete(id);
    const url = latest.current[id];
    if (url) URL.revokeObjectURL(url);
    setPreviews((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
  }, []);

  const blobOf = useCallback((id: string): Blob | undefined => blobs.current.get(id), []);
  return { previews, store, forget, blobOf };
}
