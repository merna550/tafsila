/** Public entry of the design picker: the two screens, the URL parser and the editor store hook. */
export { CategoryStepScreen } from "./CategoryStepScreen";
export { DesignEditorScreen } from "./DesignEditorScreen";
export { useEditorStore, selectIsDirty, type EditorStore } from "./hooks/use-editor-store";
export { parseEditorQuery, type EditorQuery } from "./model/editor-query";
export { OptionIllustration } from "./illustrations";
export { useDesign } from "./hooks/use-design";
export { FieldChoice } from "./components/FieldChoice";
export { FieldMulti } from "./components/FieldMulti";
export { EditorNotice } from "./components/EditorNotice";
export { seedEditorDraft } from "./hooks/seed-editor-draft";
export { sectionsFor, SECTION_PATHS, type SectionId } from "./model/sections";
export { rawFeatureEdit } from "./model/editor-state";
export { currentChoice, fromCard, pathMessageKey } from "./model/spec-path";
