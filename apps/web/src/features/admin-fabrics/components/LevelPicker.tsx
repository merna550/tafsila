/** A row of five buttons that pick a level on the 1 to 5 scale the admin sees (stored as 0 to 4), with an optional "none" choice. */
import { useId, type ReactElement } from "react";
import { METER_STEPS } from "@/features/fabric";

/** Props of {@link LevelPicker}. */
export interface LevelPickerProps {
  /** Visible label of the group. */
  readonly label: string;
  /** Selected stored level 0 to 4, or null when none is picked. */
  readonly value: number | null;
  /** Called with the new stored level (null for the "none" choice). */
  readonly onChange: (value: number | null) => void;
  /** Help text under the buttons. */
  readonly hint?: string;
  /** Error text under the buttons. */
  readonly error?: string;
  /** Text of the extra choice that clears the value; leave out when a value is required. */
  readonly noneLabel?: string;
  /** Disables every button. */
  readonly disabled?: boolean;
}

/** Number of buttons: the scale 1 to 5. */
const STEPS = Array.from({ length: METER_STEPS }, (_, level) => level);

/** Classes of one button by state. */
const BUTTON_BASE = "min-h-11 min-w-11 flex-1 rounded-md px-2 text-base font-semibold disabled:opacity-60 ";
const SELECTED = "border-2 border-primary bg-primary-soft text-primary";
const UNSELECTED = "border border-border bg-surface text-text";

/**
 * Renders the group.
 *
 * @param props - Label, value, handlers and optional texts.
 * @returns The radio group.
 */
export function LevelPicker(props: Readonly<LevelPickerProps>): ReactElement {
  const { label, value, onChange, hint, error, noneLabel, disabled } = props;
  const id = useId();
  const choices: { readonly key: string; readonly level: number | null; readonly text: string }[] = [
    ...STEPS.map((level) => ({ key: String(level), level, text: String(level + 1) })),
    ...(noneLabel ? [{ key: "none", level: null, text: noneLabel }] : []),
  ];
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="text-sm font-semibold text-text">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-1.5">
        {choices.map((choice) => (
          <button
            key={choice.key}
            type="button"
            role="radio"
            aria-checked={choice.level === value}
            disabled={disabled}
            onClick={() => onChange(choice.level)}
            className={BUTTON_BASE + (choice.level === value ? SELECTED : UNSELECTED)}
          >
            {choice.text}
          </button>
        ))}
      </div>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
