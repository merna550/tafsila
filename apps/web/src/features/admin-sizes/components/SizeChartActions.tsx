/** The four buttons above the grid: import, export, discard (only with edits) and save with the number of changed cells. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link SizeChartActions}. */
interface SizeChartActionsProps {
  /** Number of changed cells. */
  readonly dirtyCount: number;
  /** True when saving is allowed (changed, readable and valid). */
  readonly canSave: boolean;
  /** True while saving. */
  readonly pending: boolean;
  /** Opens the import dialog. */
  readonly onImport: () => void;
  /** Downloads the CSV file. */
  readonly onExport: () => void;
  /** Opens the discard confirmation. */
  readonly onDiscard: () => void;
  /** Saves the grid. */
  readonly onSave: () => void;
}

/**
 * Renders the actions.
 *
 * @param props - State and handlers.
 * @returns The buttons.
 */
export function SizeChartActions(props: Readonly<SizeChartActionsProps>): ReactElement {
  const { dirtyCount, canSave, pending, onImport, onExport, onDiscard, onSave } = props;
  const t = useTranslations("admin.sizes");
  return (
    <>
      <Button variant="secondary" onClick={onImport}>
        {t("import.open")}
      </Button>
      <Button variant="secondary" onClick={onExport}>
        {t("export")}
      </Button>
      {dirtyCount > 0 ? (
        <Button variant="secondary" onClick={onDiscard}>
          {t("discard.open")}
        </Button>
      ) : null}
      <Button disabled={!canSave || pending} onClick={onSave}>
        {dirtyCount > 0 ? t("save", { count: dirtyCount }) : t("saveNone")}
      </Button>
    </>
  );
}
