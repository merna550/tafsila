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

/** All query keys of the feature. */
export const fabricKeys = { all: ALL, recommend };
