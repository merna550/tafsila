/** In-memory admin lists of shared designs and unsupported features; read the fake users, designs and versions like the SQL functions. */
import type { AdminRepository, SharedDesignRecord } from "../../ports/admin-repository";
import { AppError } from "../../domain/errors";
import { newestFirst, type MemoryStore } from "./memory-store";
import type { UnsupportedFeatureRow } from "./unsupported-feature-repository";

/**
 * The database re-checks the admin inside every function; so does the fake.
 *
 * @param store - Shared fake database.
 * @param adminId - Caller id.
 * @throws {AppError} FORBIDDEN when the caller is not an admin in `users`.
 */
export function assertMemoryAdmin(store: MemoryStore, adminId: string): void {
  if (store.users.find((user) => user.id === adminId)?.role !== "admin") throw new AppError("FORBIDDEN");
}

/**
 * Creates the two list methods.
 *
 * @param store - Shared fake database.
 * @param now - Time source for the audit rows.
 * @param features - The unsupported-feature rows the analysis recorded (kept outside the store).
 * @returns The list methods of AdminRepository.
 */
export function createMemoryAdminDesigns(
  store: MemoryStore,
  now: () => Date,
  features: readonly UnsupportedFeatureRow[],
): Pick<AdminRepository, "listSharedDesigns" | "listUnsupportedFeatures"> {
  /**
   * Writes the audit row every admin list call leaves.
   *
   * @param adminId - The admin.
   * @param action - Audit action name.
   */
  const audit = (adminId: string, action: string): void => {
    store.audit.push({
      who: adminId,
      action,
      target: "",
      before: null,
      after: null,
      at: now().toISOString(),
    });
  };
  return {
    listSharedDesigns: (adminId, query) => {
      assertMemoryAdmin(store, adminId);
      audit(adminId, "admin.designs.list");
      const shared = newestFirst(
        store.designs.filter(
          (design) =>
            store.profiles.get(design.ownerId)?.shareDesigns === true &&
            store.versions.some((version) => version.id === design.currentVersionId),
        ),
      );
      const items = shared.slice(query.offset, query.offset + query.limit).map((design) => {
        const version = store.versions.find((row) => row.id === design.currentVersionId);
        const owner = store.users.find((row) => row.id === design.ownerId);
        return {
          designId: design.id,
          category: design.category,
          title: design.title,
          currentSpec: version?.spec as SharedDesignRecord["currentSpec"],
          createdAt: design.createdAt,
          ownerDisplayName: owner?.name ?? store.profiles.get(design.ownerId)?.name ?? null,
          photoPaths: [...(design.photoPaths ?? [])],
        };
      });
      return Promise.resolve({ items, total: shared.length, limit: query.limit, offset: query.offset });
    },
    listUnsupportedFeatures: (adminId, query) => {
      assertMemoryAdmin(store, adminId);
      audit(adminId, "admin.unsupported.list");
      const all = features
        .flatMap((row) => {
          const design = store.designs.find((d) => d.id === row.designId);
          return design ? [{ text: row.text, category: design.category, createdAt: row.createdAt }] : [];
        })
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
      return Promise.resolve({
        items: all.slice(query.offset, query.offset + query.limit),
        total: all.length,
        limit: query.limit,
        offset: query.offset,
      });
    },
  };
}
