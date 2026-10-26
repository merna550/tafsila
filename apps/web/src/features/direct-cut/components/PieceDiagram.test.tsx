import { cutPlanFixture } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { highlightOf } from "../model/steps";
import { PieceDiagram } from "./PieceDiagram";

const front = cutPlanFixture.pieces[0];
const stepB = front.steps[1];

/**
 * Renders the front piece with an optional highlight in a language.
 *
 * @param locale - The language.
 * @param step - The step to highlight, if any.
 * @returns The markup.
 */
function draw(locale: "ar" | "en", step?: typeof stepB): string {
  return renderWithIntl(
    <PieceDiagram
      piece={front}
      label="Front"
      highlight={step ? highlightOf([step]) : null}
      locale={locale}
      digits="western"
    />,
    locale,
  );
}

/**
 * The opening tag of the group of a point.
 *
 * @param html - The markup.
 * @param id - The point id.
 * @returns The tag.
 */
function pointTag(html: string, id: string): string {
  return new RegExp(`<g[^>]*data-point-id="${id}"[^>]*>`).exec(html)![0];
}

describe("PieceDiagram", () => {
  it("draws every point normally without a highlight", () => {
    const html = draw("en");
    expect(html).not.toContain("data-dimmed");
    expect(html).not.toContain("data-current");
    expect(html).not.toContain("data-guide");
  });

  it("marks only the step's point as current and dims the others", () => {
    const html = draw("en", stepB);
    expect(pointTag(html, "B")).toContain('data-current="true"');
    expect(pointTag(html, "A")).toContain('data-dimmed="true"');
    expect(pointTag(html, "C")).toContain('data-dimmed="true"');
    expect(html.match(/data-current/g)).toHaveLength(1);
  });

  it("draws the step's guides with centimetre labels in Western digits", () => {
    expect(draw("en", stepB).match(/data-guide/g)).toHaveLength(2);
    expect(draw("en", stepB)).toContain("18.5 cm");
    const ar = draw("ar", stepB);
    expect(ar).toContain("6.2 سم");
    expect(ar).not.toMatch(/[٠-٩]/);
  });

  it("never mirrors", () => {
    expect(draw("ar")).toContain('dir="ltr"');
  });
});
