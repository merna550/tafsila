// Collection-level test script (injected by scripts/gen-postman.mjs): runs after every request.
pm.test("status is 2xx (unless the request name starts with 'ERR')", () => {
  if (!pm.info.requestName.startsWith("ERR")) pm.expect(pm.response.code).to.be.within(200, 299);
});
pm.test("responds in under 2s", () => pm.expect(pm.response.responseTime).to.be.below(2000));
// Capture ids so later requests in the run can use them ({{designId}}, {{versionId}}, {{clientId}}).
try {
  const j = pm.response.json();
  for (const k of ["clientId", "designId", "versionId"]) if (j && j[k]) pm.environment.set(k, j[k]);
  if (j && j.id && pm.info.requestName.match(/create client/i)) pm.environment.set("clientId", j.id);
  if (j && j.id && pm.info.requestName.match(/create design/i)) pm.environment.set("designId", j.id);
} catch (_) {}
// ERR requests must return the standard error body (docs/errors.md).
if (pm.info.requestName.startsWith("ERR")) {
  pm.test("error body has code, message_ar, message_en, request_id", () => {
    const body = pm.response.json();
    for (const key of ["code", "message_ar", "message_en", "request_id"])
      pm.expect(body[key]).to.be.a("string").that.is.not.empty;
  });
}
