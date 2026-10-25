"use client";
/** Hook that loads the signed-in user's designs: a title search, an optional client filter and "load more" paging. */
import { designPageSchema, type DesignListItem } from "@tafsila/schemas";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { designKeys } from "../design-keys";

/** Designs per page. */
export const DESIGNS_PAGE_SIZE = 20;

/** What decides which designs are listed. */
export interface DesignsParams {
  /** Title search; empty for all. */
  readonly q?: string;
  /** Only designs made for this client. */
  readonly clientId?: string;
  /** Page size. */
  readonly limit?: number;
}

/** What the screens read. */
export interface DesignsResult {
  /** Designs loaded so far, in order. */
  readonly designs: DesignListItem[];
  /** Designs matching the filters, over all pages. */
  readonly total: number;
  /** True while the first page loads. */
  readonly isPending: boolean;
  /** The load error, if any. */
  readonly error: unknown;
  /** True when more pages exist. */
  readonly hasMore: boolean;
  /** True while a further page loads. */
  readonly isLoadingMore: boolean;
  /** Loads the next page. */
  readonly loadMore: () => void;
  /** Loads again after an error. */
  readonly refetch: () => void;
}

/**
 * Loads designs a page at a time; the previous list stays on screen while a new filter loads.
 *
 * @param params - Title search, client filter and page size.
 * @returns The designs and the paging controls.
 */
export function useDesigns(params: DesignsParams = {}): DesignsResult {
  const { q = "", clientId, limit = DESIGNS_PAGE_SIZE } = params;
  const query = useInfiniteQuery({
    queryKey: designKeys.list({ q, clientId: clientId ?? null, limit }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam, signal }) =>
      apiRequest("/designs", {
        schema: designPageSchema,
        signal,
        query: { q: q || undefined, clientId, limit, offset: pageParam },
      }),
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length;
      return next < last.total && last.items.length > 0 ? next : undefined;
    },
  });
  return {
    designs: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isPending: query.isPending,
    error: query.error,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}
