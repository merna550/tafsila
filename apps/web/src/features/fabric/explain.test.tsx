import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { ExplainRecommendations } from "./ExplainRecommendations";
import { ExplainView } from "./components/ExplainView";
import { useFabricExplanation } from "./hooks/use-fabric-explanation";

vi.mock("./hooks/use-fabric-explanation", () => ({ useFabricExplanation: vi.fn() }));

const noop = (): void => undefined;

describe("ExplainView", () => {
  it("offers the button before anything is asked, in both languages", () => {
    const ar = renderWithIntl(<ExplainView status="idle" onAsk={noop} onRetry={noop} />, "ar");
    expect(ar).toContain("لماذا هذه الأقمشة؟");
    expect(ar).toContain("<button");
    expect(renderWithIntl(<ExplainView status="idle" onAsk={noop} onRetry={noop} />, "en")).toContain(
      "Why these fabrics?",
    );
  });

  it("shows the writing state with a status and skeleton lines", () => {
    const html = renderWithIntl(<ExplainView status="loading" onAsk={noop} onRetry={noop} />, "ar");
    expect(html).toContain("جارٍ كتابة الشرح...");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("<button");
  });

  it("shows the text with the AI note", () => {
    const html = renderWithIntl(
      <ExplainView status="ready" text="Crepe drapes well." onAsk={noop} onRetry={noop} />,
      "en",
    );
    expect(html).toContain("Crepe drapes well.");
    expect(html).toContain("Written by AI");
    expect(html).toContain("adds no new information");
  });

  it("shows the unavailable state with a retry button and no error text from the server", () => {
    const html = renderWithIntl(<ExplainView status="failed" onAsk={noop} onRetry={noop} />, "ar");
    expect(html).toContain("الشرح غير متاح الآن");
    expect(html).toContain("إعادة المحاولة");
  });
});

describe("ExplainRecommendations", () => {
  /**
   * Makes the hook answer with a state.
   *
   * @param state - The pieces of the state the block reads.
   */
  function answer(state: {
    asked: boolean;
    explanation?: { text: string; locale: "ar" | "en" };
    error?: unknown;
  }): void {
    vi.mocked(useFabricExplanation).mockReturnValue({
      ask: noop,
      retry: noop,
      error: null,
      explanation: undefined,
      ...state,
    });
  }

  it.each([
    [{ asked: false }, "idle"],
    [{ asked: true }, "loading"],
    [{ asked: true, error: new Error("x") }, "failed"],
    [{ asked: true, explanation: { text: "نص", locale: "ar" as const } }, "ready"],
  ])("maps %j to the %s state", (state, status) => {
    answer(state);
    expect(renderWithIntl(<ExplainRecommendations versionId="v1" />, "ar")).toContain(
      `data-status="${status}"`,
    );
  });
});
