/** Starts a browser download of bytes the worker made (issue #289). */

/** How long the object URL stays valid after the click, in milliseconds. */
const REVOKE_DELAY_MS = 1000;

/**
 * Downloads bytes as a file through a temporary link.
 *
 * @param bytes - The file content.
 * @param fileName - The name the browser saves it under.
 * @param mime - The media type.
 */
export function downloadBytes(bytes: ArrayBuffer, fileName: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
