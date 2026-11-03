/** Use cases: the admin lists of shared designs and unsupported features (FR-ADM-03, ADR-365 item 11). */
import type { AdminPageQuery, AdminSharedDesign, AdminUnsupportedFeature, Page } from "@tafsila/schemas";
import type { AdminRepository } from "../ports/admin-repository";
import type { PhotoStorage } from "../ports/photo-storage";
import type { AuthContext } from "../ports/token-verifier";

/** Lifetime of an admin photo URL: five minutes (ADR-369). */
export const ADMIN_PHOTO_URL_SECONDS = 300;

/**
 * Lists designs of consenting owners with signed photo URLs; photos with no stored object are left out.
 *
 * @param deps - Admin repository and photo storage.
 * @param ctx - Verified admin (the database checks it again).
 * @param query - Paging.
 * @returns One page of shared designs.
 */
export async function listAdminSharedDesigns(
  deps: { readonly admin: AdminRepository; readonly photoStorage: PhotoStorage },
  ctx: AuthContext,
  query: AdminPageQuery,
): Promise<Page<AdminSharedDesign>> {
  const page = await deps.admin.listSharedDesigns(ctx.userId, query);
  const paths = page.items.flatMap((item) => item.photoPaths);
  const signed =
    paths.length === 0 ? [] : await deps.photoStorage.signedReadUrls(paths, ADMIN_PHOTO_URL_SECONDS);
  const urlOf = new Map(signed.map(({ path, url }) => [path, url]));
  const items = page.items.map(({ photoPaths, ...design }) => ({
    ...design,
    photos: photoPaths.flatMap((path) => {
      const url = urlOf.get(path);
      return url === undefined ? [] : [{ path, url }];
    }),
  }));
  return { ...page, items };
}

/**
 * Lists unsupported-feature texts (no user or design ids).
 *
 * @param deps - Admin repository.
 * @param ctx - Verified admin.
 * @param query - Paging.
 * @returns One page of rows.
 */
export function listAdminUnsupportedFeatures(
  deps: { readonly admin: AdminRepository },
  ctx: AuthContext,
  query: AdminPageQuery,
): Promise<Page<AdminUnsupportedFeature>> {
  return deps.admin.listUnsupportedFeatures(ctx.userId, query);
}
