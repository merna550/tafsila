/** One feature as a group of option cards: the choice, its drawing and, for a refused value, the reason (issue #246). */
import type { FeatureOptions, FeaturePath } from "@tafsila/engine/spec-rules";
import { OptionCardGroup, type OptionCardOption } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { findIllustration, OptionIllustration, type IllustratedPath } from "../illustrations";
import { pathMessageKey } from "../model/spec-path";

/** Props for {@link FieldChoice} and {@link FieldMulti}. */
export interface FieldProps {
  /** The feature. */
  readonly path: FeaturePath;
  /** What the engine offers for it. */
  readonly options: FeatureOptions;
}

/**
 * Builds the cards of one feature: label from messages, drawing from the catalogue, reason from the engine.
 *
 * @param path - The feature.
 * @param options - Its values with allowed or refused.
 * @returns One card option per value.
 */
export function useCardOptions(path: FeaturePath, options: FeatureOptions): OptionCardOption[] {
  const t = useTranslations("designPicker");
  const locale = useLocale() as AppLocale;
  return options.values.map((option) => {
    const value = String(option.value);
    return {
      value,
      label: t(`options.${pathMessageKey(path)}.${value}` as never),
      ...(findIllustration(path, value) === undefined
        ? {}
        : {
            illustration: <OptionIllustration path={path as IllustratedPath} value={value as never} />,
          }),
      ...(option.allowed ? {} : { disabledReason: option.reason?.[locale] ?? "" }),
    };
  });
}

/** Props for {@link FieldChoice}. */
interface FieldChoiceProps extends FieldProps {
  /** The current value as text, or undefined. */
  readonly value: string | undefined;
  /** Called with the chosen value as text. */
  readonly onChoose: (value: string) => void;
}

/**
 * Shows one feature with a title and one card per value; picking a card chooses it.
 *
 * @param props - The feature, its options, the value and the change handler.
 * @returns The group.
 */
export function FieldChoice({ path, options, value, onChoose }: Readonly<FieldChoiceProps>): ReactElement {
  const t = useTranslations("designPicker");
  const locale = useLocale() as AppLocale;
  const cards = useCardOptions(path, options);
  const title = t(`paths.${pathMessageKey(path)}`);
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold">{title}</h3>
      <OptionCardGroup
        label={title}
        dir={DIRECTION[locale]}
        options={cards}
        value={value}
        onValueChange={onChoose}
      />
    </div>
  );
}
