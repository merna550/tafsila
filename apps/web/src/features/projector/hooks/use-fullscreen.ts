"use client";
/** Fullscreen for the projector pages: browsers only allow it from a click, so the page offers a button (issue #285). */
import { useCallback, useEffect, useState } from "react";
import type { FullscreenController } from "../model/controllers";

/**
 * Wraps the Fullscreen API of the whole document.
 *
 * @returns Support, state and the two actions.
 */
export function useFullscreen(): FullscreenController {
  const [supported, setSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setSupported(document.fullscreenEnabled === true);
    /** Copies the browser fullscreen state. */
    const sync = (): void => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const enter = useCallback(() => {
    void document.documentElement.requestFullscreen().catch(() => undefined);
  }, []);
  const exit = useCallback(() => {
    void document.exitFullscreen().catch(() => undefined);
  }, []);

  return { supported, isFullscreen, enter, exit };
}
