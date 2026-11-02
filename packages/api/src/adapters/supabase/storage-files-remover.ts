/**
 * UserFilesRemover on the Supabase Storage REST API: lists everything under `<userId>/` in each registered bucket
 * (folders included) and removes it in chunks. Uses the shared admin Storage client.
 */
import { STORAGE_BUCKETS } from "../../domain/storage-buckets";
import type { UserFilesRemover } from "../../ports/user-files-remover";
import { createStorageRest, type StorageRestConfig } from "./storage-rest";

/** What the adapter needs to reach Supabase Storage as an admin. */
export interface FilesRemoverConfig extends StorageRestConfig {
  /** Buckets to clean (defaults to the registry). */
  readonly buckets?: readonly string[];
}

/** An owner id is a UUID; anything else could widen the listing to other users' files. */
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates the Storage-backed UserFilesRemover.
 *
 * @param config - Project URL, service role key, optional bucket list and fetch.
 * @returns A UserFilesRemover.
 */
export function createStorageFilesRemover(config: FilesRemoverConfig): UserFilesRemover {
  const storage = createStorageRest(config);
  const buckets = config.buckets ?? STORAGE_BUCKETS;
  return {
    async removeAll(userId) {
      if (!USER_ID.test(userId)) throw new Error("removeAll needs a user id (UUID)");
      for (const bucket of buckets)
        await storage.removePaths(bucket, await storage.listFiles(bucket, userId));
    },
  };
}
