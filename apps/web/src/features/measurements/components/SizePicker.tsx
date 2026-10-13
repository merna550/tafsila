/** The base-size chips (S to XXL) read from the default chart, with the hint under them. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link SizePicker}. */
interface SizePickerProps {
  /** Size labels of the chart, in order. */
  readonly sizes: readonly string[];
  /** The picked size, or "" for none. */
  readonly value: string;
  /** Called with the picked size. */
  readonly onPick: (size: string) => void;
  /** Name of the chart (shows when the values are demo values). */
  readonly chartName: string;
}

/**
 * Renders the chips as a radio group.
 *
 * @param props - Sizes, the picked one and the handler.
 * @returns The picker.
 */
export function SizePicker({ sizes, value, onPick, chartName }: Readonly<SizePickerProps>): ReactElement {
  const t = useTranslations("measurements.sizes");
  return (
    <div className="flex flex-col gap-2">
      <span id="size-picker-label" className="text-sm font-semibold text-text">
        {t("label")}
      </span>
      <div role="radiogroup" aria-labelledby="size-picker-label" className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={size === value}
            onClick={() => onPick(size)}
            className={`min-h-11 min-w-16 rounded-md border px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-focus ${size === value ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-text hover:bg-surface-hover"}`}
          >
            {size}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{value ? t("hint", { size: value }) : t("pick")}</p>
      <p className="text-xs text-muted">{t("chart", { name: chartName })}</p>
    </div>
  );
}
