import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField } from "./form-field";
import { Input } from "./input";
import { sampleFor, sizeOptions } from "./sample-text";
import { Select } from "./select";
import { Textarea } from "./textarea";

const meta: Meta = { title: "Forms/Text fields" };
export default meta;
type Story = StoryObj;

export const InputWithHint: Story = {
  render: (_, context) => (
    <FormField label={sampleFor(context).name} hint={sampleFor(context).hint}>
      {(control) => <Input {...control} />}
    </FormField>
  ),
};

export const InputWithError: Story = {
  render: (_, context) => (
    <FormField label={sampleFor(context).name} error={sampleFor(context).error}>
      {(control) => <Input {...control} defaultValue="x" />}
    </FormField>
  ),
};

export const MultiLine: Story = {
  render: (_, context) => (
    <FormField label={sampleFor(context).notes} hint={sampleFor(context).hint}>
      {(control) => <Textarea {...control} />}
    </FormField>
  ),
};

export const Dropdown: Story = {
  render: (_, context) => (
    <FormField label={sampleFor(context).pick} error={sampleFor(context).error}>
      {(control) => (
        <Select
          {...control}
          dir={context.globals.direction === "ltr" ? "ltr" : "rtl"}
          placeholder={sampleFor(context).pick}
          options={sizeOptions(sampleFor(context))}
        />
      )}
    </FormField>
  ),
};
