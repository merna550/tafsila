/** Query keys of pattern versions; #252 adds the list and one-version queries on top of these. */

/** Prefix of everything about versions. */
const ALL = ["versions"] as const;

/**
 * Key of the version list of one design.
 *
 * @param designId - Design id.
 * @returns The query key.
 */
function list(designId: string): readonly ["versions", string] {
  return ["versions", designId] as const;
}

/**
 * Key of one version.
 *
 * @param id - Version id.
 * @returns The query key.
 */
function one(id: string): readonly ["version", string] {
  return ["version", id] as const;
}

/** All query keys for versions. A save invalidates `versionKeys.all`. */
export const versionKeys = { all: ALL, list, one };
