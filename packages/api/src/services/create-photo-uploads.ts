/** Use case: sign upload URLs for 1 to 3 photos of a design and record their paths (FR-DES-01). */
import type { CreatePhotoUploadsInput, PhotoUploadsResponse } from "@tafsila/schemas";
import { mergePhotoPaths, planPhotoUploads } from "../domain/design-photos";
import { NotFoundError } from "../domain/errors";
import type { DesignRepository } from "../ports/design-repository";
import type { PhotoStorage } from "../ports/photo-storage";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Creates signed upload URLs and stores the paths; a photo in an occupied slot replaces the old one.
 *
 * @param deps - Design repository and photo storage.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param input - The requested photos.
 * @returns One signed upload per requested photo.
 * @throws {NotFoundError} When the design is missing or not the caller's.
 * @throws {AppError} PHOTO_LIMIT_REACHED, PHOTO_TYPE_NOT_ALLOWED, PHOTO_TOO_LARGE or PHOTO_FRONT_REQUIRED.
 */
export async function createPhotoUploads(
  deps: { readonly designs: DesignRepository; readonly photoStorage: PhotoStorage },
  ctx: AuthContext,
  designId: string,
  input: CreatePhotoUploadsInput,
): Promise<PhotoUploadsResponse> {
  const existing = await deps.designs.getPhotoPaths(ctx, designId);
  if (!existing) throw new NotFoundError("design");
  const planned = planPhotoUploads(ctx.userId, designId, existing, input);
  const signed = await deps.photoStorage.createUploadUrls(planned.map((photo) => photo.path));
  const { paths, stale } = mergePhotoPaths(existing, planned);
  if (!(await deps.designs.setPhotoPaths(ctx, designId, paths))) throw new NotFoundError("design");
  if (stale.length > 0) await deps.photoStorage.remove(stale);
  return {
    uploads: planned.map((photo, index) => ({
      slot: photo.slot,
      path: photo.path,
      signedUrl: signed[index]?.signedUrl ?? "",
      token: signed[index]?.token ?? "",
    })),
  };
}
