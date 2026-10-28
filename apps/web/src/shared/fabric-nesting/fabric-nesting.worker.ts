/// <reference lib="webworker" />
/** Web Worker that nests the pieces off the main thread; the only place `@tafsila/nesting` is loaded in the browser (issue #318). */
import { runFabric } from "./fabric-handler";
import type { FabricMessage, FabricRequest } from "./protocol";

/**
 * Posts a message to the page.
 *
 * @param message - Progress or the final answer.
 */
function post(message: FabricMessage): void {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<FabricRequest>): void => {
  post(runFabric(event.data, post));
};
