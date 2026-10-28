"use client";
/** The "recommended fabrics" section of the saved-version view: loads the recommendation and shows its states (FR-REC-02). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import { FabricRecommendationsView } from "./components/FabricRecommendationsView";
import { useFabricRecommendations } from "./hooks/use-fabric-recommendations";

/** Props of {@link FabricRecommendations}. */
interface FabricRecommendationsProps {
  /** Saved version to recommend fabrics for. */
  readonly versionId: string;
}

/**
 * Renders the heading and the recommendation of one saved version.
 *
 * @param props - The version id.
 * @returns The section.
 */
export function FabricRecommendations({ versionId }: Readonly<FabricRecommendationsProps>): ReactElement {
  const t = useTranslations("fabric.recommend");
  const query = useFabricRecommendations(versionId);
  return (
    <section aria-labelledby="fabric-recommend-title" className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <h2 id="fabric-recommend-title" className="text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted">{t("subtitle")}</p>
      </div>
      <DataState
        isPending={query.isPending}
        error={query.error}
        isEmpty={query.data?.recommended.length === 0}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        onRetry={() => void query.refetch()}
      >
        {query.data ? <FabricRecommendationsView data={query.data} /> : null}
      </DataState>
    </section>
  );
}
