import { defaultSpec } from "@tafsila/engine/spec-rules";
import type { DesignAnalysisResult } from "@tafsila/schemas";
import { describe, expect, it, vi } from "vitest";
import { MESSAGES, renderWithIntl } from "@/shared/i18n/testing";
import { ConfirmBody } from "../ConfirmBody";
import { ContinueBar } from "./ContinueBar";
import { UnsupportedPanel } from "./UnsupportedPanel";

const spec = { ...defaultSpec("skirt"), skirt: { type: "circle-half" as const, length: "midi" as const } };
const result: DesignAnalysisResult = {
  spec,
  category: { value: "skirt", confidence: 0.9 },
  confidence: { "skirt.type": 0.48, "skirt.length": 0.74, waistband: 0.5 },
  notes: [{ path: "skirt.type", text: { ar: "تبدو دائرية", en: "Looks like a circle" } }],
  unsupported: [{ text: { ar: "كشكشة", en: "Ruffle" } }],
};
const noop = (): void => undefined;

describe("ConfirmBody", () => {
  it("highlights low-confidence cards, shows the AI note and counts what is left", () => {
    const html = renderWithIntl(<ConfirmBody result={result} busy={false} onContinue={noop} />, "en");
    expect(html.match(/data-state="needs-confirm"/g)).toHaveLength(2);
    expect(html).toContain("Looks like a circle");
    expect(html).toContain("2 features left to check");
    expect(html).toContain(MESSAGES.en.confirmDesign.unsupported.title);
    expect(html).toMatch(/<button[^>]* disabled=""[^>]*>Continue to the pattern/);
  });

  it("shows no weak banner when only some features are low", () => {
    const some = { ...result, confidence: { "skirt.type": 0.1, "skirt.length": 0.9, waistband: 0.9 } };
    const html = renderWithIntl(<ConfirmBody result={some} busy={false} onContinue={noop} />, "en");
    expect(html).not.toContain(MESSAGES.en.confirmDesign.weak);
  });

  it("shows the weak banner when most features are low", () => {
    const weak = { ...result, confidence: { "skirt.type": 0.1, "skirt.length": 0.2, waistband: 0.9 } };
    const html = renderWithIntl(<ConfirmBody result={weak} busy={false} onContinue={noop} />, "en");
    expect(html).toContain(MESSAGES.en.confirmDesign.weak);
  });
});

describe("UnsupportedPanel", () => {
  it("lists the text in the user's language", () => {
    const html = renderWithIntl(<UnsupportedPanel items={result.unsupported} />, "ar");
    expect(html).toContain("كشكشة");
    expect(html).not.toContain("Ruffle");
  });

  it("renders nothing when everything is supported", () => {
    expect(renderWithIntl(<UnsupportedPanel items={[]} />, "en")).toBe("");
  });
});

describe("ContinueBar", () => {
  it("enables the button when nothing is left", () => {
    const html = renderWithIntl(<ContinueBar remaining={0} busy={false} onContinue={vi.fn()} />, "en");
    expect(html).toContain("All features confirmed");
    expect(html).not.toMatch(/<button[^>]* disabled=""/);
  });
});
