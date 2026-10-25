/** Public API of the pattern viewer: the component, the state hook and the contract types. */
export { PatternViewer } from "./components/PatternViewer";
export { DEFAULT_VIEWER_LAYERS, useViewerState, type ViewerController } from "./hooks/use-viewer-state";
export type {
  PatternScene,
  PatternViewerHandle,
  PatternViewerProps,
  ViewerLayers,
  ViewerMeasure,
  ViewerTarget,
} from "./model/types";
