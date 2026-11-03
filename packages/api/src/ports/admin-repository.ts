/** Admin repository port: users and stats for the mini admin. Counts only, never measurements or notes (NFR-05). */
import type {
  AdminPageQuery,
  AdminSharedDesign,
  AdminStats,
  AdminUnsupportedFeature,
  AdminUser,
  AdminUserDetail,
  ListAdminUsersQuery,
  Page,
} from "@tafsila/schemas";

/** A shared design as the database returns it: photo paths, not yet signed. */
export type SharedDesignRecord = Omit<AdminSharedDesign, "photos"> & {
  readonly photoPaths: readonly string[];
};

/** Reads what only an admin may see. Every method re-checks the admin in the database. */
export interface AdminRepository {
  /**
   * Counts users, verified phones, sign-ups and clients.
   *
   * @param adminId - Id of the verified admin.
   * @returns The numbers.
   * @throws {AppError} FORBIDDEN when `adminId` is not an admin in the database.
   */
  stats(adminId: string): Promise<AdminStats>;
  /**
   * Lists users, newest first, with search and the verified-phone filter.
   *
   * @param adminId - Id of the verified admin.
   * @param query - Search, filter and paging.
   * @returns One page with the total.
   * @throws {AppError} FORBIDDEN when `adminId` is not an admin in the database.
   */
  list(adminId: string, query: ListAdminUsersQuery): Promise<Page<AdminUser>>;
  /**
   * Reads one user.
   *
   * @param adminId - Id of the verified admin.
   * @param id - The user to read.
   * @returns The user, or undefined when none has that id.
   * @throws {AppError} FORBIDDEN when `adminId` is not an admin in the database.
   */
  get(adminId: string, id: string): Promise<AdminUserDetail | undefined>;
  /**
   * Lists designs of owners who agreed to share, newest first: spec of the current version, never measurements. Writes an audit row.
   *
   * @param adminId - Id of the verified admin.
   * @param query - Paging.
   * @returns One page with the total.
   * @throws {AppError} FORBIDDEN when `adminId` is not an admin in the database.
   */
  listSharedDesigns(adminId: string, query: AdminPageQuery): Promise<Page<SharedDesignRecord>>;
  /**
   * Lists unsupported-feature texts, newest first, without user or design ids. Writes an audit row.
   *
   * @param adminId - Id of the verified admin.
   * @param query - Paging.
   * @returns One page with the total.
   * @throws {AppError} FORBIDDEN when `adminId` is not an admin in the database.
   */
  listUnsupportedFeatures(adminId: string, query: AdminPageQuery): Promise<Page<AdminUnsupportedFeature>>;
}
