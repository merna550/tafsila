/**
 * UserFilesRemover on the Supabase Storage REST API: lists everything under `<userId>/` in each registered bucket
 * (folders included) and removes it in chunks. One of only two files that may hold the service role key.
 */
import { STORAGE_BUCKETS } from "../../domain/storage-buckets";
import type { UserFilesRemover } from "../../ports/user-files-remover";

/** What the adapter needs to reach Supabase Storage as an admin. */
export interface FilesRemoverConfig {
  readonly supabaseUrl: string;
  readonly serviceRoleKey: string;
  /** Buckets to clean (defaults to the registry). */
  readonly buckets?: readonly string[];
  /** Replaceable in tests. */
  readonly fetchImpl?: typeof fetch;
}

/** Entries requested per list call and objects removed per delete call. */
const PAGE_SIZE = 100;

/** An owner id is a UUID; anything else could widen the listing to other users' files. */
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One entry of a Storage listing: a file has an id, a folder does not. */
interface StorageEntry {
  readonly name: string;
  readonly id: string | null;
}

/**
 * Creates the Storage-backed UserFilesRemover.
 *
 * @param config - Project URL, service role key, optional bucket list and fetch.
 * @returns A UserFilesRemover.
 */
export function createStorageFilesRemover(config: FilesRemoverConfig): UserFilesRemover {
  const doFetch = config.fetchImpl ?? fetch;
  const base = `${config.supabaseUrl.replace(/\/$/, "")}/storage/v1/object`;
  const buckets = config.buckets ?? STORAGE_BUCKETS;
  const headers = {
    "content-type": "application/json",
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
  };

  /**
   * Calls Storage and fails with the status only.
   *
   * @param url - Full URL.
   * @param init - Method and body.
   * @returns The response.
   */
  const call = async (url: string, init: RequestInit): Promise<Response> => {
    const response = await doFetch(url, { ...init, headers });
    if (!response.ok) throw new Error(`Storage request failed with ${response.status}`);
    return response;
  };

  /**
   * Lists every file path under a prefix, walking folders and pages.
   *
   * @param bucket - Bucket name.
   * @param prefix - Folder path without a trailing slash.
   * @returns File paths inside the bucket.
   */
  const listFiles = async (bucket: string, prefix: string): Promise<string[]> => {
    const paths: string[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const response = await call(`${base}/list/${encodeURIComponent(bucket)}`, {
        method: "POST",
        body: JSON.stringify({ prefix, limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } }),
      });
      const entries = (await response.json()) as StorageEntry[];
      for (const entry of entries) {
        const path = `${prefix}/${entry.name}`;
        if (entry.id === null) paths.push(...(await listFiles(bucket, path)));
        else paths.push(path);
      }
      if (entries.length < PAGE_SIZE) return paths;
    }
  };

  return {
    async removeAll(userId) {
      if (!USER_ID.test(userId)) throw new Error("removeAll needs a user id (UUID)");
      for (const bucket of buckets) {
        const paths = await listFiles(bucket, userId);
        for (let i = 0; i < paths.length; i += PAGE_SIZE) {
          await call(`${base}/${encodeURIComponent(bucket)}`, {
            method: "DELETE",
            body: JSON.stringify({ prefixes: paths.slice(i, i + PAGE_SIZE) }),
          });
        }
      }
    },
  };
}
