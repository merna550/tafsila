import { describe, expect, it } from "vitest";
import { MESSAGES, renderWithIntl } from "@/shared/i18n/testing";
import { AnalysisPanel } from "./AnalysisPanel";
import { DropZone } from "./DropZone";
import { PhotoGrid } from "./PhotoGrid";
import { StartPanel } from "./StartPanel";
import type { PhotoItem } from "../model/photo-rules";

/**
 * Escapes quotes the way React writes them into HTML.
 *
 * @param text - Plain text.
 * @returns The escaped text.
 */
const esc = (text: string): string => text.replaceAll("'", "&#x27;").replaceAll('"', "&quot;");
const noop = (): void => undefined;
const item = (id: string, status: PhotoItem["status"], errorKey?: PhotoItem["errorKey"]): PhotoItem => ({
  id,
  status,
  progress: 0.5,
  ...(errorKey ? { errorKey } : {}),
});

describe("PhotoGrid", () => {
  it("shows slot names, the add tile, the count and a remove button for a ready photo", () => {
    const html = renderWithIntl(
      <PhotoGrid
        items={[item("a", "ready"), item("b", "uploading")]}
        previews={{ a: "blob:x" }}
        disabled={false}
        onChoose={noop}
        onRemove={noop}
      />,
      "en",
    );
    expect(html).toContain(MESSAGES.en.uploadDesign.slot.front);
    expect(html).toContain(MESSAGES.en.uploadDesign.slot.back);
    expect(html).toContain(MESSAGES.en.uploadDesign.add);
    expect(html).toContain(MESSAGES.en.uploadDesign.remove);
    expect(html.match(/aria-label="Remove photo"/g)).toHaveLength(1);
  });
  it("hides the add tile at three photos and shows a failed photo's message", () => {
    const html = renderWithIntl(
      <PhotoGrid
        items={[item("a", "ready"), item("b", "ready"), item("c", "failed", "heic")]}
        previews={{}}
        disabled={false}
        onChoose={noop}
        onRemove={noop}
      />,
      "ar",
    );
    expect(html).not.toContain(`>${MESSAGES.ar.uploadDesign.add}<`);
    expect(html).toContain(MESSAGES.ar.uploadDesign.errors.heic);
  });
});

describe("DropZone and StartPanel", () => {
  it("shows the drop zone title and disables start without photos", () => {
    expect(renderWithIntl(<DropZone dragging={false} disabled={false} onChoose={noop} />, "ar")).toContain(
      MESSAGES.ar.uploadDesign.dropTitle,
    );
    const html = renderWithIntl(<StartPanel empty enabled={false} running={false} onStart={noop} />, "en");
    expect(html).toMatch(/<button[^>]*\sdisabled=""/);
    expect(html).toContain(MESSAGES.en.uploadDesign.needFront);
    expect(html).toContain(MESSAGES.en.uploadDesign.manual);
  });
  it("enables start when ready", () => {
    expect(
      renderWithIntl(<StartPanel empty={false} enabled running={false} onStart={noop} />, "en"),
    ).not.toMatch(/<button[^>]*\sdisabled=""/);
  });
});

describe("AnalysisPanel", () => {
  const render = (phase: "running" | "slow" | "failed" | "done"): string =>
    renderWithIntl(<AnalysisPanel phase={phase} designId="d1" retrying={false} onRetry={noop} />, "en");
  const t = MESSAGES.en.uploadDesign.analysing;
  it("shows the usual note while running, with a cancel link and no retry", () => {
    const html = render("running");
    expect(html).toContain(esc(t.usually));
    expect(html).toContain(t.cancel);
    expect(html).not.toContain(t.retry);
  });
  it("adds the manual picker when slow", () => {
    expect(render("slow")).toContain(t.slow);
    expect(render("slow")).toContain(t.manual);
  });
  it("shows the failure, retry and the manual picker when failed", () => {
    const html = render("failed");
    expect(html).toContain(t.failed);
    expect(html).toContain(t.retry);
    expect(html).toContain(t.manual);
    expect(html).toContain(esc(t.notCounted));
  });
  it("links to the design when done", () => {
    expect(render("done")).toContain('href="/en/designs/d1"');
  });
});
