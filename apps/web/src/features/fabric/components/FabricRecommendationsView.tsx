/** Presentation of the recommendation panel: heading, draft note, fabric cards and the avoid list. */
import type { RecommendFabricsResponse } from "@tafsila/schemas";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { AvoidList } from "./AvoidList";
import { FabricCard } from "./FabricCard";

/** Props of {@link FabricRecommendationsView}. */
interface FabricRecommendationsViewProps {
  /** The loaded recommendation with at least one recommended fabric. */
  readonly data: RecommendFabricsResponse;
}

/**
 * Renders the loaded recommendation.
 *
 * @param props - The recommendation.
 * @returns The panel body.
 */
export function FabricRecommendationsView({ data }: Readonly<FabricRecommendationsViewProps>): ReactElement {
  const t = useTranslations("fabric.recommend");
  return (
    <div className="flex flex-col gap-4">
      {data.isDraft ? (
        <p className="flex gap-2.5 rounded-lg bg-accent-soft p-3" data-testid="fabric-draft-note">
          <strong className="text-accent">{t("draftLabel")}</strong>
          <span>{t("draftNote")}</span>
        </p>
      ) : null}
      <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
        {data.recommended.map((item, index) => (
          <li key={item.fabricId} className="flex">
            <FabricCard item={item} best={index === 0} />
          </li>
        ))}
      </ul>
      <AvoidList items={data.avoid} />
    </div>
  );
}
