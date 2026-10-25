"use client";
/** A list of all pieces for keyboard and screen-reader users; choosing one selects it (issue #248, FR-VIEW-02). */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { PatternScene } from "../model/types";

/** Props of {@link PieceList}. */
interface PieceListProps {
  /** The pattern. */
  readonly scene: PatternScene;
  /** The selected piece, or null. */
  readonly selectedPieceId: string | null;
  /** Selects a piece. */
  readonly onSelect: (id: string) => void;
}

/**
 * One button per piece; the selected one carries `aria-current`.
 *
 * @param props - Component props.
 * @returns The list.
 */
export function PieceList({ scene, selectedPieceId, onSelect }: Readonly<PieceListProps>): ReactElement {
  const t = useTranslations("patternViewer.piece");
  const locale = useLocale() === "ar" ? "ar" : "en";
  return (
    <nav aria-label={t("listLabel")}>
      <ul className="flex flex-wrap gap-2">
        {scene.pieces.map((piece) => (
          <li key={piece.id}>
            <button
              type="button"
              onClick={() => onSelect(piece.id)}
              aria-current={piece.id === selectedPieceId ? "true" : undefined}
              data-testid={`piece-list-${piece.id}`}
              className={`min-h-11 rounded-md border px-3 text-sm ${piece.id === selectedPieceId ? "border-primary bg-primary-soft font-semibold" : "border-border"}`}
            >
              {piece.name[locale]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
