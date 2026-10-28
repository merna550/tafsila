/** Public entry of the fabric nesting worker module: the hook, its state types and the pure helpers. The worker file is never exported. */
export { useFabricNesting, type FabricNesting } from "./use-fabric-nesting";
export type { FabricState } from "./fabric-state";
export type { FabricJob } from "./fabric-client";
export type {
  DoesNotFit,
  FabricAnswer,
  FabricDoesNotFit,
  FabricKindView,
  FabricKind,
  FabricProgress,
  FabricStage,
  MarkerPiece,
  MarkerScene,
  StoredPlacement,
} from "./protocol";
export { fabricErrorToApiError } from "./fabric-error";
