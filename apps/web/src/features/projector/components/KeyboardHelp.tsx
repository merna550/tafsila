"use client";
/** The keyboard shortcuts window of the projector page; Escape or the button closes it (issue #286). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactElement } from "react";
import { HELP_ROWS } from "../model/keymap";

/**
 * Lists the keys; the rows come from {@link HELP_ROWS}, the same list the tests check.
 *
 * @param props - The close action.
 * @param props.onClose - Called on Escape and on the close button.
 * @returns The dialog over a dimmed backdrop.
 */
export function KeyboardHelp({ onClose }: Readonly<{ onClose: () => void }>): ReactElement {
  const t = useTranslations("projector.help");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.querySelector("button")?.focus();
    /**
     * Closes on Escape.
     *
     * @param event - The keyboard event.
     */
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-stage/60 p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="projector-help-title"
        className="flex w-full max-w-md flex-col gap-2 rounded-lg border border-muted bg-text p-6 text-surface"
      >
        <h2 id="projector-help-title" className="mb-2 text-xl font-semibold">
          {t("title")}
        </h2>
        {HELP_ROWS.map((row) => (
          <div key={row.id} className="flex justify-between gap-4 border-b border-muted py-1.5 text-base">
            <span>{t(`rows.${row.id}`)}</span>
            <b dir="ltr">{row.keys}</b>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-1.5 text-base">
          <span>{t("close")}</span>
          <b dir="ltr">{t("closeKey")}</b>
        </div>
        <Button variant="secondary" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </div>
  );
}
