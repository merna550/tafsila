/** Storybook preview: every story renders in a direction (Arabic RTL / English LTR) and width (mobile / desktop) chosen in the toolbar or the `globals` URL param. */
import type { Decorator, Preview } from "@storybook/react-vite";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./preview.css";

/** Widths a story can be shown at. */
const WIDTHS = { mobile: "22.5rem", desktop: "48rem" } as const;

/**
 * Wraps a story in a container with the chosen direction, language and width.
 *
 * @param Story - The story component.
 * @param context - Story context carrying the toolbar globals.
 * @returns The wrapped story.
 */
const withDirectionAndWidth: Decorator = (Story, context) => {
  const direction = context.globals.direction === "ltr" ? "ltr" : "rtl";
  const width = context.globals.width === "desktop" ? WIDTHS.desktop : WIDTHS.mobile;
  return (
    <div
      dir={direction}
      lang={direction === "rtl" ? "ar" : "en"}
      style={{ width, maxWidth: "100%" }}
      className="p-4"
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withDirectionAndWidth],
  parameters: { layout: "fullscreen" },
  initialGlobals: { direction: "rtl", width: "mobile" },
  globalTypes: {
    direction: {
      description: "Reading direction",
      toolbar: { title: "Direction", items: ["rtl", "ltr"], dynamicTitle: true },
    },
    width: {
      description: "Viewport width",
      toolbar: { title: "Width", items: ["mobile", "desktop"], dynamicTitle: true },
    },
  },
};

export default preview;
