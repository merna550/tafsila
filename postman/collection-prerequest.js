// Collection-level pre-request script (injected by scripts/gen-postman.mjs).
// Logs in to Supabase with the environment's test account when there is no valid token,
// so every request is authenticated without manual steps.
const exp = Number(pm.environment.get("tokenExpiresAt") || 0);
if (!pm.environment.get("accessToken") || Date.now() > exp - 60_000) {
  pm.sendRequest(
    {
      url: pm.environment.get("supabaseUrl") + "/auth/v1/token?grant_type=password",
      method: "POST",
      header: { "Content-Type": "application/json", apikey: pm.environment.get("supabaseAnonKey") },
      body: {
        mode: "raw",
        raw: JSON.stringify({
          email: pm.environment.get("testEmail"),
          password: pm.environment.get("testPassword"),
        }),
      },
    },
    (err, res) => {
      if (err || res.code !== 200) {
        console.error("Login failed", err || res.text());
        return;
      }
      const j = res.json();
      pm.environment.set("accessToken", j.access_token);
      pm.environment.set("tokenExpiresAt", String(Date.now() + j.expires_in * 1000));
    },
  );
}
