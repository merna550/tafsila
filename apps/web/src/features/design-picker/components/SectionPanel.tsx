/** The panel of the open section. This issue shows the title only; the feature cards arrive with #246. */
import type { ReactElement, ReactNode } from "react";

/** Props for {@link SectionPanel}. */
interface SectionPanelProps {
  /** Section title (already translated). */
  readonly title: string;
  /** The section's content; a short hint is shown until the feature cards exist. */
  readonly children?: ReactNode;
}

/**
 * Renders the section title and its content.
 *
 * @param props - Title and content.
 * @returns The panel.
 */
export function SectionPanel({ title, children }: Readonly<SectionPanelProps>): ReactElement {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
