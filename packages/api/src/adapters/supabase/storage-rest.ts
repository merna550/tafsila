/**
 * Thin client for the Supabase Storage REST API as an admin, shared by the files remover and the photo storage adapter.
 * It is one of only three files that may hold the service role key (decision 27a, 8), so the key never reaches a route or a service.
 */

/** What the client needs to reach Supabase Storage as an admin. */
export interface StorageRestConfig {
  readonly supabaseUrl: string;
  readonly serviceRoleKey: string;
  /** Replaceable in tests. */
  readonly fetchImpl?: typeof fetch;
}

/** One entry of a Storage listing: a file has an id, a folder does not. */
interface StorageEntry {
  readonly name: string;
  readonly id: string | null;
}

/** Entries requested per list call and objects removed per delete call. */
export const STORAGE_PAGE_SIZE = 100;

/** Calls against Storage; every failure carries the status only, never a body or a key. */
export interface StorageRest {
  /** Storage API root, e.g. `http://127.0.0.1:54321/storage/v1`. */
  readonly root: string;
  /**
   * Calls a Storage endpoint with the admin key.
   *
   * @param path - Path below the root, starting with `/`.
   * @param init - Method and body (a body object is sent as JSON).
   * @param extraHeaders - Headers added to the defaults.
   * @returns The successful response.
   * @throws {Error} With the status when Storage answers an error.
   */
  call(
    path: string,
    init: { method: string; body?: unknown },
    extraHeaders?: Record<string, string>,
  ): Promise<Response>;
  /**
   * Lists every file path under a prefix, walking folders and pages.
   *
   * @param bucket - Bucket name.
   * @param prefix - Folder path without a trailing slash.
   * @returns File paths inside the bucket.
   */
  listFiles(bucket: string, prefix: string): Promise<string[]>;
  /**
   * Removes objects in chunks; a missing object is success.
   *
   * @param bucket - Bucket name.
   * @param paths - Object paths.
   */
  removePaths(bucket: string, paths: readonly string[]): Promise<void>;
}

/**
 * Creates the Storage client.
 *
 * @param config - Project URL, service role key and optional fetch.
 * @returns A StorageRest.
 */
export function createStorageRest(config: StorageRestConfig): StorageRest {
  const doFetch = config.fetchImpl ?? fetch;
  const root = `${config.supabaseUrl.replace(/\/$/, "")}/storage/v1`;
  const headers = {
    "content-type": "application/json",
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
  };
  const client: StorageRest = {
    root,
    async call(path, init, extraHeaders = {}) {
      const response = await doFetch(`${root}${path}`, {
        method: init.method,
        headers: { ...headers, ...extraHeaders },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      });
      if (!response.ok) throw new Error(`Storage request failed with ${response.status}`);
      return response;
    },
    async listFiles(bucket, prefix) {
      const paths: string[] = [];
      for (let offset = 0; ; offset += STORAGE_PAGE_SIZE) {
        const response = await client.call(`/object/list/${encodeURIComponent(bucket)}`, {
          method: "POST",
          body: { prefix, limit: STORAGE_PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } },
        });
        const entries = (await response.json()) as StorageEntry[];
        for (const entry of entries) {
          const path = `${prefix}/${entry.name}`;
          if (entry.id === null) paths.push(...(await client.listFiles(bucket, path)));
          else paths.push(path);
        }
        if (entries.length < STORAGE_PAGE_SIZE) return paths;
      }
    },
    async removePaths(bucket, paths) {
      for (let i = 0; i < paths.length; i += STORAGE_PAGE_SIZE) {
        await client.call(`/object/${encodeURIComponent(bucket)}`, {
          method: "DELETE",
          body: { prefixes: paths.slice(i, i + STORAGE_PAGE_SIZE) },
        });
      }
    },
  };
  return client;
}

/**
 * Encodes an object path for a URL, keeping the folder slashes.
 *
 * @param path - Object path.
 * @returns The path with every segment encoded.
 */
export function encodeObjectPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}
