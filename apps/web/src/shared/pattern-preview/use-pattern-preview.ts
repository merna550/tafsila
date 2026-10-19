"use client";
/** Hook that drafts the pattern in a Web Worker while the user edits, without freezing the page (FR-PAT-04, issue #239). */
import { useEffect, useRef, useState } from "react";
import { createPreviewClient, type PreviewWorker, type PreviewWorkerFactory } from "./preview-client";
import {
  createPreviewController,
  IDLE_PREVIEW_STATE,
  type PreviewController,
  type PreviewState,
} from "./preview-controller";
import type { PreviewInput } from "./protocol";

/**
 * Creates the real module worker; Next bundles it as its own chunk, so the engine geometry loads only there.
 *
 * @returns The worker.
 */
export function createBrowserPreviewWorker(): PreviewWorker {
  return new Worker(new URL("./pattern-preview.worker.ts", import.meta.url), {
    type: "module",
  }) as PreviewWorker;
}

/**
 * Drafts the pattern for `input` after the user stops changing it. The last input wins; older answers are dropped.
 * The worker lives as long as the component and is terminated on unmount.
 *
 * @param input - Design, measurements and options, or `null` while the form is incomplete. Memoise it: a new object
 *   restarts the debounce.
 * @param createWorker - Worker factory, read once at mount; tests pass a fake.
 * @returns The state: status, latest result, error, time and input hash.
 */
export function usePatternPreview(
  input: PreviewInput | null,
  createWorker: PreviewWorkerFactory = createBrowserPreviewWorker,
): PreviewState {
  const [state, setState] = useState<PreviewState>(IDLE_PREVIEW_STATE);
  const controller = useRef<PreviewController | null>(null);
  // Read once at mount: the factory must not restart the worker when a caller passes a new function each render.
  const factory = useRef(createWorker);

  useEffect(() => {
    const client = createPreviewClient(factory.current);
    const created = createPreviewController(client, setState);
    controller.current = created;
    return () => {
      created.dispose();
      client.dispose();
      controller.current = null;
    };
  }, []);

  useEffect(() => {
    controller.current?.submit(input);
  }, [input]);

  return state;
}
