"use client";
/** Hook that loads the AI explanation of the recommendations only when the user asks for it (FR-REC-04; the panel stays AI-free until then). */
import {
  fabricExplanationSchema,
  recommendFabricsResponseSchema,
  type FabricExplanation,
} from "@tafsila/schemas";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/shared/api";
import { fabricKeys } from "./query-keys";

/** What the explanation block needs: its state and the two actions. */
export interface FabricExplanationState {
  /** True once the user asked, also while the answer is on its way. */
  readonly asked: boolean;
  /** The text, once loaded. */
  readonly explanation: FabricExplanation | undefined;
  /** The failure, when the request failed. */
  readonly error: unknown;
  /** Asks for the text. */
  readonly ask: () => void;
  /** Asks again after a failure. */
  readonly retry: () => void;
}

/**
 * Loads the explanation of one saved version in one language, on demand. The server caches the text, so asking again
 * for the same recommendation is instant and costs nothing; the browser keeps it for the session.
 *
 * @param versionId - Version id.
 * @param locale - Language of the text (the page language).
 * @returns The explanation state and its actions.
 */
export function useFabricExplanation(versionId: string, locale: "ar" | "en"): FabricExplanationState {
  const [asked, setAsked] = useState(false);
  const query = useQuery({
    queryKey: fabricKeys.explain(versionId, locale),
    enabled: asked,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    queryFn: async ({ signal }) => {
      const path = `/fabrics/recommend?versionId=${encodeURIComponent(versionId)}&explain=true&locale=${locale}`;
      const body = await apiRequest(path, { schema: recommendFabricsResponseSchema, signal });
      return fabricExplanationSchema.parse(body.explanation);
    },
  });
  return {
    asked,
    explanation: query.data,
    error: query.error,
    ask: () => setAsked(true),
    retry: () => void query.refetch(),
  };
}
