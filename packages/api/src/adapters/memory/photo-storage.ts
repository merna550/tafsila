/** In-memory PhotoStorage for tests: objects live in a set, signed URLs are fake strings. */
import type { PhotoStorage } from "../../ports/photo-storage";

/** The storage plus the objects it holds. */
export interface MemoryPhotoStorage extends PhotoStorage {
  /** Paths of the stored objects; `createUploadUrls` does not add one, tests call `put` to mimic the browser upload. */
  readonly objects: Set<string>;
  /**
   * Mimics the browser uploading a file to a signed path.
   *
   * @param path - Object path.
   */
  put(path: string): void;
}

/**
 * Creates the in-memory photo storage.
 *
 * @param objects - Shared object set (defaults to a new one); pass the account-deletion fake's files to cover account removal.
 * @returns The storage.
 */
export function createMemoryPhotoStorage(objects: Set<string> = new Set()): MemoryPhotoStorage {
  return {
    objects,
    put: (path) => {
      objects.add(path);
    },
    createUploadUrls: (paths) =>
      Promise.resolve(
        paths.map((path) => ({ path, signedUrl: `memory://upload/${path}?token=t`, token: "t" })),
      ),
    signedReadUrls: (paths, expiresInSeconds) =>
      Promise.resolve(
        paths
          .filter((path) => objects.has(path))
          .map((path) => ({ path, url: `memory://read/${path}?expires=${expiresInSeconds}` })),
      ),
    remove(paths) {
      for (const path of paths) objects.delete(path);
      return Promise.resolve();
    },
    removeDesign(userId, designId) {
      for (const path of [...objects]) if (path.startsWith(`${userId}/${designId}/`)) objects.delete(path);
      return Promise.resolve();
    },
  };
}
