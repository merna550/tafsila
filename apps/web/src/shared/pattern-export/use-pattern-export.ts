"use client";
/** Hook behind the export dialog: runs the export worker, downloads the finished file and keeps it for "Download again" (issue #289). */
import { useCallback, useEffect, useReducer, useRef } from "react";
import { track } from "../analytics";
import { downloadBytes } from "./download";
import {
  createExportClient,
  type ExportClient,
  type ExportJob,
  type ExportWorker,
  type ExportWorkerFactory,
} from "./export-client";
import { exportErrorToApiError } from "./export-error";
import { exportReducer, IDLE_EXPORT_STATE, type ExportFile, type ExportState } from "./export-state";
import { exportFileName } from "./file-name";

/** What the hook returns. */
export interface PatternExport {
  /** Where the export is. */
  readonly state: ExportState;
  /** Builds a file and downloads it when ready; a running build is replaced. */
  readonly start: (job: ExportJob) => void;
  /** Stops a running build. */
  readonly cancel: () => void;
  /** Goes back to the start (after an error, or when the dialog closes); stops a running build. */
  readonly reset: () => void;
  /** Downloads the finished file again. */
  readonly downloadAgain: () => void;
}

/**
 * Creates the real module worker; Next bundles it as its own chunk, so `pdf-lib` loads only there.
 *
 * @returns The worker.
 */
export function createBrowserExportWorker(): ExportWorker {
  return new Worker(new URL("./pattern-export.worker.ts", import.meta.url), {
    type: "module",
  }) as ExportWorker;
}

/**
 * Runs exports in their own worker, which is created on the first `start` and terminated on unmount.
 *
 * @param createWorker - Worker factory, read once; tests pass a fake.
 * @returns The state and its actions.
 */
export function usePatternExport(
  createWorker: ExportWorkerFactory = createBrowserExportWorker,
): PatternExport {
  const [state, dispatch] = useReducer(exportReducer, IDLE_EXPORT_STATE);
  const factory = useRef(createWorker);
  const client = useRef<ExportClient | null>(null);
  const finished = useRef<ExportFile | null>(null);

  useEffect(() => () => client.current?.dispose(), []);

  const start = useCallback((job: ExportJob): void => {
    client.current ??= createExportClient(factory.current);
    dispatch({ type: "start", kind: job.kind });
    void client.current
      .run(job, (progress) => dispatch({ type: "progress", progress }))
      .then((outcome) => {
        if ("stale" in outcome) return;
        if (!outcome.ok) {
          dispatch({ type: "fail", error: exportErrorToApiError(outcome.error) });
          return;
        }
        const fileName = exportFileName({
          title: job.meta.title,
          versionNo: job.meta.versionNo,
          kind: job.kind,
        });
        const file = { fileName, mime: outcome.mime, bytes: outcome.bytes, pageCount: outcome.pageCount };
        finished.current = file;
        downloadBytes(file.bytes, file.fileName, file.mime);
        track("pattern_exported", { kind: job.kind, pages: outcome.pageCount ?? 0 });
        dispatch({ type: "done", file });
      });
  }, []);

  const reset = useCallback((): void => {
    client.current?.cancel();
    finished.current = null;
    dispatch({ type: "reset" });
  }, []);

  const downloadAgain = useCallback((): void => {
    const file = finished.current;
    if (file) downloadBytes(file.bytes, file.fileName, file.mime);
  }, []);

  return { state, start, cancel: reset, reset, downloadAgain };
}
