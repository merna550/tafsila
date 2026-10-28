import { describe, expect, it, vi } from "vitest";
import { clientApiError } from "@/shared/api";
import { renderWithIntl } from "@/shared/i18n/testing";
import { FabricRecommendations } from "./FabricRecommendations";
import { useFabricRecommendations } from "./hooks/use-fabric-recommendations";

vi.mock("./hooks/use-fabric-recommendations", () => ({ useFabricRecommendations: vi.fn() }));

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
