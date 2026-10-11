import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Radio, RadioGroup } from "./radio";
import { sampleFor } from "./sample-text";
import { Switch } from "./switch";

const meta: Meta = { title: "Forms/Selection controls" };
export default meta;
type Story = StoryObj;

export const Checkboxes: Story = {
  render: (_, context) => (
    <div className="flex flex-col gap-3">
      {[true, false].map((checked) => (
        <label key={String(checked)} className="flex min-h-11 items-center gap-3">
          <Checkbox defaultChecked={checked} />
          {sampleFor(context).name}
        </label>
      ))}
      <label className="flex min-h-11 items-center gap-3">
        <Checkbox disabled />
        {sampleFor(context).hint}
      </label>
    </div>
  ),
};

export const Radios: Story = {
  render: (_, context) => (
    <RadioGroup
      defaultValue="m"
      dir={context.globals.direction === "ltr" ? "ltr" : "rtl"}
      aria-label={sampleFor(context).pick}
    >
      {["s", "m", "l"].map((value, index) => (
        <label key={value} className="flex min-h-11 items-center gap-3">
          <Radio value={value} />
          {sampleFor(context).options[index]}
        </label>
      ))}
    </RadioGroup>
  ),
};

export const Switches: Story = {
  render: (_, context) => (
    <div className="flex flex-col gap-3">
      {[true, false].map((checked) => (
        <label key={String(checked)} className="flex min-h-11 items-center gap-3">
          <Switch defaultChecked={checked} />
          {sampleFor(context).name}
        </label>
      ))}
    </div>
  ),
};
