import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { AppShell } from "./app-shell";
import { Button } from "./button";
import { Card } from "./card";
import { PageHeader } from "./page-header";
import { sampleFor } from "./sample-text";
import { ToastProvider, useToast } from "./toast";

const meta: Meta = { title: "Layout/Toast and AppShell", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;

/**
 * Shows one toast of each tone as soon as it mounts.
 *
 * @param props - Texts for the toasts.
 * @param props.title - Toast title.
 * @param props.description - Toast detail.
 * @returns Nothing visible.
 */
function ToastDemo({ title, description }: Readonly<{ title: string; description: string }>): null {
  const { showToast } = useToast();
  useEffect(() => {
    showToast({ title, description, tone: "success" });
    showToast({ title, tone: "danger" });
  }, [showToast, title, description]);
  return null;
}

export const Toasts: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <ToastProvider
        closeLabel={text.close}
        regionLabel={text.title}
        dir={context.globals.direction === "ltr" ? "ltr" : "rtl"}
      >
        <div className="h-96">
          <ToastDemo title={text.status} description={text.body} />
        </div>
      </ToastProvider>
    );
  },
};

export const Shell: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <AppShell
        banner={
          <p className="bg-warning px-4 py-2 text-center text-sm font-semibold text-on-primary">
            {text.banner}
          </p>
        }
        header={<strong className="text-lg text-primary">{text.title}</strong>}
        navigation={
          <>
            <Button variant="ghost">{text.tabs[0]}</Button>
            <Button variant="ghost">{text.tabs[1]}</Button>
          </>
        }
        navigationLabel={text.navigation}
      >
        <div className="flex flex-col gap-4">
          <PageHeader title={text.title} actions={<Button>{text.send}</Button>} />
          <Card>{text.body}</Card>
        </div>
      </AppShell>
    );
  },
};
