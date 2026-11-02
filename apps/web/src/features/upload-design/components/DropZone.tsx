"use client";
/** The empty state of the photo area: a dashed drop zone with the "Choose photos" button (FR-DES-01). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link DropZone}. */
interface DropZoneProps {
  /** True while a file is dragged over the zone. */
  readonly dragging: boolean;
  readonly disabled: boolean;
  /** Opens the file picker. */
  readonly onChoose: () => void;
}

/**
 * Renders the empty drop zone.
 *
 * @param props - The drag state and the choose handler.
 * @returns The zone.
 */
export function DropZone({ dragging, disabled, onChoose }: Readonly<DropZoneProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  const tone = dragging ? "border-primary bg-primary-soft" : "border-border bg-surface";
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-5 py-8 text-center ${tone}`}
    >
      <h2 className="m-0 text-xl font-semibold">{t("dropTitle")}</h2>
      <p className="m-0 max-w-md text-base text-muted">{t("dropHint")}</p>
      <Button onClick={onChoose} disabled={disabled}>
        {t("choose")}
      </Button>
    </div>
  );
}
