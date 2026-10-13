/** User files remover port: deletes every stored file that belongs to a user (design photos and later buckets). */

/** Removes a user's files from storage. */
export interface UserFilesRemover {
  /**
   * Removes every object under `<userId>/` in each registered bucket. Finding nothing is success, so repeating is safe.
   *
   * @param userId - The owner of the files.
   * @throws {Error} When storage fails.
   */
  removeAll(userId: string): Promise<void>;
}
