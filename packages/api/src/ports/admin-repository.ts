/** Admin repository port: users and stats for the mini admin. Counts only, never measurements or notes (NFR-05). */
import type { AdminStats, AdminUser, AdminUserDetail, ListAdminUsersQuery, Page } from "@tafsila/schemas";

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
}
