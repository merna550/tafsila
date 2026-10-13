"use client";
/** Hook that loads the users list: search, verified filter and "load more" paging by limit and offset. */
import { adminUserPageSchema, type AdminUser } from "@tafsila/schemas";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { adminUserKeys, type VerifiedFilter } from "./query-keys";

/** Users per page. */
export const ADMIN_USERS_PAGE_SIZE = 20;

/** What the list screen reads. */
export interface AdminUsersResult {
  /** Users loaded so far, newest first. */
  readonly users: AdminUser[];
  /** Users matching, over all pages. */
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
 * Maps the filter to the API's `verified` query value.
 *
 * @param filter - Screen filter.
 * @returns "true", "false" or undefined for everyone.
 */
export function verifiedParam(filter: VerifiedFilter): "true" | "false" | undefined {
  if (filter === "verified") return "true";
  return filter === "unverified" ? "false" : undefined;
}

/**
 * Loads users matching the search and the filter, a page at a time; the old list stays while a new search loads.
 *
 * @param q - Search in name, e-mail and phone; empty for everyone.
 * @param filter - Verified filter.
 * @param limit - Page size.
 * @returns The users and the paging controls.
 */
export function useAdminUsers(
  q: string,
  filter: VerifiedFilter,
  limit: number = ADMIN_USERS_PAGE_SIZE,
): AdminUsersResult {
  const query = useInfiniteQuery({
    queryKey: adminUserKeys.list(q, filter, limit),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam, signal }) =>
      apiRequest("/admin/users", {
        schema: adminUserPageSchema,
        signal,
        query: { q: q || undefined, verified: verifiedParam(filter), limit, offset: pageParam },
      }),
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length;
      return next < last.total && last.items.length > 0 ? next : undefined;
    },
  });
  return {
    users: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isPending: query.isPending,
    error: query.error,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}
