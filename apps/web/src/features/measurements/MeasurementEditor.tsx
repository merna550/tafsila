"use client";
/** The loaded measurement screen: breadcrumb, title, the form and the guide dialog; shared by the new and the edit route. */
import type { Client, MeasurementSet, SizeChartResponse } from "@tafsila/schemas";
import { Breadcrumb } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, Link, type AppLocale } from "@/shared/i18n";
import { GuideDialog } from "./components/GuideDialog";
import { MeasurementForm } from "./components/MeasurementForm";
import { useMeasurementEditor } from "./hooks/use-measurement-editor";
import { nextGuideField } from "./model/guide-index";

/** Props for {@link MeasurementEditor}. */
interface MeasurementEditorProps {
  /** The client the set belongs to. */
  readonly client: Client;
  /** The default size chart. */
  readonly chart: SizeChartResponse;
  /** The set being edited; leave out for a new one. */
  readonly set?: MeasurementSet;
}

/**
 * Shows the path "My clients / name / page".
 *
 * @param props - The client and whether a set is being edited.
 * @param props.client - The client.
 * @param props.editing - True on the edit route.
 * @returns The breadcrumb.
 */
function EditorBreadcrumb({ client, editing }: Readonly<{ client: Client; editing: boolean }>): ReactElement {
  const t = useTranslations("measurements.breadcrumb");
  const list = useTranslations("clients");
  const link = "font-semibold text-primary underline";
  return (
    <Breadcrumb
      label={t("label")}
      items={[
        {
          key: "clients",
          content: (
            <Link href="/clients" className={link}>
              {list("title")}
            </Link>
          ),
        },
        {
          key: "client",
          content: (
            <Link href={`/clients/${client.id}`} className={link}>
              {client.name}
            </Link>
          ),
        },
        { key: "page", content: editing ? t("edit") : t("new") },
      ]}
    />
  );
}

/**
 * Shows the form for a client with the guide dialog on top.
 *
 * @param props - Client, chart and the set being edited.
 * @returns The screen content.
 */
export function MeasurementEditor({ client, chart, set }: Readonly<MeasurementEditorProps>): ReactElement {
  const dir = DIRECTION[useLocale() as AppLocale];
  const t = useTranslations("measurements");
  const profileHref = `/clients/${client.id}`;
  const editor = useMeasurementEditor({ clientId: client.id, chart, set, profileHref });
  const { guideField, setGuideField } = editor;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <EditorBreadcrumb client={client} editing={set !== undefined} />
      <h1 className="text-3xl font-semibold text-text">
        {t(set ? "title.edit" : "title.new", { name: client.name })}
      </h1>
      <MeasurementForm
        state={editor.state}
        chart={chart.sizes}
        chartName={chart.name}
        mode={editor.mode}
        onModeChange={editor.changeMode}
        onGuide={setGuideField}
        onSubmit={editor.onSubmit}
        pending={editor.pending}
        cancelHref={profileHref}
        dir={dir}
      />
      <GuideDialog
        field={guideField}
        next={guideField ? nextGuideField(guideField) : undefined}
        onClose={() => setGuideField(undefined)}
        onNext={setGuideField}
        dir={dir}
      />
    </div>
  );
}
