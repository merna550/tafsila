"use client";
/** The /admin/sizes screen: the editable size grid with CSV import and export, the placeholder banner and the save bar. */
import { PageHeader } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import type { AdminSizeChart } from "@tafsila/schemas";
import { DataState } from "@/shared/data-state";
import { formatRelativeTime } from "@/shared/format";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { DiscardDialog } from "./components/DiscardDialog";
import { GridLegend } from "./components/GridLegend";
import { ImportDialog } from "./components/ImportDialog";
import { PlaceholderBanner } from "./components/PlaceholderBanner";
import { SizeChartActions } from "./components/SizeChartActions";
import { SizeGrid } from "./components/SizeGrid";
import { downloadTextFile } from "./hooks/download-text-file";
import { useAdminSizeChart } from "./hooks/use-admin-size-chart";
import { useSizeChartSaveAction } from "./hooks/use-size-chart-save-action";
import { useSizeGridDraft } from "./hooks/use-size-grid-draft";
import { exportChartCsv } from "./model/size-chart-csv";

/** Props for {@link Editor}. */
interface EditorProps {
  /** The loaded chart. */
  readonly chart: AdminSizeChart;
}

/**
 * The page once the chart has loaded: header with the three actions, banner, grid and legend.
 *
 * @param props - The chart.
 * @returns The editor.
 */
function Editor({ chart }: Readonly<EditorProps>): ReactElement {
  const t = useTranslations("admin.sizes");
  const locale = useLocale() as AppLocale;
  const dir = DIRECTION[locale];
  const { texts, verdict, edit, discard } = useSizeGridDraft(chart.sizes, locale);
  const { save, pending } = useSizeChartSaveAction();
  const [importing, setImporting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const dirtyCount = verdict.dirty.size;
  const lastEdit =
    chart.updatedAt && chart.updatedBy
      ? t("lastEdit", {
          name: chart.updatedBy,
          when: formatRelativeTime(new Date(chart.updatedAt), new Date(), locale),
        })
      : t("lastEditNone");
  return (
    <>
      <PageHeader
        title={t("title")}
        description={lastEdit}
        actions={
          <SizeChartActions
            dirtyCount={dirtyCount}
            canSave={verdict.canSave}
            pending={pending}
            onImport={() => setImporting(true)}
            onExport={() => downloadTextFile("size-chart.csv", exportChartCsv(chart.sizes))}
            onDiscard={() => setDiscarding(true)}
            onSave={() => verdict.chart && void save({ sizes: verdict.chart })}
          />
        }
      />
      {chart.isPlaceholder ? <PlaceholderBanner /> : null}
      <SizeGrid texts={texts} verdict={verdict} onEdit={edit} />
      <GridLegend verdict={verdict} />
      <ImportDialog
        open={importing}
        onOpenChange={setImporting}
        onImport={save}
        pending={pending}
        dir={dir}
      />
      <DiscardDialog
        open={discarding}
        onOpenChange={setDiscarding}
        count={dirtyCount}
        onConfirm={discard}
        dir={dir}
      />
    </>
  );
}

/**
 * Loads the chart and shows the editor, or the loading and error states.
 *
 * @returns The screen.
 */
export function AdminSizesScreen(): ReactElement {
  const query = useAdminSizeChart();
  return (
    <DataState
      isPending={query.isPending}
      error={query.error}
      isEmpty={false}
      onRetry={() => void query.refetch()}
    >
      {query.data ? <Editor chart={query.data} /> : null}
    </DataState>
  );
}
