import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { CategoryStep } from "./CategoryStep";
import { ClientChip } from "./ClientChip";
import { ResetNotice } from "./ResetNotice";
import { SectionNav } from "./SectionNav";

vi.mock("@/shared/i18n", () => ({ DIRECTION: { ar: "rtl", en: "ltr" } }));

describe("CategoryStep", () => {
  it("shows the three garment cards and a disabled pants card in both languages", () => {
    const ar = renderWithIntl(<CategoryStep onChoose={vi.fn()} pending={false} />);
    for (const name of ["فستان", "تنورة", "بلوزة", "بنطلون", "قريباً"]) expect(ar).toContain(name);
    const en = renderWithIntl(<CategoryStep onChoose={vi.fn()} pending={false} />, "en");
    for (const name of ["Dress", "Skirt", "Blouse"]) expect(en).toContain(name);
    expect(en).toContain("<svg");
  });
});

describe("SectionNav", () => {
  it("marks the open step and the changed ones", () => {
    const html = renderWithIntl(
      <SectionNav
        label="Steps"
        active="sleeve"
        onSelect={vi.fn()}
        items={[
          { id: "neckline", label: "Neckline", done: true },
          { id: "sleeve", label: "Sleeves", done: false },
        ]}
      />,
      "en",
    );
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain("Sleeves");
    expect(html).toContain("<svg");
  });
});

describe("ResetNotice", () => {
  it("says what changed and offers undo", () => {
    const html = renderWithIntl(
      <ResetNotice
        message="We changed the collar"
        undoLabel="Undo"
        dismissLabel="Close"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />,
      "en",
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("We changed the collar");
    expect(html).toContain("Undo");
  });
});

describe("ClientChip", () => {
  it("shows the remove button only when it can be removed", () => {
    expect(
      renderWithIntl(<ClientChip label="For: Salma" removeLabel="Remove" onRemove={vi.fn()} />),
    ).toContain('aria-label="Remove"');
    expect(renderWithIntl(<ClientChip label="For: Salma" removeLabel="Remove" />)).not.toContain(
      "aria-label",
    );
  });
});
