/** Use case: list a design's photos with short-lived signed read URLs. */
import type { DesignPhotosResponse } from "@tafsila/schemas";
import { slotOfPath } from "../domain/design-photos";
import { NotFoundError } from "../domain/errors";
import type { DesignRepository } from "../ports/design-repository";
import type { PhotoStorage } from "../ports/photo-storage";
import type { AuthContext } from "../ports/token-verifier";

/** Lifetime of a read URL: five minutes (decision 339). */
export const PHOTO_READ_URL_SECONDS = 300;

/**
 * Lists the photos that exist in storage, front first.
 *
 * @param deps - Design repository and photo storage.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @returns The photos with signed read URLs.
 * @throws {NotFoundError} When the design is missing or not the caller's.
 */
export async function listPhotos(
  deps: { readonly designs: DesignRepository; readonly photoStorage: PhotoStorage },
  ctx: AuthContext,
  designId: string,
): Promise<DesignPhotosResponse> {
  const paths = await deps.designs.getPhotoPaths(ctx, designId);
  if (!paths) throw new NotFoundError("design");
  const signed = await deps.photoStorage.signedReadUrls(paths, PHOTO_READ_URL_SECONDS);
  const photos = signed.flatMap(({ path, url }) => {
    const slot = slotOfPath(path);
    return slot ? [{ slot, path, url }] : [];
  });
  const order = ["front", "back", "side"];
  return { photos: photos.toSorted((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot)) };
}
