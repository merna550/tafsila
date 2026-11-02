"use client";
/** The /designs/[id]/versions/compare screen: two saved versions drawn over each other with the list of what changed (issue #345). */
import { Card } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useDesign } from "@/features/design-picker";
import { useVersions } from "@/features/pattern-versions";
import { DataState } from "@/shared/data-state";
import { DIRECTION, useRouter, type AppLocale } from "@/shared/i18n";
import { CompareHeader } from "./components/CompareHeader";
import { DifferenceList } from "./components/DifferenceList";
import { OverlayPanel } from "./components/OverlayPanel";
import { VersionPickers } from "./components/VersionPickers";
import { useCompareVersions, type CompareVersions } from "./hooks/use-compare-versions";

/** Props of {@link CompareScreen}. */
interface CompareScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** First version id from `?a=`. */
  readonly a: string;
  /** Second version id from `?b=`. */
  readonly b: string;
}

/**
 * Loads two versions and shows the overlay, the legend and the differences.
 *
 * @param props - Design id and the two version ids.
 * @returns The screen.
 */
export function CompareScreen({ designId, a, b }: Readonly<CompareScreenProps>): ReactElement {
  const t = useTranslations("compare");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const design = useDesign(designId);
  const list = useVersions(designId);
  const data = useCompareVersions(a, b);
  const options = list.versions.map((v) => ({ value: v.id, label: t("option", { n: v.versionNo }) }));
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <CompareHeader
        title={design.data?.design.title ?? null}
        historyHref={`/designs/${designId}/versions`}
      />
      <VersionPickers
        options={options}
        a={a}
        b={b}
        dir={DIRECTION[locale]}
        onChange={(pair) => router.replace(`/designs/${designId}/versions/compare?a=${pair.a}&b=${pair.b}`)}
      />
      <CompareBody data={data} />
    </div>
  );
}

/** Props of {@link CompareBody}. */
interface CompareBodyProps {
  /** The two versions and their drafts. */
  readonly data: CompareVersions;
}

/**
 * The part under the pickers: loading and error, the same-version note, or the overlay beside the differences.
 *
 * @param props - The compare data.
 * @returns The body.
 */
function CompareBody({ data }: Readonly<CompareBodyProps>): ReactElement {
  const t = useTranslations("compare");
  if (data.same) {
    return (
      <Card className="p-4">
        <p
          className="rounded-md border border-primary bg-primary-soft p-3 text-base text-text"
          data-testid="same-versions"
        >
          {t("same")}
        </p>
      </Card>
    );
  }
  return (
    <DataState
      isPending={data.queryA.isPending || data.queryB.isPending}
      error={data.queryA.error ?? data.queryB.error}
      isEmpty={false}
      onRetry={() => {
        void data.queryA.refetch();
        void data.queryB.refetch();
      }}
    >
      {data.a && data.b ? (
        <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-start">
          <OverlayPanel
            a={data.a.version}
            b={data.b.version}
            pieces={data.pieces}
            building={data.building}
            failed={data.failed}
          />
          <Card className="p-4 lg:w-80 lg:flex-none">
            <DifferenceList
              differences={data.differences}
              pieces={data.pieces}
              engineDiffers={data.engineDiffers}
            />
          </Card>
        </div>
      ) : null}
    </DataState>
  );
}
