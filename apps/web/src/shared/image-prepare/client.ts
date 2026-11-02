/** Page-side entry of image preparation: uses the worker when the browser can draw off-screen, else the main thread. */
import { detectCanvasSupport, ImagePrepareError, prepareImage } from "./prepare-image";
import type { PrepareRequest, PrepareResponse } from "./protocol";

let worker: Worker | null = null;
let nextId = 0;

/**
 * Creates the worker once; Next bundles it as its own chunk.
 *
 * @returns The shared worker.
 */
function getWorker(): Worker {
  worker ??= new Worker(new URL("./image-prepare.worker.ts", import.meta.url), { type: "module" });
  return worker;
}

/**
 * Sends one file to the worker and waits for its answer.
 *
 * @param file - The chosen photo.
 * @returns The prepared blob.
 */
function runInWorker(file: File): Promise<Blob> {
  const id = nextId++;
  const instance = getWorker();
  return new Promise<Blob>((resolve, reject) => {
    /**
     * Settles the promise when the answer for this request arrives.
     *
     * @param event - The worker message.
     */
    const onMessage = (event: MessageEvent<PrepareResponse>): void => {
      if (event.data.id !== id) return;
      instance.removeEventListener("message", onMessage);
      if ("blob" in event.data) resolve(event.data.blob);
      else reject(new ImagePrepareError(event.data.code));
    };
    instance.addEventListener("message", onMessage);
    instance.addEventListener("error", () => reject(new ImagePrepareError("unreadable")), { once: true });
    instance.postMessage({ id, file } satisfies PrepareRequest);
  });
}

/**
 * Prepares a photo for upload (resize to 1600 px, JPEG, no metadata) in a worker when possible.
 *
 * @param file - The chosen photo.
 * @returns The prepared JPEG blob.
 * @throws {ImagePrepareError} When the photo cannot be read or is too large after the re-encode.
 */
export function preparePhoto(file: File): Promise<Blob> {
  const support = detectCanvasSupport();
  if (support.offscreen && typeof Worker !== "undefined") return runInWorker(file);
  return prepareImage(file, support);
}
