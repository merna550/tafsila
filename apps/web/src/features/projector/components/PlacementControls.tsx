"use client";
/** The Rotate 180 and Reset buttons of the projector, with their keys (issue #287). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props of {@link PlacementControls}. */
export interface PlacementControlsProps {
  /** True when a piece is active, so it can be turned. */
  readonly hasActive: boolean;
  /** Turns the active piece by 180 degrees. */
  readonly onRotate: () => void;
  /** Puts every piece back. */
  readonly onReset: () => void;
}

/**
 * The two buttons.
 *
 * @param props - See {@link PlacementControlsProps}.
 * @returns The button row.
 */
export function PlacementControls(props: Readonly<PlacementControlsProps>): ReactElement {
  const t = useTranslations("projector.pieces");
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        disabled={!props.hasActive}
        aria-keyshortcuts="R"
        title={props.hasActive ? undefined : t("rotateNeedsPiece")}
        onClick={props.onRotate}
      >
        {t("rotate")}
      </Button>
      <Button variant="secondary" aria-keyshortcuts="0" onClick={props.onReset}>
        {t("reset")}
      </Button>
    </div>
  );
}
