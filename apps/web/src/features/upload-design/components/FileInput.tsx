"use client";
/** The hidden file input behind the "Choose photos" buttons; the camera is left off so phones offer the gallery too. */
import { useTranslations } from "next-intl";
import type { ReactElement, RefObject } from "react";

/** Props for {@link FileInput}. */
interface FileInputProps {
  /** Ref the parent uses to open the picker. */
  readonly inputRef: RefObject<HTMLInputElement | null>;
  /** Called with the chosen files. */
  readonly onFiles: (files: readonly File[]) => void;
}

/** Content types the picker offers; HEIC is listed so phones show it. */
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

/**
 * Renders the hidden multi-file input.
 *
 * @param props - The ref and the files handler.
 * @returns The input.
 */
export function FileInput({ inputRef, onFiles }: Readonly<FileInputProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  return (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      multiple
      hidden
      data-testid="photo-input"
      aria-label={t("choose")}
      onChange={(event) => {
        onFiles([...(event.target.files ?? [])]);
        event.target.value = "";
      }}
    />
  );
}
