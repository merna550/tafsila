"use client";
/** CodeInput: a row of single-digit boxes for a one-time code; always left-to-right, paste fills every box. */
import { useRef, type ReactElement } from "react";
import { FIELD_BASE, cx } from "./styles";

/** Arabic-Indic (U+0660) and Persian (U+06F0) digit blocks start at a multiple of this value. */
const DIGIT_BLOCK = 16;

/**
 * Keeps only the digits of a text, converting Arabic-Indic and Persian digits to ASCII.
 *
 * @param text - Typed or pasted text.
 * @returns The ASCII digits in order.
 * @example
 * extractDigits("١٢-3"); // "123"
 */
export function extractDigits(text: string): string {
  return [...text]
    .map((char) => (/[٠-٩۰-۹]/.test(char) ? String((char.codePointAt(0) ?? 0) % DIGIT_BLOCK) : char))
    .filter((char) => /^\d$/.test(char))
    .join("");
}

/** A new code and the box that should have the focus afterwards. */
interface CodeEdit {
  /** The digits after the edit. */
  readonly value: string;
  /** Index of the box to focus. */
  readonly focus: number;
}

/**
 * Applies text typed (or autofilled) into one box: a single digit replaces the box, several digits fill the
 * boxes from there on, and an empty text clears the box.
 *
 * @param value - Digits before the edit.
 * @param index - Box that changed (0-based).
 * @param text - What the box now holds.
 * @param length - Number of boxes.
 * @returns The new digits and the box to focus.
 */
export function editBox(value: string, index: number, text: string, length: number): CodeEdit {
  const digits = extractDigits(text);
  if (digits.length === 0) return { value: value.slice(0, index) + value.slice(index + 1), focus: index };
  return {
    value: (value.slice(0, index) + digits + value.slice(index + 1)).slice(0, length),
    focus: Math.min(index + digits.length, length - 1),
  };
}

/**
 * Applies Backspace on an empty box: the previous digit is removed and the focus moves back.
 *
 * @param value - Digits before the key.
 * @param index - Box with the focus (0-based).
 * @returns The new digits and the box to focus.
 */
export function backspaceBox(value: string, index: number): CodeEdit {
  return {
    value: value.slice(0, Math.max(index - 1, 0)) + value.slice(index),
    focus: Math.max(index - 1, 0),
  };
}

/**
 * Turns pasted text into the whole code.
 *
 * @param text - Clipboard text.
 * @param length - Number of boxes.
 * @returns The digits (at most `length`) and the last filled box, or null when the text has no digits.
 */
export function pasteCode(text: string, length: number): CodeEdit | null {
  const digits = extractDigits(text).slice(0, length);
  return digits.length === 0 ? null : { value: digits, focus: digits.length - 1 };
}

/** Props for {@link CodeInput}. */
export interface CodeInputProps {
  /** Current code: the digits entered so far, at most `length`. */
  readonly value: string;
  /** Called with the new digits whenever a box changes or a code is pasted. */
  readonly onChange: (value: string) => void;
  /** Number of boxes; defaults to 6. */
  readonly length?: number;
  /** Accessible name of box `index` (0-based), already translated, for example "Digit 1". */
  readonly getBoxLabel: (index: number) => string;
  /** Id of the first box, so a `FormField` label points at it. */
  readonly id?: string;
  /** Ids of the hint and error elements (from `FormField`). */
  readonly "aria-describedby"?: string;
  /** Shows the error border on every box. */
  readonly "aria-invalid"?: boolean;
  /** Disables every box. */
  readonly disabled?: boolean;
}

/**
 * Renders the code boxes. The boxes stay left-to-right inside right-to-left pages, because digits are read that
 * way. The first box carries `autocomplete="one-time-code"` so phones can offer the code from the SMS.
 *
 * @param props - Value, change handler, labels and state.
 * @returns The row of boxes.
 * @example
 * <CodeInput value={code} onChange={setCode} getBoxLabel={(i) => t("digit", { n: i + 1 })} />
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  getBoxLabel,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  disabled,
}: Readonly<CodeInputProps>): ReactElement {
  const boxes = useRef<Array<HTMLInputElement | null>>([]);
  /**
   * Applies an edit: reports the new digits and moves the focus.
   *
   * @param edit - The new digits and the box to focus.
   */
  const apply = (edit: CodeEdit): void => {
    onChange(edit.value);
    boxes.current[Math.min(Math.max(edit.focus, 0), length - 1)]?.focus();
  };
  return (
    <div dir="ltr" className="flex gap-2">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            boxes.current[index] = element;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={index === 0 ? length : 1}
          aria-label={getBoxLabel(index)}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          disabled={disabled}
          value={value[index] ?? ""}
          onChange={(event) => apply(editBox(value, index, event.target.value, length))}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value[index]) apply(backspaceBox(value, index));
            else if (event.key === "ArrowLeft") apply({ value, focus: index - 1 });
            else if (event.key === "ArrowRight") apply({ value, focus: index + 1 });
          }}
          onPaste={(event) => {
            const edit = pasteCode(event.clipboardData.getData("text"), length);
            if (!edit) return;
            event.preventDefault();
            apply(edit);
          }}
          onFocus={(event) => event.target.select()}
          className={cx(
            FIELD_BASE,
            "h-14 min-w-0 max-w-16 flex-1 px-0 text-center text-2xl font-semibold",
            value[index] ? "border-2 border-primary" : "",
          )}
        />
      ))}
    </div>
  );
}
