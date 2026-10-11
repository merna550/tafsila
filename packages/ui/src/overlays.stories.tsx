import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { sampleFor } from "./sample-text";
import { Sheet, type SheetSide } from "./sheet";

const meta: Meta = { title: "Overlays/Dialog and Sheet", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;

/**
 * Reads the page direction chosen in the toolbar.
 *
 * @param context - Story context.
 * @param context.globals - Storybook globals.
 * @returns "ltr" or "rtl".
 */
function directionOf(context: { readonly globals: Record<string, unknown> }): "rtl" | "ltr" {
  return context.globals.direction === "ltr" ? "ltr" : "rtl";
}

export const DialogOpen: Story = {
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <Dialog
        open
        dir={directionOf(context)}
        title={text.title}
        description={text.body}
        closeLabel={text.close}
        footer={<Button>{text.send}</Button>}
      >
        {text.hint}
      </Dialog>
    );
  },
};

/**
 * Builds a story that shows a sheet open on one edge.
 *
 * @param side - Edge to attach to.
 * @returns The story.
 */
function sheetStory(side: SheetSide): Story {
  return {
    render: (_, context) => {
      const text = sampleFor(context);
      return (
        <Sheet open side={side} dir={directionOf(context)} title={text.title} closeLabel={text.close}>
          {text.body}
        </Sheet>
      );
    },
  };
}

export const SheetStart: Story = sheetStory("start");
export const SheetBottom: Story = sheetStory("bottom");
