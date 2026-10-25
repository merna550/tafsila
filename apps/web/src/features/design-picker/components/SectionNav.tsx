/** The list of sections: a row that scrolls on phones, a side list on wide screens. */
import { CheckIcon } from "@tafsila/ui";
import type { ReactElement } from "react";
import type { SectionId } from "../model/sections";

/** One entry of the navigation. */
export interface SectionNavItem {
  /** Section id. */
  readonly id: SectionId;
  /** Title (already translated). */
  readonly label: string;
  /** True when the tailor changed something in this section. */
  readonly done: boolean;
}

/** Props for {@link SectionNav}. */
interface SectionNavProps {
  /** Accessible name of the navigation. */
  readonly label: string;
  /** The sections this garment uses, in order. */
  readonly items: readonly SectionNavItem[];
  /** The open section. */
  readonly active: SectionId;
  /** Called with the section the tailor picked. */
  readonly onSelect: (id: SectionId) => void;
}

/**
 * Renders the section buttons; the open one carries `aria-current="step"`.
 *
 * @param props - Items, active id and select handler.
 * @returns The navigation.
 */
export function SectionNav({ label, items, active, onSelect }: Readonly<SectionNavProps>): ReactElement {
  return (
    <nav aria-label={label} className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((item) => {
        const current = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={current ? "step" : undefined}
            onClick={() => onSelect(item.id)}
            className={`flex min-h-11 flex-none items-center gap-2 rounded-md px-3 text-start text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              current ? "bg-primary-soft font-semibold text-primary" : "text-text hover:bg-surface-hover"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex size-6 items-center justify-center rounded-full text-sm ${
                item.done ? "bg-primary text-on-primary" : "border border-border"
              }`}
            >
              {item.done ? <CheckIcon className="size-4" /> : null}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
