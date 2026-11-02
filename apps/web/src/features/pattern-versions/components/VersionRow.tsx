"use client";
/** One row of the version history: number, state, date, size and ease, the engine notice, and the open and restore actions. */
import { Badge, Button, Checkbox } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { VersionRowView } from "../model/version-view";

/** Props for {@link VersionRow}. */
interface VersionRowProps {
  /** The version to show. */
  readonly row: VersionRowView;
  /** Where "Open" goes. */
  readonly openHref: string;
  /** Asks to restore this version. */
  readonly onRestore: (row: VersionRowView) => void;
  /** Whether the row is ticked for compare; leave out to show no compare checkbox. */
  readonly compareSelected?: boolean;
  /** Called when the compare checkbox changes. */
  readonly onCompareChange?: (row: VersionRowView, selected: boolean) => void;
}

/**
 * Renders a version as a list item. The current version has no restore button: it is already the newest.
 *
 * @param props - The row and its actions.
 * @returns A list item.
 */
export function VersionRow({
  row,
  openHref,
  onRestore,
  compareSelected = false,
  onCompareChange,
}: Readonly<VersionRowProps>): ReactElement {
  const t = useTranslations("versionHistory.row");
  const ease = useTranslations("patternOptions.ease.profiles");
  return (
    <li
      className="flex flex-col gap-2 rounded-lg bg-surface p-4 shadow-card"
      data-testid="version-row"
      data-version-no={row.versionNo}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-text">
            {t("version", { n: row.versionNo })}
            {row.isCurrent ? <Badge tone="info">{t("current")}</Badge> : null}
            <Badge tone={row.status === "pass" ? "success" : "warning"}>{t(`status.${row.status}`)}</Badge>
          </h2>
          <p className="text-base text-muted">{t("saved", { when: row.saved, by: t(`by.${row.by}`) })}</p>
          <p className="text-base text-text">
            {row.sizeLabel === null
              ? t("summaryNoSize", { ease: ease(row.ease) })
              : t("summary", { size: row.sizeLabel, ease: ease(row.ease) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onCompareChange ? (
            <CompareCheckbox row={row} selected={compareSelected} onChange={onCompareChange} />
          ) : null}
          <Link
            href={openHref}
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 font-semibold text-text hover:bg-surface-hover"
            data-testid="open-version"
          >
            {t("open")}
            <span className="sr-only"> {t("version", { n: row.versionNo })}</span>
          </Link>
          {row.isCurrent ? null : (
            <Button variant="secondary" onClick={() => onRestore(row)} data-testid="restore-version">
              {t("restore")}
              <span className="sr-only"> {t("version", { n: row.versionNo })}</span>
            </Button>
          )}
        </div>
      </div>
      {row.engineChanged ? (
        <p className="rounded-md bg-background p-2 text-sm text-warning" data-testid="engine-notice">
          <span aria-hidden="true">⚠ </span>
          {t("engineOld")}
        </p>
      ) : null}
    </li>
  );
}

/** Props of {@link CompareCheckbox}. */
interface CompareCheckboxProps {
  /** The row it belongs to. */
  readonly row: VersionRowView;
  /** Whether it is ticked. */
  readonly selected: boolean;
  /** Called when it changes. */
  readonly onChange: (row: VersionRowView, selected: boolean) => void;
}

/**
 * The "Compare" tick of a row.
 *
 * @param props - The row, its state and the handler.
 * @returns A labelled checkbox.
 */
function CompareCheckbox({ row, selected, onChange }: Readonly<CompareCheckboxProps>): ReactElement {
  const t = useTranslations("versionHistory.row");
  return (
    <label className="flex min-h-11 items-center gap-2 text-base text-text">
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onChange(row, v === true)}
        data-testid="compare-version"
      />
      {t("compare")}
      <span className="sr-only"> {t("version", { n: row.versionNo })}</span>
    </label>
  );
}
