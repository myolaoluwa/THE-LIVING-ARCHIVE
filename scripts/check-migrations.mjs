import { readdir } from "node:fs/promises";
const files = (
  await readdir(new URL("../supabase/migrations/", import.meta.url))
).filter((f) => f.endsWith(".sql"));
for (const file of files) {
  if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(file))
    throw new Error(`Invalid migration filename: ${file}`);
}
console.log(
  `Migration filenames valid: ${files.length} versioned migrations. Run npm run test:db for PostgreSQL execution and RLS tests.`,
);
