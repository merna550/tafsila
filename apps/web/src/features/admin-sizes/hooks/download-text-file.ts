/** Hands a text file to the browser as a download (browser API, so it lives outside the pure model). */

/**
 * Starts a download of `content` under `fileName`.
 *
 * @param fileName - Name the browser suggests.
 * @param content - File text.
 * @param type - Media type.
 */
export function downloadTextFile(fileName: string, content: string, type = "text/csv;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
