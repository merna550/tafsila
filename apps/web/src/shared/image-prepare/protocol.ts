/** Messages between the page and the image-prepare worker. */
import type { ImagePrepareCode } from "./prepare-image";

/** Request: prepare this file. */
export interface PrepareRequest {
  readonly id: number;
  readonly file: File;
}

/** Answer: the prepared blob or the failure code. */
export type PrepareResponse =
  { readonly id: number; readonly blob: Blob } | { readonly id: number; readonly code: ImagePrepareCode };
