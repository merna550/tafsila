"use client";
/** Where every distance of the piece is measured from, in words. */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPiecePlan } from "@/shared/pattern-preview";
import { showText } from "../model/format";

/**
 * Renders the reference text of a piece.
 *
 * @param props - The piece.
 * @param props.piece - The piece whose reference is shown.
 * @returns The block.
 */
export function ReferenceLines({ piece }: Readonly<{ piece: CutPiecePlan }>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  return (
    <section aria-labelledby="reference-title" className="rounded-md border border-border bg-surface p-3">
      <h2 id="reference-title" className="text-sm font-semibold text-muted">
        {t("reference")}
      </h2>
      <p className="text-base">{showText(piece.reference.text, locale)}</p>
    </section>
  );
}
