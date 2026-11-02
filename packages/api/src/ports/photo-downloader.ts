/** Photo downloader port: reads the bytes behind a short-lived signed URL, so the job can strip metadata before the provider sees them. */

/** A downloaded photo. */
export interface DownloadedPhoto {
  readonly bytes: Uint8Array;
}

/** Downloads photos. */
export interface PhotoDownloader {
  /**
   * Downloads one photo.
   *
   * @param url - A signed read URL.
   * @returns The bytes.
   * @throws {Error} When the download fails or the photo is larger than the upload limit.
   */
  download(url: string): Promise<DownloadedPhoto>;
}
