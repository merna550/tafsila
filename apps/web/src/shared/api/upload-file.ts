/** Upload helper for signed storage URLs: the only non-JSON request of the web app, with progress and cancel (issue #341). */
import { clientApiError, type ApiError } from "./api-error";

/** Options of one signed upload. */
export interface UploadOptions {
  /** Called with a fraction between 0 and 1 while bytes are sent. */
  readonly onProgress?: (fraction: number) => void;
  /** Cancels the upload. */
  readonly signal?: AbortSignal;
  /** Time before the upload is given up, in milliseconds. */
  readonly timeoutMs?: number;
  /** Replaceable request factory, used by tests. */
  readonly createRequest?: () => XMLHttpRequest;
}

/** Default time for one photo upload. */
const UPLOAD_TIMEOUT_MS = 60_000;

/** Status codes of a successful upload: 200 up to, not including, 300. */
const OK_FROM = 200;
const OK_BELOW = 300;

/**
 * PUTs a blob to a signed URL and reports progress; failures are thrown as ApiError.
 *
 * @param url - The signed upload URL.
 * @param blob - The file content.
 * @param options - Progress callback, cancel signal and limits.
 * @returns Resolves when the storage accepted the file.
 * @throws {ApiError} `network` or `timeout` for transport failures, `unknown` for a refused upload.
 */
export function uploadToSignedUrl(url: string, blob: Blob, options: UploadOptions = {}): Promise<void> {
  const {
    onProgress,
    signal,
    timeoutMs = UPLOAD_TIMEOUT_MS,
    createRequest = () => new XMLHttpRequest(),
  } = options;
  return new Promise<void>((resolve, reject) => {
    const request = createRequest();
    /**
     * Rejects with a client error of the given kind.
     *
     * @param kind - Which failure happened.
     * @param status - HTTP status, when there was a response.
     */
    const fail = (kind: "network" | "timeout" | "unknown", status?: number): void => {
      reject(clientApiError(kind, status) satisfies ApiError);
    };
    request.open("PUT", url);
    request.timeout = timeoutMs;
    request.setRequestHeader("content-type", blob.type || "image/jpeg");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= OK_FROM && request.status < OK_BELOW) {
        onProgress?.(1);
        resolve();
      } else fail("unknown", request.status);
    };
    request.onerror = () => fail("network");
    request.ontimeout = () => fail("timeout");
    request.onabort = () => fail("network");
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    if (signal?.aborted) request.abort();
    else request.send(blob);
  });
}
