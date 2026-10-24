import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ReactElement } from "react";
import { OptionCardGroup } from "./option-card-group";
import type { OptionCardOption } from "./option-card-group";
import { sampleFor } from "./sample-text";
import type { SampleText } from "./sample-text";

const meta: Meta = { title: "Forms/Option cards" };
export default meta;
type Story = StoryObj;

/**
 * Placeholder drawing that follows the text colour, like the real drawings from the feature.
 *
 * @returns A small SVG.
 */
function Drawing(): ReactElement {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="size-12">
      <path d="M16 6l-10 6 4 8 6-3v25h16V17l6 3 4-8-10-6c-2 4-4 5-8 5s-6-1-8-5z" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Builds the four sample cards, applying per-card overrides.
 *
 * @param text - Sample strings.
 * @param extra - Overrides by card index.
 * @returns The cards.
 */
function cards(text: SampleText, extra: Record<number, Partial<OptionCardOption>> = {}): OptionCardOption[] {
  return text.cards.map((label, index) => ({
    value: `c${index}`,
    label,
    illustration: <Drawing />,
    ...extra[index],
  }));
}

/**
 * Holds the chosen value of a single-choice story.
 *
 * @param props - Cards, initial value, sample text and direction.
 * @param props.options - The cards.
 * @param props.initial - Initially chosen value.
 * @param props.text - Sample strings.
 * @param props.dir - Reading direction.
 * @returns The group.
 */
function Single({
  options,
  initial,
  text,
  dir,
}: Readonly<{
  options: OptionCardOption[];
  initial?: string;
  text: SampleText;
  dir: "rtl" | "ltr";
}>): ReactElement {
  const [value, setValue] = useState(initial);
  return (
    <OptionCardGroup
      label={text.pick}
      lowConfidenceLabel={text.lowConfidence}
      dir={dir}
      options={options}
      value={value}
      onValueChange={setValue}
    />
  );
}

/**
 * Reading direction chosen in the toolbar.
 *
 * @param context - Story context.
 * @param context.globals - Storybook globals.
 * @returns "ltr" or "rtl".
 */
function dirOf(context: { readonly globals: Record<string, unknown> }): "rtl" | "ltr" {
  return context.globals.direction === "ltr" ? "ltr" : "rtl";
}

export const Default: Story = {
  render: (_, context) => (
    <Single text={sampleFor(context)} dir={dirOf(context)} options={cards(sampleFor(context))} />
  ),
};

export const Selected: Story = {
  render: (_, context) => (
    <Single text={sampleFor(context)} dir={dirOf(context)} initial="c0" options={cards(sampleFor(context))} />
  ),
};

export const Disabled: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <Single
        text={text}
        dir={dirOf(context)}
        initial="c0"
        options={cards(text, { 3: { disabledReason: text.cardReason } })}
      />
    );
  },
};

export const LowConfidence: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return <Single text={text} dir={dirOf(context)} options={cards(text, { 1: { lowConfidence: true } })} />;
  },
};

/**
 * Holds the chosen values of the multiple-choice story.
 *
 * @param props - Sample text and direction.
 * @param props.text - Sample strings.
 * @param props.dir - Reading direction.
 * @returns The group.
 */
function Multi({ text, dir }: Readonly<{ text: SampleText; dir: "rtl" | "ltr" }>): ReactElement {
  const [value, setValue] = useState<string[]>(["c0", "c2"]);
  return (
    <OptionCardGroup
      multiple
      label={text.pick}
      dir={dir}
      options={cards(text, { 3: { disabledReason: text.cardReason } })}
      value={value}
      onValueChange={setValue}
    />
  );
}

export const MultiSelect: Story = {
  render: (_, context) => <Multi text={sampleFor(context)} dir={dirOf(context)} />,
};
