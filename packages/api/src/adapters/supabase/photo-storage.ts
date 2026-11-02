/** PhotoStorage on the Supabase Storage REST API (private bucket design-photos): signed upload and read URLs and removal. */
import type { PhotoStorage } from "../../ports/photo-storage";
import { encodeObjectPath, type StorageRest } from "./storage-rest";

/** The private bucket that holds design photos (ADR-021). */
export const DESIGN_PHOTOS_BUCKET = "design-photos";

/** A UUID segment; user and design ids are checked before they build a listing prefix. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One entry of the batch sign answer. */
interface SignedEntry {
  readonly path: string;
  readonly signedURL: string | null;
}

/**
 * Creates the Storage-backed PhotoStorage.
 *
 * @param storage - The admin Storage client.
 * @returns A PhotoStorage.
 */
export function createSupabasePhotoStorage(storage: StorageRest): PhotoStorage {
  const bucket = encodeURIComponent(DESIGN_PHOTOS_BUCKET);
  return {
    createUploadUrls: (paths) =>
      Promise.all(
        paths.map(async (path) => {
          const response = await storage.call(
            `/object/upload/sign/${bucket}/${encodeObjectPath(path)}`,
            { method: "POST", body: {} },
            { "x-upsert": "true" },
          );
          const { url } = (await response.json()) as { url: string };
          const signedUrl = `${storage.root}${url}`;
          return { path, signedUrl, token: new URL(signedUrl).searchParams.get("token") ?? "" };
        }),
      ),
    async signedReadUrls(paths, expiresInSeconds) {
      if (paths.length === 0) return [];
      const response = await storage.call(`/object/sign/${bucket}`, {
        method: "POST",
        body: { expiresIn: expiresInSeconds, paths },
      });
      const entries = (await response.json()) as SignedEntry[];
      return entries.flatMap((entry) =>
        entry.signedURL ? [{ path: entry.path, url: `${storage.root}${entry.signedURL}` }] : [],
      );
    },
    remove: (paths) => storage.removePaths(DESIGN_PHOTOS_BUCKET, paths),
    async removeDesign(userId, designId) {
      if (!UUID.test(userId) || !UUID.test(designId)) throw new Error("removeDesign needs UUID ids");
      const prefix = `${userId}/${designId}`;
      await storage.removePaths(DESIGN_PHOTOS_BUCKET, await storage.listFiles(DESIGN_PHOTOS_BUCKET, prefix));
    },
  };
}
