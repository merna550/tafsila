import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { withDemoChecks } from "../dev-report";
import { ValidationReport } from "./ValidationReport";

const result = generatePattern(seedDress, sizeM);
const scene = buildPatternScene(result);
const report = withDemoChecks(result.validation);
const noop = (): void => undefined;

/**
 * Renders the panel with the demo report.
 *
 * @param locale - Language.
 * @param selectedKey - Selected row key.
 * @returns The markup.
 */
function html(locale: "ar" | "en", selectedKey: string | null = null): string {
  return renderWithIntl(
    <ValidationReport report={report} scene={scene} selectedKey={selectedKey} onSelect={noop} />,
    locale,
  );
}

describe("ValidationReport", () => {
  it("shows failure first, then the warning, with icon and status word", () => {
    const en = html("en");
    expect(en.indexOf("❌")).toBeLessThan(en.indexOf("⚠️"));
    expect(en.indexOf("⚠️")).toBeLessThan(en.indexOf("✅"));
    expect(en).toContain("Fail: ");
    expect(en).toContain("Warning: ");
    const ar = html("ar");
    expect(ar).toContain("فشل: ");
    expect(ar).toContain("تنبيه: ");
  });

  it("writes measured and expected values in cm", () => {
    expect(html("en")).toContain("Measured 24.4 cm · Expected 22 cm");
    expect(html("ar")).toContain("المقاس 24.4 سم · المطلوب 22 سم");
  });

  it("puts the passes in a closed details element", () => {
    const out = html("en");
    expect(out).toContain('<details data-testid="report-passes">');
    expect(out).toContain(" passed");
  });

  it("renders rows with refs as buttons and marks the selected one", () => {
    const out = html("en", "FR-VAL-01-DEMO_FAIL-0");
    expect(out).toMatch(/<button[^>]*aria-pressed="true"[^>]*data-testid="report-row-FR-VAL-01-DEMO_FAIL-0"/);
    expect(out).toContain("The place is shaded on the pattern");
    expect(out).toMatch(/<button[^>]*aria-pressed="false"/);
  });

  it("switches the message with the language", () => {
    expect(html("en")).toContain("The side edge does not match the armhole.");
    expect(html("ar")).toContain("طول حافة الجنب لا يطابق فتحة الذراع.");
  });

  it("gives an empty report only the status header", () => {
    const out = renderWithIntl(
      <ValidationReport
        report={{ status: "pass", checks: [] }}
        scene={scene}
        selectedKey={null}
        onSelect={noop}
      />,
      "en",
    );
    expect(out).toContain('role="status"');
    expect(out).not.toContain("<ul");
    expect(out).not.toContain("<details");
  });
});
