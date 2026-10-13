/** CSV import: pick a file, name the chart, read the preview with every problem, then save. */
import { Button, Dialog, FormField, Input } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactElement } from "react";
import type { AppLocale } from "@/shared/i18n";
import { ImportPreview } from "./ImportPreview";
import { importChartCsv } from "../model/size-chart-csv";
import type { UpdateSizeChartInput } from "@tafsila/schemas";

/** Props for {@link ImportDialog}. */
interface ImportDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** Saves the imported chart. */
  readonly onImport: (body: UpdateSizeChartInput) => Promise<boolean>;
  /** True while saving. */
  readonly pending: boolean;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the dialog. The preview is recomputed from the file text, so a fixed file can simply be picked again.
 *
 * @param props - Open state, the save handler and direction.
 * @returns The dialog.
 */
export function ImportDialog(props: Readonly<ImportDialogProps>): ReactElement {
  const { open, onOpenChange, onImport, pending, dir } = props;
  const t = useTranslations("admin.sizes.import");
  const locale = useLocale() as AppLocale;
  const [text, setText] = useState<string | null>(null);
  const [name, setName] = useState(() => t("defaultName"));
  const result = useMemo(() => (text === null ? null : importChartCsv(text, locale)), [text, locale]);
  const canImport = result?.chart !== undefined && name.trim() !== "" && !pending;
  /**
   * Starts again whenever the dialog closes.
   *
   * @param next - The new open state.
   */
  const close = (next: boolean): void => {
    if (!next) setText(null);
    onOpenChange(next);
  };
  /** Saves the chart and closes on success. */
  const confirm = async (): Promise<void> => {
    if (!result?.chart) return;
    if (await onImport({ name: name.trim(), sizes: result.chart })) close(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={close}
      dir={dir}
      title={t("title")}
      description={t("description")}
      closeLabel={t("close")}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => close(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={() => void confirm()} disabled={!canImport}>
            {t("confirm")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label={t("file")}>
          {(control) => (
            <Input
              {...control}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void file.text().then(setText);
              }}
            />
          )}
        </FormField>
        <FormField label={t("name")}>
          {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
        </FormField>
        {result ? <ImportPreview result={result} /> : null}
        <p className="m-0 text-sm text-muted">{t("replaces")}</p>
      </div>
    </Dialog>
  );
}
