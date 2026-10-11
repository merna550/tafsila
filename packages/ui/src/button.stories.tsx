import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Link } from "./link";
import { sampleFor } from "./sample-text";

const meta: Meta<typeof Button> = { title: "Actions/Button", component: Button };
export default meta;
type Story = StoryObj<typeof Button>;

export const Variants: Story = {
  render: (_, context) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>{sampleFor(context).send}</Button>
      <Button variant="secondary">{sampleFor(context).send}</Button>
      <Button variant="ghost">{sampleFor(context).send}</Button>
      <Button variant="danger">{sampleFor(context).send}</Button>
      <Button disabled>{sampleFor(context).send}</Button>
    </div>
  ),
};

export const IconAndLink: Story = {
  render: (_, context) => (
    <div className="flex items-center gap-4">
      <IconButton label={sampleFor(context).send}>
        <svg
          viewBox="0 0 16 16"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconButton>
      <Link href="#help">{sampleFor(context).link}</Link>
    </div>
  ),
};
