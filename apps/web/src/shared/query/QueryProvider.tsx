"use client";
/** Provides the TanStack Query client to every page: server data is cached 30 seconds and retried only when retrying can help. */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactElement, type ReactNode } from "react";
import { ApiError, isRetryable } from "../api";

/** How long fetched data counts as fresh, in milliseconds (decision 30-5). */
export const STALE_TIME_MS = 30_000;
/** Most automatic retries of a failed read. */
const MAX_RETRIES = 2;

/**
 * Creates the query client with the app defaults: reads retry only retryable errors, writes never retry.
 *
 * @returns A new QueryClient.
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && error instanceof ApiError && isRetryable(error),
      },
      mutations: { retry: false },
    },
  });
}

/** Props for {@link QueryProvider}. */
interface QueryProviderProps {
  /** The app. */
  readonly children: ReactNode;
}

/**
 * Gives the app one QueryClient per browser tab.
 *
 * @param props - The children.
 * @returns The provider.
 */
export function QueryProvider({ children }: Readonly<QueryProviderProps>): ReactElement {
  const [client] = useState(createAppQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
