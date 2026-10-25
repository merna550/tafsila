/** Public API of the pattern viewer: the component, the state hook and the contract types. */
export { LayerToggles } from "./components/LayerToggles";
export { PieceList } from "./components/PieceList";
export { PiecePanel } from "./components/PiecePanel";
export { ValidationReport } from "./components/ValidationReport";
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
export { pieceDetails, type PieceDetails } from "./model/piece-details";
export { reportRows, type ReportRow, type ReportRows } from "./model/report-rows";
