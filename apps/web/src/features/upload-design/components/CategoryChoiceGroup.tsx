/** The garment choice: dress, skirt, blouse, "let the AI decide", and pants as "coming soon" (FR-DES-02). */
import { OptionCardGroup } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { CATEGORY_CHOICES, isAvailable, type CategoryChoice } from "../model/category-choice";

/** Props for {@link CategoryChoiceGroup}. */
interface CategoryChoiceGroupProps {
  readonly value: CategoryChoice;
  readonly disabled: boolean;
  readonly onChange: (choice: CategoryChoice) => void;
}

/**
 * Renders the choice cards.
 *
 * @param props - The chosen value and the change handler.
 * @returns The card group.
 */
export function CategoryChoiceGroup({
  value,
  disabled,
  onChange,
}: Readonly<CategoryChoiceGroupProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  const locale = useLocale() as AppLocale;
  /**
   * Gives the text shown on a card that cannot be chosen.
   *
   * @param choice - The card.
   * @returns The reason, or nothing when the card works.
   */
  const reasonOf = (choice: CategoryChoice): { disabledReason?: string } => {
    if (!isAvailable(choice)) return { disabledReason: t("soon") };
    return disabled ? { disabledReason: t("starting") } : {};
  };
  return (
    <OptionCardGroup
      label={t("categoryGroup")}
      dir={DIRECTION[locale]}
      options={CATEGORY_CHOICES.map((choice) => ({
        value: choice,
        label: t(`category.${choice}`),
        ...reasonOf(choice),
      }))}
      value={value}
      onValueChange={(next) => onChange(next as CategoryChoice)}
    />
  );
}
