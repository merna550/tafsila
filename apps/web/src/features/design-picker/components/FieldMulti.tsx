/** The pockets: a group of cards where any number can be chosen (issue #246). */
import { OptionCardGroup } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { pathMessageKey } from "../model/spec-path";
import { useCardOptions, type FieldProps } from "./FieldChoice";

/** Props for {@link FieldMulti}. */
interface FieldMultiProps extends FieldProps {
  /** The chosen values. */
  readonly value: readonly string[];
  /** Called with the full list after a card is toggled. */
  readonly onChange: (value: string[]) => void;
}

/**
 * Shows a feature whose value is a list, one checkbox card per value.
 *
 * @param props - The feature, its options, the chosen values and the change handler.
 * @returns The group.
 */
export function FieldMulti({ path, options, value, onChange }: Readonly<FieldMultiProps>): ReactElement {
  const t = useTranslations("designPicker");
  const locale = useLocale() as AppLocale;
  const cards = useCardOptions(path, options);
  const title = t(`paths.${pathMessageKey(path)}`);
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold">{title}</h3>
      <OptionCardGroup
        multiple
        label={title}
        dir={DIRECTION[locale]}
        options={cards}
        value={value}
        onValueChange={onChange}
      />
    </div>
  );
}
