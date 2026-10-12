"use client";
/** Hook that loads the signed-in user's clients: a name search and "load more" paging by limit and offset. */
import { clientPageSchema, type Client } from "@tafsila/schemas";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { clientKeys } from "./query-keys";

/** Clients per page. */
export const CLIENTS_PAGE_SIZE = 20;

/** What the list screen reads. */
export interface ClientsResult {
  /** Clients loaded so far, in order. */
  readonly clients: Client[];
  /** Clients matching the search, over all pages. */
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
 * Loads clients matching `q`, a page at a time; the previous list stays on screen while a new search loads.
 *
 * @param q - Name search; empty for everyone.
 * @param limit - Page size.
 * @returns The clients and the paging controls.
 */
export function useClients(q: string, limit: number = CLIENTS_PAGE_SIZE): ClientsResult {
  const query = useInfiniteQuery({
    queryKey: clientKeys.list(q, limit),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam, signal }) =>
      apiRequest("/clients", {
        schema: clientPageSchema,
        signal,
        query: { q: q || undefined, limit, offset: pageParam },
      }),
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length;
      return next < last.total && last.items.length > 0 ? next : undefined;
    },
  });
  return {
    clients: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isPending: query.isPending,
    error: query.error,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}
