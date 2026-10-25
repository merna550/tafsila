/** The two filters of the designs list: a title search and a client select. */
import { Input, SearchIcon, Select, type SelectOption } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Value of the "all clients" choice (a select value cannot be empty). */
export const ALL_CLIENTS = "all";

/** Props for {@link DesignsFilters}. */
interface DesignsFiltersProps {
  /** What the user typed in the search. */
  readonly text: string;
  /** Called with every change of the search. */
  readonly onTextChange: (value: string) => void;
  /** Clients to choose from. */
  readonly clients: readonly { readonly id: string; readonly name: string }[];
  /** Chosen client id, or undefined for all. */
  readonly clientId: string | undefined;
  /** Called with the new client id, or undefined for all. */
  readonly onClientChange: (clientId: string | undefined) => void;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the search box and the client select.
 *
 * @param props - Values and handlers.
 * @returns The filters.
 */
export function DesignsFilters(props: Readonly<DesignsFiltersProps>): ReactElement {
  const { text, onTextChange, clients, clientId, onClientChange, dir } = props;
  const t = useTranslations("designs");
  const options: SelectOption[] = [
    { value: ALL_CLIENTS, label: t("clientFilter.all") },
    ...clients.map((client) => ({ value: client.id, label: client.name })),
  ];
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-60 max-w-xl flex-1">
        <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-muted" />
        <Input
          type="search"
          aria-label={t("search.label")}
          placeholder={t("search.placeholder")}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          className="ps-10"
        />
      </div>
      <div className="w-full sm:w-60">
        <label htmlFor="designs-client-filter" className="sr-only">
          {t("clientFilter.label")}
        </label>
        <Select
          id="designs-client-filter"
          options={options}
          value={clientId ?? ALL_CLIENTS}
          onValueChange={(value) => onClientChange(value === ALL_CLIENTS ? undefined : value)}
          dir={dir}
        />
      </div>
    </div>
  );
}
