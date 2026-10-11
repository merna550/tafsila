import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { PageHeader } from "./page-header";
import { sampleFor } from "./sample-text";

const meta: Meta = { title: "Feedback/States" };
export default meta;
type Story = StoryObj;

export const Empty: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <EmptyState title={text.emptyTitle} description={text.body} action={<Button>{text.send}</Button>} />
    );
  },
};

export const ErrorWithRetry: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <ErrorState
        title={text.errorTitle}
        description={text.body}
        retryLabel={text.retry}
        onRetry={() => undefined}
        requestId="req-1a2b3c"
      />
    );
  },
};

export const Header: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return <PageHeader title={text.title} description={text.body} actions={<Button>{text.send}</Button>} />;
  },
};
