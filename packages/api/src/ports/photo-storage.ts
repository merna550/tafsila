/** Photo storage port: signed upload and read URLs and removal for the private design-photos bucket. Used only after ownership is checked. */

/** A signed upload target for one object. */
export interface SignedUpload {
  readonly path: string;
  readonly signedUrl: string;
  readonly token: string;
}

/** A short-lived read URL for one object. */
export interface SignedRead {
  readonly path: string;
  readonly url: string;
}

/** Stores design photos. Paths are `<userId>/<designId>/<slot>.<ext>`. */
export interface PhotoStorage {
  /**
   * Creates signed upload URLs; uploading to an existing path replaces the object.
   *
   * @param paths - Object paths.
   * @returns One signed target per path, in order.
   * @throws {Error} When storage fails.
   */
  createUploadUrls(paths: readonly string[]): Promise<SignedUpload[]>;
  /**
   * Creates short-lived read URLs. Paths with no object are left out.
   *
   * @param paths - Object paths.
   * @param expiresInSeconds - Lifetime of the URLs.
   * @returns The URLs of the objects that exist.
   * @throws {Error} When storage fails.
   */
  signedReadUrls(paths: readonly string[], expiresInSeconds: number): Promise<SignedRead[]>;
  /**
   * Removes objects; a missing object is success.
   *
   * @param paths - Object paths.
   * @throws {Error} When storage fails.
   */
  remove(paths: readonly string[]): Promise<void>;
  /**
   * Removes every object of one design.
   *
   * @param userId - Owner.
   * @param designId - Design.
   * @throws {Error} When storage fails.
   */
  removeDesign(userId: string, designId: string): Promise<void>;
}
