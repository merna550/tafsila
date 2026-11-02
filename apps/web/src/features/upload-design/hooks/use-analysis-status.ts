"use client";
/** Hook that polls the analysis of a design every 2 seconds until it is done or failed, and says when it takes longer than usual (FR-DES-02). */
import {
  analyzeAcceptedResponseSchema as analyzeSchema,
  designAnalysisResponseSchema,
  type DesignAnalysisState,
} from "@tafsila/schemas";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "@/shared/api";
import { phaseOf, POLL_INTERVAL_MS, shouldKeepPolling, type AnalysisPhase } from "../model/analysis-view";

/** What the hook gives the screen. */
export interface AnalysisStatus {
  /** What to show now. */
  readonly phase: AnalysisPhase;
  /** The latest state from the API, if any. */
  readonly state: DesignAnalysisState | undefined;
  /** True when the status request itself keeps failing. */
  readonly requestFailed: boolean;
  /** Starts the analysis again after a failure. */
  readonly retry: () => Promise<void>;
  /** True while a retry is being sent. */
  readonly retrying: boolean;
}

/**
 * Polls `GET /designs/{id}/analysis`.
 *
 * @param designId - The design.
 * @returns The phase, the state and the retry action.
 */
export function useAnalysisStatus(designId: string): AnalysisStatus {
  const queryClient = useQueryClient();
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(openedAt);
  const [retrying, setRetrying] = useState(false);
  const key = ["designs", designId, "analysis"] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      apiRequest(`/designs/${designId}/analysis`, { schema: designAnalysisResponseSchema, signal }),
    refetchInterval: (current) => (shouldKeepPolling(current.state.data) ? POLL_INTERVAL_MS : false),
    retry: 2,
  });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);
  /**
   * Asks for a new analysis and refreshes the status.
   *
   * @returns Resolves when the request was sent.
   */
  const retry = async (): Promise<void> => {
    setRetrying(true);
    try {
      await apiRequest(`/designs/${designId}/analyze`, { method: "POST", body: {}, schema: analyzeSchema });
      await queryClient.invalidateQueries({ queryKey: key });
    } finally {
      setRetrying(false);
    }
  };
  return {
    phase: phaseOf(query.data, now - openedAt),
    state: query.data,
    requestFailed: query.isError,
    retry,
    retrying,
  };
}
