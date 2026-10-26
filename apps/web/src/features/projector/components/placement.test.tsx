import type { PatternScene } from "@tafsila/engine/viewer";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { PieceSwitcher } from "./PieceSwitcher";
import { PlacementControls } from "./PlacementControls";

const noop = (): void => undefined;
const SCENE = {
  widthMm: 700,
  heightMm: 500,
  pieces: [
    { id: "front", name: { ar: "الأمام", en: "Front" } },
    { id: "back", name: { ar: "الخلف", en: "Back" } },
  ],
} as unknown as PatternScene;

/**
 * Renders the switcher.
 *
 * @param selection - Which pieces are shown.
 * @param locale - Page language.
 * @returns The HTML.
 */
function switcher(selection: string, locale: "ar" | "en"): string {
  return renderWithIntl(
    <PieceSwitcher scene={SCENE} selection={selection} onChoose={noop} onAll={noop} onStep={noop} />,
    locale,
  );
}

describe("PieceSwitcher", () => {
  it("lists every piece in Arabic and in English", () => {
    const ar = switcher("all", "ar");
    for (const text of ["كل القطع", "الأمام", "الخلف", "السابقة", "التالية"]) expect(ar).toContain(text);
    const en = switcher("all", "en");
    for (const text of ["All pieces", "Front", "Back", "Previous", "Next"]) expect(en).toContain(text);
  });

  it("marks only the chosen row as current", () => {
    const out = switcher("back", "en");
    expect(out.match(/aria-current/g)).toHaveLength(1);
    expect(out).toMatch(/aria-current="true"[^>]*>Back|data-piece-row="back"[^>]*aria-current/);
  });
});

describe("PlacementControls", () => {
  it("disables Rotate without an active piece but keeps Reset", () => {
    const off = renderWithIntl(<PlacementControls hasActive={false} onRotate={noop} onReset={noop} />, "en");
    expect(off).toMatch(/disabled=""[^>]*>Rotate 180°/);
    expect(off).not.toMatch(/disabled=""[^>]*>Reset layout/);
    const on = renderWithIntl(<PlacementControls hasActive onRotate={noop} onReset={noop} />, "ar");
    expect(on).not.toContain('disabled=""');
    expect(on).toContain("تدوير 180°");
  });
});
