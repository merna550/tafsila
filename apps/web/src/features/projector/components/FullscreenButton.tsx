"use client";
/** The button that enters or leaves fullscreen; hidden where the browser has no Fullscreen API (issue #285). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { FullscreenController } from "../model/controllers";

/**
 * Renders the fullscreen toggle.
 *
 * @param props - The fullscreen controller.
 * @param props.fullscreen - Support, state and actions.
 * @returns The button, or nothing when fullscreen is not supported.
 */
export function FullscreenButton({
  fullscreen,
}: Readonly<{ fullscreen: FullscreenController }>): ReactElement | null {
  const t = useTranslations("projector.calibrate");
  if (!fullscreen.supported) return null;
  return (
    <Button variant="secondary" onClick={fullscreen.isFullscreen ? fullscreen.exit : fullscreen.enter}>
      {t(fullscreen.isFullscreen ? "fullscreenExit" : "fullscreenEnter")}
    </Button>
  );
}
