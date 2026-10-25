"use client";
/** Hook that holds the filters of the designs list: the debounced title search (local) and the client filter (in the address). */
import { useState } from "react";
import { useRouter } from "@/shared/i18n";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

/** What the screen reads and changes. */
export interface DesignsFilters {
  /** What the user typed. */
  readonly text: string;
  /** Sets the typed text. */
  readonly setText: (text: string) => void;
  /** The settled search sent to the API. */
  readonly q: string;
  /** True when a search or client filter is active or being typed. */
  readonly isFiltering: boolean;
  /** Puts the client filter in the address (undefined for all clients). */
  readonly changeClient: (id: string | undefined) => void;
  /** Clears the search and the client filter. */
  readonly clearFilters: () => void;
}

/**
 * Prepares the filters of the list.
 *
 * @param clientId - Client filter from the address.
 * @returns The filter state and its handlers.
 */
export function useDesignsFilters(clientId: string | undefined): DesignsFilters {
  const router = useRouter();
  const [text, setText] = useState("");
  const q = useDebouncedValue(text.trim());
  /**
   * Puts the client filter in the address.
   *
   * @param id - Chosen client, or undefined for all.
   */
  const changeClient = (id: string | undefined): void => {
    router.replace(id === undefined ? "/designs" : `/designs?clientId=${id}`);
  };
  /** Clears the search and the client filter. */
  const clearFilters = (): void => {
    setText("");
    changeClient(undefined);
  };
  const isFiltering = q !== "" || text.trim() !== "" || clientId !== undefined;
  return { text, setText, q, isFiltering, changeClient, clearFilters };
}
