/** Turns anything thrown by the engine into the error shape both workers post (issues #239 and #289). */
import { DraftingError, INPUT_ERROR_MESSAGES, isInputError } from "@tafsila/engine";
import type { PreviewWorkerError } from "./protocol";

/**
 * Maps a thrown value to a message the page can route.
 *
 * @param error - The thrown value.
 * @returns A stable code, a log message and, for input errors, bilingual text.
 */
export function toWorkerError(error: unknown): PreviewWorkerError {
  const message = error instanceof Error ? error.message : String(error);
  if (isInputError(error)) {
    const text = INPUT_ERROR_MESSAGES[error.code];
    return { code: error.code, message, messageAr: text.ar, messageEn: text.en };
  }
  return { code: error instanceof DraftingError ? error.code : "ENGINE_CRASH", message };
}
