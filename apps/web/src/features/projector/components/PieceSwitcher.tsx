"use client";
/** The piece list of the projector: "All pieces" and one row per piece, with previous and next (issue #287). */
import type { PatternScene } from "@tafsila/engine/viewer";
import { Button } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props of {@link PieceSwitcher}. */
export interface PieceSwitcherProps {
  /** The scene whose pieces are listed. */
  readonly scene: PatternScene;
  /** Which pieces are shown now. */
  readonly selection: string;
  /** Shows one piece. */
  readonly onChoose: (id: string) => void;
  /** Shows every piece. */
  readonly onAll: () => void;
  /** Chooses the next or the previous piece. */
  readonly onStep: (by: 1 | -1) => void;
}

/**
 * The classes of one row.
 *
 * @param chosen - Whether the row is the chosen one.
 * @returns The class list.
 */
function rowClass(chosen: boolean): string {
  return `flex min-h-11 w-full items-center rounded-md border px-3 text-start text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
    chosen ? "border-focus bg-surface text-text" : "border-muted text-surface"
  }`;
}

/**
 * The panel with the piece rows; the chosen row has `aria-current`.
 *
 * @param props - See {@link PieceSwitcherProps}.
 * @returns The panel.
 */
export function PieceSwitcher(props: Readonly<PieceSwitcherProps>): ReactElement {
  const t = useTranslations("projector.pieces");
  const locale = useLocale() === "ar" ? "ar" : "en";
  return (
    <section
      aria-label={t("title")}
      data-testid="piece-switcher"
      className="flex flex-col gap-2 rounded-lg border border-muted bg-text/90 p-3"
    >
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <button
        type="button"
        className={rowClass(props.selection === "all")}
        aria-current={props.selection === "all" || undefined}
        onClick={props.onAll}
      >
        {t("all")}
      </button>
      {props.scene.pieces.map((piece) => (
        <button
          key={piece.id}
          type="button"
          data-piece-row={piece.id}
          className={rowClass(props.selection === piece.id)}
          aria-current={props.selection === piece.id || undefined}
          onClick={() => props.onChoose(piece.id)}
        >
          {piece.name[locale]}
        </button>
      ))}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => props.onStep(-1)}>
          {t("previous")}
        </Button>
        <Button variant="secondary" onClick={() => props.onStep(1)}>
          {t("next")}
        </Button>
      </div>
    </section>
  );
}
