/// <reference lib="webworker" />
/** Web Worker that decodes, resizes and re-encodes photos off the main thread (issue #341). */
import { ImagePrepareError, prepareImage } from "./prepare-image";
import type { PrepareRequest, PrepareResponse } from "./protocol";

self.onmessage = async (event: MessageEvent<PrepareRequest>): Promise<void> => {
  const { id, file } = event.data;
  let response: PrepareResponse;
  try {
    response = { id, blob: await prepareImage(file) };
  } catch (error) {
    response = { id, code: error instanceof ImagePrepareError ? error.code : "unreadable" };
  }
  self.postMessage(response);
};
