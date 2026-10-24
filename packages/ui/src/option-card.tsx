/** OptionCardFace: the look of one picker card (drawing, label, reason, badge), shared by the single and multiple groups. */
import type { ReactElement, ReactNode } from "react";
import { CheckIcon } from "./icons";
import { FOCUS_RING, cx } from "./styles";

/** Props for {@link OptionCardFace} and {@link optionCardClass}. */
export interface OptionCardFaceProps {
  /** Card title (already translated). */
  readonly label: string;
  /** Drawing slot; the wrapper sets the text colour, the drawing uses `currentColor`. */
  readonly illustration?: ReactNode;
  /** Whether the card is chosen: shows the check badge. */
  readonly selected: boolean;
  /** Short visible reason the card cannot be chosen; its presence means disabled. */
  readonly disabledReason?: string;
  /** Marks a value the AI is unsure about (dashed border plus text badge). */
  readonly lowConfidence?: boolean;
  /** Badge text for low confidence (already translated); the UI package has no i18n. */
  readonly lowConfidenceLabel?: string;
  /** Id of the reason text, so the card can point to it with `aria-describedby`. */
  readonly reasonId?: string;
}

/**
 * Builds the classes of the card button (the screens draw a 2px bordered tile, 148px high).
 *
 * @param state - Selected, disabled and low-confidence flags.
 * @param state.selected - Whether the card is chosen.
 * @param state.disabled - Whether the card cannot be chosen.
 * @param state.lowConfidence - Whether the value is low confidence.
 * @returns One class string for the card button.
 */
export function optionCardClass(state: {
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly lowConfidence: boolean;
}): string {
  let look = "border-line bg-surface text-text hover:border-primary hover:bg-primary-soft";
  if (state.disabled) look = "cursor-not-allowed border-dashed border-line bg-surface-hover text-muted";
  else if (state.selected) look = "border-primary bg-primary-soft text-text";
  if (state.lowConfidence && !state.disabled) look = cx(look, "border-dashed border-warning");
  return cx(
    "relative flex min-h-37 min-w-11 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 p-3.5 text-center",
    look,
    FOCUS_RING,
  );
}

/**
 * Renders what is inside one card: check badge, drawing, label, reason and low-confidence badge.
 *
 * @param props - Label, drawing, state and texts.
 * @returns The card content.
 */
export function OptionCardFace({
  label,
  illustration,
  selected,
  disabledReason,
  lowConfidence,
  lowConfidenceLabel,
  reasonId,
}: Readonly<OptionCardFaceProps>): ReactElement {
  return (
    <>
      {selected && (
        <span
          aria-hidden="true"
          className="absolute start-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-on-primary"
        >
          <CheckIcon className="size-4" />
        </span>
      )}
      {illustration !== undefined && (
        <span aria-hidden="true" className="flex size-14 items-center justify-center text-primary">
          {illustration}
        </span>
      )}
      <span className="text-base font-bold">{label}</span>
      {disabledReason !== undefined && (
        <span id={reasonId} className="text-sm font-semibold text-muted">
          {disabledReason}
        </span>
      )}
      {lowConfidence === true && lowConfidenceLabel !== undefined && (
        <span className="rounded-sm bg-accent-soft px-2 text-sm font-semibold text-warning">
          {lowConfidenceLabel}
        </span>
      )}
    </>
  );
}
