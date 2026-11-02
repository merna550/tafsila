"use client";
/** The photo area: the drop zone, then the thumbnails; drag-and-drop and the file picker (FR-DES-01). */
import { useTranslations } from "next-intl";
import { useRef, useState, type DragEvent, type ReactElement } from "react";
import type { PhotoErrorKey, PhotoItem } from "../model/photo-rules";
import { DropZone } from "./DropZone";
import { FileInput } from "./FileInput";
import { PhotoGrid } from "./PhotoGrid";

/** Props for {@link PhotoPicker}. */
interface PhotoPickerProps {
  readonly items: readonly PhotoItem[];
  readonly previews: Readonly<Record<string, string>>;
  /** Message key of the last refused file, or null. */
  readonly notice: PhotoErrorKey | null;
  readonly disabled: boolean;
  readonly onAdd: (files: readonly File[]) => void;
  readonly onRemove: (id: string) => void;
}

/**
 * Renders the drop zone or the thumbnails, the hidden file input and the notice.
 *
 * @param props - The photos, previews, notice and handlers.
 * @returns The picker.
 */
export function PhotoPicker({
  items,
  previews,
  notice,
  disabled,
  onAdd,
  onRemove,
}: Readonly<PhotoPickerProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  /** Opens the file picker. */
  const choose = (): void => {
    input.current?.click();
  };
  /**
   * Adds the files dropped on the area.
   *
   * @param event - The drop event.
   */
  const drop = (event: DragEvent): void => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) onAdd([...event.dataTransfer.files]);
  };
  return (
    <div
      className="flex flex-col gap-3"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
    >
      <FileInput inputRef={input} onFiles={onAdd} />
      {items.length === 0 ? (
        <DropZone dragging={dragging} disabled={disabled} onChoose={choose} />
      ) : (
        <PhotoGrid
          items={items}
          previews={previews}
          disabled={disabled}
          onChoose={choose}
          onRemove={onRemove}
        />
      )}
      {notice ? (
        <p
          role="alert"
          className="m-0 rounded-md border border-danger bg-accent-soft px-3.5 py-2.5 text-base"
        >
          {t(`errors.${notice}`)}
        </p>
      ) : null}
    </div>
  );
}
