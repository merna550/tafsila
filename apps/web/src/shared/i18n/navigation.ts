/** Locale-aware navigation helpers: use these instead of next/link and next/navigation so the prefix is kept. */
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
