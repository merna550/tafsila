/** E2E photo helpers: a generated JPEG with a GPS EXIF block, and a spy that keeps what the page uploads (issue #341). */
import type { Page } from "@playwright/test";
import { hasExif } from "../../src/shared/image-prepare/exif";

/** What the spy keeps about one upload. */
export interface CapturedUpload {
  readonly width: number;
  readonly height: number;
  readonly bytes: Buffer;
  readonly type: string;
}

/** Marker of the APP1 segment as hex. */
const APP1_MARKER = "ffe1";

/** Bytes of the segment length field. */
const LENGTH_BYTES = 2;

/** JPEG quality of the generated fixture. */
const FIXTURE_QUALITY = 0.9;

/** Bytes of the start-of-image marker. */
const SOI_BYTES = 2;

/**
 * Builds an APP1 segment holding a tiny EXIF block with an empty GPS directory.
 *
 * @returns The segment bytes, marker included.
 */
function gpsExifSegment(): Buffer {
  const tiff = Buffer.from(
    // TIFF header (IFD0 at 8), one entry GPSInfo -> offset 26, no next IFD, an empty GPS IFD.
    "49492a000800000001002588040001000000" + "1a000000" + "00000000" + "000000000000",
    "hex",
  );
  const body = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
  const length = Buffer.alloc(LENGTH_BYTES);
  length.writeUInt16BE(body.length + LENGTH_BYTES);
  return Buffer.concat([Buffer.from(APP1_MARKER, "hex"), length, body]);
}

/**
 * Draws a JPEG in the browser and adds a GPS EXIF block to it.
 *
 * @param page - Any page of the app (a canvas is needed).
 * @param width - Pixel width.
 * @param height - Pixel height.
 * @returns The JPEG file content.
 */
export async function jpegWithGps(page: Page, width: number, height: number): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    ({ w, h, quality }) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#0e6b65";
        context.fillRect(0, 0, w, h);
        context.fillStyle = "#eba83f";
        context.fillRect(w / 2, h / 2, w, h);
      }
      return canvas.toDataURL("image/jpeg", quality);
    },
    { w: width, h: height, quality: FIXTURE_QUALITY },
  );
  const jpeg = Buffer.from(dataUrl.split(",")[1] ?? "", "base64");
  const withExif = Buffer.concat([jpeg.subarray(0, SOI_BYTES), gpsExifSegment(), jpeg.subarray(SOI_BYTES)]);
  if (!hasExif(withExif)) throw new Error("the fixture must carry EXIF");
  return withExif;
}

/**
 * Makes the page keep every blob it sends with XMLHttpRequest (the signed uploads).
 *
 * @param page - The page, before it navigates.
 */
export async function spyOnUploads(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store: Blob[] = [];
    (window as unknown as { __uploads: Blob[] }).__uploads = store;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called back with the right `this` below
    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body?: XMLHttpRequestBodyInit | null): void {
      if (body instanceof Blob) store.push(body);
      send.call(this, body);
    };
  });
}

/**
 * Reads what the spy kept: size in pixels, type and bytes of each upload.
 *
 * @param page - The page.
 * @returns One entry per upload.
 */
export async function capturedUploads(page: Page): Promise<CapturedUpload[]> {
  const raw = await page.evaluate(async () => {
    const blobs = (window as unknown as { __uploads: Blob[] }).__uploads;
    return Promise.all(
      blobs.map(async (blob) => {
        const bitmap = await createImageBitmap(blob);
        const buffer = new Uint8Array(await blob.arrayBuffer());
        let text = "";
        for (const byte of buffer) text += String.fromCharCode(byte);
        return { width: bitmap.width, height: bitmap.height, type: blob.type, base64: btoa(text) };
      }),
    );
  });
  return raw.map((item) => ({ ...item, bytes: Buffer.from(item.base64, "base64") }));
}
