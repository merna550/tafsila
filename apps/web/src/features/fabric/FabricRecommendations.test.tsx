import { describe, expect, it, vi } from "vitest";
import { clientApiError } from "@/shared/api";
import { renderWithIntl } from "@/shared/i18n/testing";
import { FabricRecommendations } from "./FabricRecommendations";
import { useFabricRecommendations } from "./hooks/use-fabric-recommendations";

vi.mock("./hooks/use-fabric-recommendations", () => ({ useFabricRecommendations: vi.fn() }));
vi.mock("./ExplainRecommendations", () => ({ ExplainRecommendations: () => <i>explain-slot</i> }));

/**
 * Makes the hook answer with a query-like state.
 *
 * @param state - The pieces of the query the section reads.
 */
function answer(state: { isPending: boolean; error?: unknown; data?: unknown }): void {
  vi.mocked(useFabricRecommendations).mockReturnValue({
    refetch: vi.fn(),
    error: null,
    data: undefined,
    ...state,
  } as unknown as ReturnType<typeof useFabricRecommendations>);
}

describe("FabricRecommendations", () => {
  it("shows the heading and a skeleton while loading", () => {
    answer({ isPending: true });
    const html = renderWithIntl(<FabricRecommendations versionId="v1" />, "en");
    expect(html).toContain("Recommended fabrics");
    expect(html).not.toContain("Better avoided");
  });

  it("shows the explanation block after the fabrics once loaded", () => {
    answer({
      isPending: false,
      data: {
        recommended: [
          {
            fabricId: "crepe",
            score: 9,
            reason: { ar: "ينسدل", en: "Drapes" },
            fabric: {
              id: "crepe",
              nameAr: "كريب",
              nameEn: "Crepe",
              properties: { drape: 4, weight: 2, body: 1, stretch: 0, sheen: 3 },
            },
          },
        ],
        avoid: [],
        isDraft: false,
      },
    });
    expect(renderWithIntl(<FabricRecommendations versionId="v1" />, "en")).toContain("explain-slot");
  });

  it("shows the empty state when no fabric matches", () => {
    answer({ isPending: false, data: { recommended: [], avoid: [], isDraft: false } });
    const html = renderWithIntl(<FabricRecommendations versionId="v1" />, "ar");
    expect(html).toContain("لا توجد أقمشة مطابقة");
  });

  it("shows the error state with a retry button", () => {
    answer({ isPending: false, error: clientApiError("network") });
    const html = renderWithIntl(<FabricRecommendations versionId="v1" />, "en");
    expect(html).toContain("Try again");
  });
});
