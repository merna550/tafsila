/** Reads the editor's URL parameters (`?clientId=` and `?section=`) and builds them back. */
import { z } from "zod";
import { isSectionId, type SectionId } from "./sections";

/** The parsed parameters. */
export interface EditorQuery {
  /** The client the design is for, when the URL names a valid one. */
  readonly clientId?: string;
  /** The open section, when the URL names a known one. */
  readonly section?: SectionId;
}

/**
 * Takes the first value of a search param.
 *
 * @param value - One value or a list.
 * @returns The first value.
 */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parses raw search params; anything invalid is dropped.
 *
 * @param raw - Values as Next gives them.
 * @returns The valid parameters.
 */
export function parseEditorQuery(raw: Readonly<Record<string, string | string[] | undefined>>): EditorQuery {
  const clientId = z.uuid().safeParse(first(raw.clientId));
  const section = first(raw.section);
  return {
    ...(clientId.success ? { clientId: clientId.data } : {}),
    ...(isSectionId(section) ? { section } : {}),
  };
}

/**
 * Builds the editor URL for a design.
 *
 * @param designId - The design.
 * @param query - Parameters to keep.
 * @returns A path such as `/designs/<id>?clientId=<id>&section=sleeve`.
 */
export function editorHref(designId: string, query: EditorQuery): string {
  const params = new URLSearchParams();
  if (query.clientId !== undefined) params.set("clientId", query.clientId);
  if (query.section !== undefined) params.set("section", query.section);
  const qs = params.toString();
  return qs === "" ? `/designs/${designId}` : `/designs/${designId}?${qs}`;
}
