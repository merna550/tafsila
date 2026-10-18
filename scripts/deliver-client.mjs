// GitHub clients of `/deliver` (issue #185): the real `gh api` client, an in-memory fake and a dry-run wrapper.
import { execFileSync } from "node:child_process";

/**
 * Builds an error carrying an HTTP status.
 *
 * @param {number} status HTTP status.
 * @param {string} message Error text.
 * @returns {Error} Error with `status`.
 */
export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

/**
 * Runs a command and returns its output.
 *
 * @param {string} file Executable.
 * @param {string[]} args Arguments.
 * @param {string} [input] Standard input.
 * @returns {string} Standard output.
 */

export const run = (file, args, input) =>
  execFileSync(file, args, { encoding: "utf8", input, maxBuffer: 1 << 28 });

/**
 * Creates the real client: `gh api` (REST only) plus `scripts/gh-ac.sh` for criteria.
 *
 * @param {string} repo `owner/name`.
 * @returns {object} Client with `repo`, `get`, `write`, `log`, `criteria`.
 */
export function createRestClient(repo) {
  const call = (args, input) => {
    try {
      return run("gh", args, input);
    } catch (error) {
      const status = /HTTP (\d{3})/.exec(String(error.stderr ?? error.message))?.[1];
      throw httpError(Number(status ?? 0), String(error.stderr ?? error.message).trim());
    }
  };
  return {
    repo,
    get: (path) => JSON.parse(call(["api", path])),
    write: (method, path, body) => {
      const out = call(["api", "-X", method, path, "--input", "-"], JSON.stringify(body ?? {}));
      return out.trim() ? JSON.parse(out) : {};
    },
    log: (jobId) => call(["api", `repos/${repo}/actions/jobs/${jobId}/logs`, "--allow-escape-sequences"]),
    criteria: (number) => {
      const out = run("scripts/gh-ac.sh", ["progress", String(number)]);
      const m = /(\d{1,5})\/(\d{1,5})/.exec(out);
      return m ? { met: Number(m[1]), total: Number(m[2]) } : { met: 0, total: 0 };
    },
  };
}

/**
 * Creates an in-memory client for tests and `--fixture`; it records every write.
 *
 * @param {{routes: object, writeErrors?: object, writeResponses?: object, logs?: object, criteria?: object}} state Fixture.
 * @returns {object} Client with a `writes` array.
 */
export function createFakeClient(state) {
  const writes = [];
  return {
    repo: "o/r",
    writes,
    get: (path) => {
      if (!(path in state.routes)) throw httpError(404, `no fixture route: ${path}`);
      return structuredClone(state.routes[path]);
    },
    write: (method, path, body) => {
      writes.push({ method, path, body });
      const key = `${method} ${path}`;
      if (state.writeErrors?.[key]) throw httpError(state.writeErrors[key], key);
      return structuredClone(state.writeResponses?.[key] ?? {});
    },
    log: (jobId) => state.logs?.[jobId] ?? "",
    criteria: () => state.criteria ?? { met: 1, total: 1 },
  };
}

/**
 * Wraps a client so that writes are only printed as `would: ...` lines.
 *
 * @param {object} client Real or fake client.
 * @param {(line: string) => void} print Output sink.
 * @returns {object} Client that never writes.
 */
export function dryRunClient(client, print) {
  return {
    ...client,
    write: (method, path, body) => {
      print(`would: ${method} ${path} ${JSON.stringify(body ?? {})}`);
      return { merged: true, sha: "dry-run" };
    },
  };
}

/**
 * Builds a repository path.
 *
 * @param {object} client Client.
 * @param {string} rest Path after `repos/<repo>/`.
 * @returns {string} REST path.
 */
export const rp = (client, rest) => `repos/${client.repo}/${rest}`;
