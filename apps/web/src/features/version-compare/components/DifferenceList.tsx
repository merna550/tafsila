"use client";
/** The "what changed" panel: one line per difference in the words of the design picker, the added and removed pieces, and the notes (issue #345). */
import { useLocale, useMessages, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { describeDifference } from "../model/describe-difference";
import type { VersionDifference } from "../model/diff-versions";
import { pieceNames, type MatchedPiece } from "../model/match-pieces";

/** Props of {@link DifferenceList}. */
interface DifferenceListProps {
  /** The differences. */
  readonly differences: readonly VersionDifference[];
  /** The pieces, for the added and removed lists. */
  readonly pieces: readonly MatchedPiece[];
  /** True when the two versions were made by different engine versions. */
  readonly engineDiffers: boolean;
}

/**
 * Renders the panel.
 *
 * @param props - Differences, pieces and the engine flag.
 * @returns The panel body.
 */
export function DifferenceList({
  differences,
  pieces,
  engineDiffers,
}: Readonly<DifferenceListProps>): ReactElement {
  const t = useTranslations("compare.changes");
  const locale = useLocale() as "ar" | "en";
  const added = pieceNames(pieces, "added", locale);
  const removed = pieceNames(pieces, "removed", locale);
  const nothing = differences.length === 0 && added === "" && removed === "";
  return (
    <div className="flex flex-col gap-3" data-testid="difference-list">
      <h2 className="text-lg font-semibold text-text">{t("title")}</h2>
      {nothing ? <p className="text-base text-muted">{t("none")}</p> : null}
      {differences.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {differences.map((d) => (
            <DifferenceLine key={`${d.group}:${d.key}`} difference={d} />
          ))}
        </ul>
      ) : null}
      {added === "" ? null : (
        <p className="text-base text-success" data-testid="pieces-added">
          {t("added", { names: added })}
        </p>
      )}
      {removed === "" ? null : (
        <p className="text-base text-danger" data-testid="pieces-removed">
          {t("removed", { names: removed })}
        </p>
      )}
      <p className="text-sm text-muted">{t("note")}</p>
      {engineDiffers ? (
        <p className="rounded-md bg-accent-soft p-2 text-sm text-warning" data-testid="engine-differs">
          <span aria-hidden="true">⚠ </span>
          {t("engineDiffers")}
        </p>
      ) : null}
    </div>
  );
}

/** Props of {@link DifferenceLine}. */
interface DifferenceLineProps {
  /** The difference to show. */
  readonly difference: VersionDifference;
}

/**
 * One line: "Label: from → to".
 *
 * @param props - The difference.
 * @returns A list item.
 */
function DifferenceLine({ difference }: Readonly<DifferenceLineProps>): ReactElement {
  const t = useTranslations("compare.changes");
  const messages = useMessages();
  const text = describeDifference(difference, messages, {
    absent: t("absent"),
    yes: t("yes"),
    no: t("no"),
    cm: (value) => t("cm", { value }),
  });
  return (
    <li className="text-base text-text" data-testid="difference-line" data-key={difference.key}>
      <span className="font-semibold">{text.label}:</span>{" "}
      <span className="text-muted line-through">{text.from}</span>{" "}
      <span aria-hidden="true" className="inline-block rtl:rotate-180">
        →
      </span>
      <span className="sr-only">{t("to")}</span> <span className="font-semibold">{text.to}</span>
    </li>
  );
}
