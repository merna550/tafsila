import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import { IconButton } from "./icon-button";
import { CheckIcon } from "./icons";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";
import { sampleFor } from "./sample-text";
import { Tooltip } from "./tooltip";

const meta: Meta = { title: "Display/Basics" };
export default meta;
type Story = StoryObj;

export const CardAndBadges: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <div className="flex flex-col gap-4">
        <Card title={text.title} footer={<Button>{text.send}</Button>}>
          {text.body}
        </Card>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{text.status}</Badge>
          <Badge tone="success">{text.status}</Badge>
          <Badge tone="warning">{text.status}</Badge>
          <Badge tone="danger">{text.status}</Badge>
          <Badge tone="info">{text.status}</Badge>
          <Avatar alt={text.name} initials={text.initials} />
        </div>
      </div>
    );
  },
};

export const Loading: Story = {
  render: (_, context) => (
    <div className="flex flex-col gap-4">
      <Spinner label={sampleFor(context).loading} />
      <Skeleton />
      <Skeleton variant="block" />
      <Skeleton variant="circle" />
      <Skeleton variant="table" rows={3} />
    </div>
  ),
};

export const TooltipOpen: Story = {
  render: (_, context) => (
    <div className="flex justify-center pt-4 pb-16">
      <Tooltip
        content={sampleFor(context).hint}
        dir={context.globals.direction === "ltr" ? "ltr" : "rtl"}
        defaultOpen
      >
        <IconButton label={sampleFor(context).send}>
          <CheckIcon className="size-5" />
        </IconButton>
      </Tooltip>
    </div>
  ),
};
