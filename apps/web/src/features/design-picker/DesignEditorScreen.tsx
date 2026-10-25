"use client";
/** The /designs/[id] screen frame: the design, the section list, the open section and the reset notice. */
import { Badge, PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { DataState } from "@/shared/data-state";
import { useRouter } from "@/shared/i18n";
import { ClientChipSlot } from "./ClientChipSlot";
import { DesignsBreadcrumb } from "./components/DesignsBreadcrumb";
import { EditorNotice } from "./components/EditorNotice";
import { SectionNav } from "./components/SectionNav";
import { SectionPanel } from "./components/SectionPanel";
import { useEditorFrame } from "./hooks/use-editor-frame";
import { editorHref, type EditorQuery } from "./model/editor-query";

/** Props for {@link DesignEditorScreen}. */
interface DesignEditorScreenProps {
  /** Design id from the URL. */
  readonly id: string;
  /** Parameters from the URL (client and open section). */
  readonly query: EditorQuery;
  /** Area below the panel for the viewer, options and save (#251). */
  readonly children?: ReactNode;
}

/**
 * Loads the design, starts the editor store and composes the frame.
 *
 * @param props - Design id, URL parameters and the extra area.
 * @returns The screen.
 */
export function DesignEditorScreen({ id, query, children }: Readonly<DesignEditorScreenProps>): ReactElement {
  const t = useTranslations("designPicker");
  const router = useRouter();
  const frame = useEditorFrame(id, query.section);
  const { design, active, category } = frame;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DesignsBreadcrumb current={design.data?.design.title ?? t("title")} />
      <PageHeader title={t("title")} />
      <DataState
        isPending={design.isPending || (design.isSuccess && !frame.ready)}
        error={design.error}
        isEmpty={false}
        onRetry={() => void design.refetch()}
      >
        {category !== undefined && active !== undefined ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="info">{t(`category.${category}`)}</Badge>
              {query.clientId === undefined ? null : <ClientChipSlot clientId={query.clientId} />}
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="md:w-56 md:flex-none">
                <SectionNav
                  label={t("sectionsLabel")}
                  items={frame.sections.map((s) => ({
                    id: s,
                    label: t(`sections.${s}`),
                    done: frame.done.includes(s),
                  }))}
                  active={active}
                  onSelect={(section) =>
                    router.replace(editorHref(id, { ...query, section }), { scroll: false })
                  }
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <EditorNotice paths={frame.resetPaths} onUndo={frame.undo} onDismiss={frame.dismissNotice} />
                {frame.spec !== null && frame.options !== null ? (
                  <SectionPanel
                    title={t(`sections.${active}`)}
                    section={active}
                    spec={frame.spec}
                    options={frame.options}
                    onChange={frame.setFeature}
                    onOverride={frame.setOverride}
                  />
                ) : null}
                {children}
              </div>
            </div>
          </>
        ) : null}
      </DataState>
    </div>
  );
}
