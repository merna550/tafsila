/** Public entry of image preparation: resize, strip metadata and re-encode photos in the browser. */
export { preparePhoto } from "./client";
export { ImagePrepareError, isHeic, MAX_EDGE_PX, scaledSize, type ImagePrepareCode } from "./prepare-image";
export { hasExif } from "./exif";
