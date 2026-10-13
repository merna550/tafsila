/** Account deleter port: removes the sign-in account; the database then cascades the personal rows. */

/** Deletes auth users. */
export interface AccountDeleter {
  /**
   * Deletes the auth user. Repeating the call for a user that is already gone succeeds.
   *
   * @param userId - The user to delete.
   * @throws {Error} When the provider fails (the request fails with INTERNAL_ERROR; nothing is half-deleted at this step).
   */
  deleteUser(userId: string): Promise<void>;
}
