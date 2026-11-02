/** The filled state of the photo area: the thumbnails, the "Add photo" tile and the count line (FR-DES-01). */
import { PlusIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { freePlaces, slotAt, type PhotoItem } from "../model/photo-rules";
import { PhotoTile } from "./PhotoTile";

/** Props for {@link PhotoGrid}. */
interface PhotoGridProps {
  readonly items: readonly PhotoItem[];
  readonly previews: Readonly<Record<string, string>>;
  readonly disabled: boolean;
  readonly onChoose: () => void;
  readonly onRemove: (id: string) => void;
}

/**
 * Renders the thumbnails and the add tile.
 *
 * @param props - The photos, previews and handlers.
 * @returns The grid.
 */
export function PhotoGrid({
  items,
  previews,
  disabled,
  onChoose,
  onRemove,
}: Readonly<PhotoGridProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start gap-3">
        {items.map((item, index) => (
          <PhotoTile
            key={item.id}
            item={item}
            slot={slotAt(index)}
            previewUrl={previews[item.id]}
            onRemove={onRemove}
          />
        ))}
        {freePlaces(items.length) > 0 ? (
          <button
            type="button"
            onClick={onChoose}
            disabled={disabled}
            className="flex size-28 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-surface text-base font-semibold text-primary"
          >
            <PlusIcon className="size-5" />
            {t("add")}
          </button>
        ) : null}
      </div>
      <p className="m-0 text-sm text-muted">{t("count", { count: String(items.length) })}</p>
    </div>
  );
}
