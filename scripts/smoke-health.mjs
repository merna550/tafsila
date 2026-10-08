// Smoke check for a deployed environment (issue #19): GET <url>/api/health until it reports the expected state.
import { pathToFileURL } from "node:url";

const [url, sha, environment] = process.argv.slice(2);

/**
 * Fetches the health endpoint once and compares it with the expected environment and git SHA.
 *
 * @param {string} baseUrl Site URL without a trailing slash.
 * @param {string} expectedSha Git commit that must be running.
 * @param {string} expectedEnvironment APP_ENV that must be reported.
 * @param {typeof fetch} fetchFn Fetch implementation (replaced in tests).
 * @returns {Promise<string | null>} null when healthy, otherwise the reason it is not.
 */
export async function checkHealth(baseUrl, expectedSha, expectedEnvironment, fetchFn = fetch) {
  let res;
  try {
    res = await fetchFn(`${baseUrl}/api/health`);
  } catch (error) {
    return `request failed: ${error.message}`;
  }
  if (res.status !== 200) return `HTTP ${res.status}`;
  const body = await res.json().catch(() => ({}));
  if (body.status !== "ok") return `status is ${body.status}`;
  if (body.environment !== expectedEnvironment) return `environment is ${body.environment}`;
  if (body.gitSha !== expectedSha) return `gitSha is ${body.gitSha}`;
  return null;
}

/**
 * Retries checkHealth until it passes or the attempts run out.
 *
 * @param {object} options Check arguments plus `attempts`, `delayMs` and an injectable `fetchFn`.
 * @returns {Promise<string | null>} null on success, otherwise the last failure reason.
 */
export async function waitForHealth({
  url,
  sha,
  environment,
  attempts = 12,
  delayMs = 10_000,
  fetchFn = fetch,
}) {
  let reason = "no attempt made";
  for (let i = 0; i < attempts; i++) {
    reason = await checkHealth(url, sha, environment, fetchFn);
    if (reason === null) return null;
    if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return reason;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!url || !sha || !environment) {
    console.error("usage: node scripts/smoke-health.mjs <url> <git-sha> <environment>");
    process.exit(2);
  }
  const reason = await waitForHealth({ url, sha, environment });
  if (reason) {
    console.error(`Smoke check failed: ${reason}`);
    process.exit(1);
  }
  console.log(`Smoke check passed: ${url} runs ${environment} at ${sha}`);
}
