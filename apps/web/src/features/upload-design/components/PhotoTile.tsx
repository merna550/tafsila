/** One photo of the step: a thumbnail with its slot name, a status line, remove and retry (FR-DES-01). */
import { CloseIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { PhotoItem } from "../model/photo-rules";
import type { PhotoSlot } from "@tafsila/schemas";

/** Props for {@link PhotoTile}. */
interface PhotoTileProps {
  readonly item: PhotoItem;
  readonly slot: PhotoSlot;
  /** Address of the prepared preview, once there is one. */
  readonly previewUrl: string | undefined;
  /** Removes the photo; unavailable while or after it uploads. */
  readonly onRemove: (id: string) => void;
}

/**
 * Renders a thumbnail with status and a remove button.
 *
 * @param props - The photo, its slot, the preview and the remove handler.
 * @returns The tile.
 */
export function PhotoTile({ item, slot, previewUrl, onRemove }: Readonly<PhotoTileProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  const failed = item.status === "failed";
  const removable = item.status === "ready" || failed;
  const percent = Math.round(item.progress * 100);
  return (
    <figure className="m-0 flex w-28 flex-col gap-1" data-testid="photo-tile" data-status={item.status}>
      <div
        className={`relative flex size-28 items-center justify-center overflow-hidden rounded-md bg-surface-hover ${failed ? "opacity-60" : ""}`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={t("photoAlt", { slot: t(`slot.${slot}`) })}
            className="size-full object-cover"
          />
        ) : null}
        {removable ? (
          <button
            type="button"
            aria-label={t("remove")}
            onClick={() => onRemove(item.id)}
            className="absolute start-1 top-1 flex size-11 items-center justify-center text-text"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-surface shadow-card">
              <CloseIcon className="size-4" />
            </span>
          </button>
        ) : null}
      </div>
      <figcaption className="text-sm text-muted">
        <span className="font-semibold text-text">{t(`slot.${slot}`)}</span>
        {item.status === "preparing" ? <span role="status"> · {t("preparing")}</span> : null}
        {item.status === "uploading" ? (
          <span role="status"> · {t("uploading", { percent: String(percent) })}</span>
        ) : null}
      </figcaption>
      {item.errorKey ? (
        <p role="alert" className="m-0 text-sm text-danger">
          {t(`errors.${item.errorKey}`)}
        </p>
      ) : null}
    </figure>
  );
}
