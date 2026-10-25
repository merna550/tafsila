/** Test-only page that hosts the pattern viewer for the browser tests, until the pattern page (#251) exists. */
import { loadPublicConfig } from "@tafsila/config";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { ViewerDevHost } from "@/features/pattern-viewer/ViewerDevHost";

/**
 * Renders the viewer host; answers 404 in production.
 *
 * @returns The host page.
 */
export default function PatternViewerDevPage(): ReactElement {
  if (loadPublicConfig().appEnv === "production") notFound();
  return (
    <main className="p-4">
      <ViewerDevHost />
    </main>
  );
}
