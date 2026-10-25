"use client";
/** Hook that loads a design's versions, newest first, a page at a time. */
import { patternVersionPageSchema, type PatternVersionListItem } from "@tafsila/schemas";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { versionKeys } from "./query-keys";

/** Versions per page. */
export const VERSIONS_PAGE_SIZE = 20;

/** What the history screen reads. */
export interface VersionsResult {
  /** Versions loaded so far, newest first. */
  readonly versions: PatternVersionListItem[];
  /** All versions of the design. */
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
 * Loads the versions of a design.
 *
 * @param designId - Design id.
 * @returns The versions and the paging controls.
 */
export function useVersions(designId: string): VersionsResult {
  const query = useInfiniteQuery({
    queryKey: versionKeys.list(designId),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      apiRequest(`/designs/${designId}/versions`, {
        schema: patternVersionPageSchema,
        signal,
        query: { limit: VERSIONS_PAGE_SIZE, offset: pageParam },
      }),
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length;
      return next < last.total && last.items.length > 0 ? next : undefined;
    },
  });
  return {
    versions: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isPending: query.isPending,
    error: query.error,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}
