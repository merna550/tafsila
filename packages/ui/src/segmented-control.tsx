/** SegmentedControl: a small row of exclusive choices (a filter), each a toggle button with `aria-pressed`. */
import type { ReactElement, ReactNode } from "react";
import { FOCUS_RING, cx } from "./styles";

/** One choice of a {@link SegmentedControl}. */
export interface Segment<Value extends string> {
  /** Unique value of the choice. */
  readonly value: Value;
  /** Button text (already translated). */
  readonly label: ReactNode;
}

/** Props for {@link SegmentedControl}. */
export interface SegmentedControlProps<Value extends string> {
  /** The choices, in order. */
  readonly options: readonly Segment<Value>[];
  /** The chosen value. */
  readonly value: Value;
  /** Called with the value of the clicked choice. */
  readonly onChange: (value: Value) => void;
  /** Accessible name of the group (already translated). */
  readonly label: string;
  /** Extra classes for the group. */
  readonly className?: string;
}

/**
 * Renders the choices as a group of toggle buttons; exactly one has `aria-pressed="true"`.
 *
 * @param props - Options, current value, change handler and the group label.
 * @returns The group element.
 * @example
 * <SegmentedControl label={t("filter")} value={filter} onChange={setFilter} options={[{ value: "all", label: t("all") }]} />
 */
export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Readonly<SegmentedControlProps<Value>>): ReactElement {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("inline-flex gap-1 rounded-md bg-surface-hover p-1", className)}
    >
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            className={cx(
              "min-h-11 rounded-md px-4 text-base font-semibold",
              pressed ? "bg-surface text-text shadow-card" : "text-muted hover:text-text",
              FOCUS_RING,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
