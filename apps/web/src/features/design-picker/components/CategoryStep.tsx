/** The category step: one card per garment type; choosing a card starts the design. */
import type { GarmentCategory } from "@tafsila/schemas";
import { OptionCardGroup } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { OptionIllustration } from "../illustrations";

/** The garment types, in the order of the screen. Pants are drawn but not available yet. */
const CATEGORIES: readonly GarmentCategory[] = ["dress", "skirt", "blouse"];

/** Props for {@link CategoryStep}. */
interface CategoryStepProps {
  /** Called with the chosen category. */
  readonly onChoose: (category: GarmentCategory) => void;
  /** True while the design is being created: the cards stop answering. */
  readonly pending: boolean;
}

/**
 * Renders the garment type cards.
 *
 * @param props - The choose handler and the pending flag.
 * @returns The card group.
 */
export function CategoryStep({ onChoose, pending }: Readonly<CategoryStepProps>): ReactElement {
  const t = useTranslations("designPicker");
  const locale = useLocale() as AppLocale;
  const options = [
    ...CATEGORIES.map((category) => ({
      value: category,
      label: t(`category.${category}`),
      illustration: <OptionIllustration path="category" value={category} />,
      ...(pending ? { disabledReason: t("creating") } : {}),
    })),
    { value: "pants", label: t("category.pants"), disabledReason: t("soon") },
  ];
  return (
    <OptionCardGroup
      label={t("categoryGroup")}
      dir={DIRECTION[locale]}
      options={options}
      value={undefined}
      onValueChange={(value) => onChoose(value as GarmentCategory)}
    />
  );
}
