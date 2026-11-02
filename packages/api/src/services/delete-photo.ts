/** Use case: remove one photo of a design (NFR-05, delete on request). */
import type { PhotoSlot } from "@tafsila/schemas";
import { slotOfPath } from "../domain/design-photos";
import { AppError, NotFoundError } from "../domain/errors";
import type { DesignRepository } from "../ports/design-repository";
import type { PhotoStorage } from "../ports/photo-storage";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Removes the object of a slot, then its path. The front photo can only be replaced, not removed, while other photos remain.
 *
 * @param deps - Design repository and photo storage.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param slot - Slot to clear.
 * @throws {NotFoundError} When the design is missing or not the caller's.
 * @throws {AppError} PHOTO_NOT_FOUND when the slot has no photo; PHOTO_FRONT_REQUIRED when removing front would leave others.
 */
export async function deletePhoto(
  deps: { readonly designs: DesignRepository; readonly photoStorage: PhotoStorage },
  ctx: AuthContext,
  designId: string,
  slot: PhotoSlot,
): Promise<void> {
  const paths = await deps.designs.getPhotoPaths(ctx, designId);
  if (!paths) throw new NotFoundError("design");
  const target = paths.filter((path) => slotOfPath(path) === slot);
  if (target.length === 0) throw new AppError("PHOTO_NOT_FOUND");
  const rest = paths.filter((path) => !target.includes(path));
  if (slot === "front" && rest.length > 0) throw new AppError("PHOTO_FRONT_REQUIRED");
  await deps.photoStorage.remove(target);
  await deps.designs.setPhotoPaths(ctx, designId, rest);
}
