"use client";
/** Hook that makes the browser ask before the page is closed or reloaded while there is unsaved work. */
import { useEffect } from "react";

/**
 * Registers the browser's "leave this page?" prompt while `active` is true.
 *
 * @param active - True while edits are unsaved.
 */
export function useLeaveWarning(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    /**
     * Asks the browser to confirm leaving.
     *
     * @param event - The unload event.
     * @returns Nothing.
     */
    const warn = (event: BeforeUnloadEvent): void => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
}
