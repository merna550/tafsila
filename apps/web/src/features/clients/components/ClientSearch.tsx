/** Search box of the clients list (by name). */
import { Input, SearchIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link ClientSearch}. */
interface ClientSearchProps {
  /** What the user typed. */
  readonly value: string;
  /** Called with every change. */
  readonly onChange: (value: string) => void;
}

/**
 * Renders the labelled search input with a magnifier.
 *
 * @param props - Value and change handler.
 * @returns The search field.
 */
export function ClientSearch({ value, onChange }: Readonly<ClientSearchProps>): ReactElement {
  const t = useTranslations("clients.search");
  return (
    <div className="relative max-w-xl">
      <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-muted" />
      <Input
        type="search"
        aria-label={t("label")}
        placeholder={t("label")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="ps-10"
      />
    </div>
  );
}
