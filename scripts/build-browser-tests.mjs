import { spawnSync } from "node:child_process";
// Browser regression fixtures must never turn local credentials into hosted writes.
const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"], {
  stdio: "inherit",
  env: { ...process.env, BACKEND_ENABLED: "false", COMMERCE_ENABLED: "false", SEARCH_INDEXING_ENABLED: "false", NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100" },
});
process.exit(result.status ?? 1);
