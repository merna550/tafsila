/** Search box and verified filter of the users list. */
import { Input, SearchIcon, SegmentedControl } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { VerifiedFilter } from "../hooks/query-keys";

/** Props for {@link AdminUsersToolbar}. */
interface AdminUsersToolbarProps {
  /** What the admin typed. */
  readonly text: string;
  /** Called with every change of the text. */
  readonly onTextChange: (value: string) => void;
  /** The chosen filter. */
  readonly filter: VerifiedFilter;
  /** Called with the new filter. */
  readonly onFilterChange: (value: VerifiedFilter) => void;
}

/**
 * Renders the labelled search input and the three-way filter.
 *
 * @param props - Text, filter and their handlers.
 * @returns The toolbar.
 */
export function AdminUsersToolbar(props: Readonly<AdminUsersToolbarProps>): ReactElement {
  const { text, onTextChange, filter, onFilterChange } = props;
  const t = useTranslations("admin.users");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-64 max-w-md flex-1">
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
      <SegmentedControl
        label={t("filter.label")}
        value={filter}
        onChange={onFilterChange}
        options={[
          { value: "all", label: t("filter.all") },
          { value: "verified", label: t("filter.verified") },
          { value: "unverified", label: t("filter.unverified") },
        ]}
      />
    </div>
  );
}
