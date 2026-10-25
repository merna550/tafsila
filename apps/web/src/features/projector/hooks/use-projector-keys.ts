"use client";
/** Listens for the projector keys on the whole window and passes the matching action on (issue #286). */
import { useEffect } from "react";
import { keyAction, type ProjectorAction } from "../model/keymap";

/** Elements that keep their own arrow and letter keys. */
const OWN_KEYS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Binds the keys while enabled.
 *
 * @param onAction - Called with the action of each handled key press.
 * @param enabled - False while a window is open, so keys do not move the pattern behind it.
 */
export function useProjectorKeys(onAction: (action: ProjectorAction) => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    /**
     * Handles one key press.
     *
     * @param event - The keyboard event.
     */
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (event.ctrlKey || event.metaKey || (target && OWN_KEYS.has(target.tagName))) return;
      const action = keyAction(event);
      if (!action) return;
      event.preventDefault();
      onAction(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAction, enabled]);
}
