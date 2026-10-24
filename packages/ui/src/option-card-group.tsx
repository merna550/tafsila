"use client";
/** OptionCardGroup: a grid of picker cards, one choice (radio pattern) or several (checkbox pattern). */
import * as RadixRadio from "@radix-ui/react-radio-group";
import { useId } from "react";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { OptionCardFace, optionCardClass } from "./option-card";
import { cx } from "./styles";

/** One card of an {@link OptionCardGroup}. */
export interface OptionCardOption {
  /** Unique value of the card. */
  readonly value: string;
  /** Card title (already translated). */
  readonly label: string;
  /** Drawing slot; the wrapper sets the text colour, the drawing uses `currentColor`. */
  readonly illustration?: ReactNode;
  /** Present means disabled; shown as visible text on the card. */
  readonly disabledReason?: string;
  /** Highlight only (FR-DES-04, used from M6). */
  readonly lowConfidence?: boolean;
}

/** Props shared by both variants of {@link OptionCardGroup}. */
interface Common {
  /** The cards, in order. */
  readonly options: readonly OptionCardOption[];
  /** Accessible name of the group (already translated). */
  readonly label: string;
  /** Badge text of low-confidence cards (already translated). */
  readonly lowConfidenceLabel?: string;
  /** Reading direction; arrow keys follow it. */
  readonly dir?: "rtl" | "ltr";
  /** Extra classes for the grid. */
  readonly className?: string;
}

/** Props for {@link OptionCardGroup}: single choice (default) or `multiple`. */
export type OptionCardGroupProps = Common &
  (
    | {
        readonly multiple?: false;
        readonly value: string | undefined;
        readonly onValueChange: (value: string) => void;
      }
    | {
        readonly multiple: true;
        readonly value: readonly string[];
        readonly onValueChange: (value: string[]) => void;
      }
  );

/** Grid classes: 2 columns on phones, up to 4 on wide screens. */
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4";

/**
 * Adds the value when absent or removes it when present, keeping the order of `options`.
 *
 * @param options - The cards, in display order.
 * @param value - The values chosen now.
 * @param key - The value of the toggled card.
 * @returns The new list of chosen values.
 */
export function toggleValue(
  options: readonly OptionCardOption[],
  value: readonly string[],
  key: string,
): string[] {
  return options
    .map((option) => option.value)
    .filter((v) => (v === key ? !value.includes(v) : value.includes(v)));
}

/** Group props plus the id prefix shared by the cards. */
type CardCommon = Common & { readonly baseId: string };

/**
 * Builds the shared button attributes of one card (look, reason link, low-confidence flag).
 *
 * @param option - The card.
 * @param selected - Whether it is chosen.
 * @param baseId - Id prefix of the group.
 * @returns Attributes to spread on the card button.
 */
function cardAttrs(
  option: OptionCardOption,
  selected: boolean,
  baseId: string,
): Record<string, string | undefined> {
  return {
    className: optionCardClass({
      selected,
      disabled: option.disabledReason !== undefined,
      lowConfidence: option.lowConfidence === true,
    }),
    "aria-describedby": option.disabledReason === undefined ? undefined : `${baseId}-${option.value}`,
    "data-low-confidence": option.lowConfidence === true ? "" : undefined,
  };
}

/**
 * Renders the content of one card.
 *
 * @param props - The card, its state and the group texts.
 * @param props.option - The card.
 * @param props.selected - Whether it is chosen.
 * @param props.common - Group props (badge text, id prefix).
 * @returns The card face.
 */
function Face({
  option,
  selected,
  common,
}: Readonly<{ option: OptionCardOption; selected: boolean; common: CardCommon }>): ReactElement {
  return (
    <OptionCardFace
      label={option.label}
      illustration={option.illustration}
      selected={selected}
      disabledReason={option.disabledReason}
      lowConfidence={option.lowConfidence}
      lowConfidenceLabel={common.lowConfidenceLabel}
      reasonId={`${common.baseId}-${option.value}`}
    />
  );
}

/**
 * Renders the multiple-choice variant: checkboxes reached with Tab, toggled with Space or Enter.
 *
 * @param props - Group props plus the chosen values.
 * @param props.common - Shared group props.
 * @param props.value - Chosen values.
 * @param props.onValueChange - Called with the new list.
 * @returns The group element.
 */
function MultiGroup({
  common,
  value,
  onValueChange,
}: Readonly<{
  common: CardCommon;
  value: readonly string[];
  onValueChange: (value: string[]) => void;
}>): ReactElement {
  const { options, label, dir, className, baseId } = common;
  return (
    <div role="group" aria-label={label} dir={dir} className={cx(GRID, className)}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            disabled={option.disabledReason !== undefined}
            onClick={() => onValueChange(toggleValue(options, value, option.value))}
            {...cardAttrs(option, selected, baseId)}
          >
            <Face option={option} selected={selected} common={common} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Renders the single-choice variant: a Radix radio group (arrows, roving focus) where Enter also selects.
 *
 * @param props - Group props plus the chosen value.
 * @param props.common - Shared group props.
 * @param props.value - Chosen value.
 * @param props.onValueChange - Called with the new value.
 * @returns The group element.
 */
function SingleGroup({
  common,
  value,
  onValueChange,
}: Readonly<{
  common: CardCommon;
  value: string | undefined;
  onValueChange: (value: string) => void;
}>): ReactElement {
  const { options, label, dir, className, baseId } = common;
  return (
    <RadixRadio.Root
      aria-label={label}
      dir={dir}
      value={value ?? ""}
      onValueChange={onValueChange}
      className={cx(GRID, className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <RadixRadio.Item
            key={option.value}
            value={option.value}
            disabled={option.disabledReason !== undefined}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onValueChange(option.value);
            }}
            {...cardAttrs(option, selected, baseId)}
          >
            <Face option={option} selected={selected} common={common} />
          </RadixRadio.Item>
        );
      })}
    </RadixRadio.Root>
  );
}

/**
 * Renders the cards. Single: arrows move and select, Enter selects. Multiple: Tab moves, Space or Enter toggles.
 *
 * @param props - Options, value, change handler and the group label.
 * @returns The group element.
 * @example
 * <OptionCardGroup label={t("neckline")} options={options} value={neckline} onValueChange={setNeckline} />
 */
export function OptionCardGroup(props: Readonly<OptionCardGroupProps>): ReactElement {
  const baseId = useId();
  const common: CardCommon = { ...props, baseId };
  return props.multiple === true ? (
    <MultiGroup common={common} value={props.value} onValueChange={props.onValueChange} />
  ) : (
    <SingleGroup common={common} value={props.value} onValueChange={props.onValueChange} />
  );
}
