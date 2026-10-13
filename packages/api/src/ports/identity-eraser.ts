/** Identity eraser port: asks the analytics provider to forget the person behind an opaque user id. */

/** Erases a person from analytics. */
export interface IdentityEraser {
  /**
   * Deletes the person whose distinct id is the user id, with their events.
   *
   * @param userId - The opaque user id used as the analytics distinct id.
   * @throws {Error} When the provider fails.
   */
  erase(userId: string): Promise<void>;
}
