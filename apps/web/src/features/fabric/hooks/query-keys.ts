/** Query keys of the fabric feature. A catalogue change in the admin invalidates `fabricKeys.all`. */

/** Prefix of everything about fabrics. */
const ALL = ["fabric-recommend"] as const;

/**
 * Key of the recommendations of one saved version.
 *
 * @param versionId - Version id.
 * @returns The query key.
 */
function recommend(versionId: string): readonly ["fabric-recommend", string] {
  return ["fabric-recommend", versionId] as const;
}

/**
 * Key of the AI explanation of the recommendations of one saved version in one language. It starts with the
 * recommendation prefix, so a catalogue change that invalidates `all` also drops it.
 *
 * @param versionId - Version id.
 * @param locale - Language of the text.
 * @returns The query key.
 */
function explain(
  versionId: string,
  locale: string,
): readonly ["fabric-recommend", "explain", string, string] {
  return ["fabric-recommend", "explain", versionId, locale] as const;
}

/**
 * Key of the saved fabric calculation of one saved version.
 *
 * @param versionId - Version id.
 * @returns The query key.
 */
function calc(versionId: string): readonly ["fabric-calc", string] {
  return ["fabric-calc", versionId] as const;
}

/** All query keys of the feature. */
export const fabricKeys = { all: ALL, recommend, explain, calc };
