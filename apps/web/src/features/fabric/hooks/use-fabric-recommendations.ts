"use client";
/** Hook that loads the recommended fabrics and the avoid list of a saved version (FR-REC-02). */
import { recommendFabricsResponseSchema, type RecommendFabricsResponse } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { fabricKeys } from "./query-keys";

/** How long an answer stays fresh (5 minutes): the catalogue changes rarely (ADR-319 item 2). */
const STALE_TIME_MS = 300_000;

/**
 * Loads the recommendations of one saved version.
 *
 * @param versionId - Version id.
 * @returns The TanStack query holding the recommendation.
 */
export function useFabricRecommendations(versionId: string): UseQueryResult<RecommendFabricsResponse> {
  return useQuery({
    queryKey: fabricKeys.recommend(versionId),
    staleTime: STALE_TIME_MS,
    queryFn: ({ signal }) =>
      apiRequest(`/fabrics/recommend?versionId=${encodeURIComponent(versionId)}`, {
        schema: recommendFabricsResponseSchema,
        signal,
      }),
  });
}
