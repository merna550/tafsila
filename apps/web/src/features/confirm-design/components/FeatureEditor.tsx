/** The choice cards of one feature, borrowed from the design picker (FR-DES-05). */
import { specOptions, type FeaturePath } from "@tafsila/engine/spec-rules";
import type { DesignSpec } from "@tafsila/schemas";
import type { ReactElement } from "react";
import { FieldChoice, FieldMulti, currentChoice, fromCard } from "@/features/design-picker";

/** Props for {@link FeatureEditor}. */
interface FeatureEditorProps {
  /** The design. */
  readonly spec: DesignSpec;
  /** The feature to edit. */
  readonly path: FeaturePath;
  /** Sets the feature; pockets get the whole list. */
  readonly onChange: (path: FeaturePath, value: string | boolean | string[]) => void;
}

/**
 * Renders the picker's card group for the feature (a multi-select for pockets).
 *
 * @param props - The design, the feature and the change handler.
 * @returns The cards.
 */
export function FeatureEditor({ spec, path, onChange }: Readonly<FeatureEditorProps>): ReactElement {
  const options = specOptions(spec)[path];
  if (path === "pockets") {
    return (
      <FieldMulti path={path} options={options} value={spec.pockets} onChange={(v) => onChange(path, v)} />
    );
  }
  return (
    <FieldChoice
      path={path}
      options={options}
      value={currentChoice(spec, path)}
      onChoose={(value) => onChange(path, fromCard(value))}
    />
  );
}
