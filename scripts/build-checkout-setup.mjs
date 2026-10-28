import { readFile, writeFile } from "node:fs/promises";
const names = [
  "20261028000300_checkout_and_delivery.sql",
  "20261028000400_purchase_email_recovery.sql",
];
let sql =
  "-- Run ONCE in Supabase SQL Editor after all earlier project migrations.\n-- This is the atomic, combined form of the two checkout migrations.\n-- Do not also run those two migrations manually after this succeeds.\nbegin;\n";
for (const name of names) {
  const source = await readFile(
    new URL(`../supabase/migrations/${name}`, import.meta.url),
    "utf8",
  );
  sql +=
    `\n-- ${name}\n` +
    source.replace(/^begin;\s*$/gm, "").replace(/^commit;\s*$/gm, "") +
    "\n";
}
sql += "commit;\n";
await writeFile(
  new URL("../supabase/checkout_setup.sql", import.meta.url),
  sql,
);
console.log(
  "Prepared supabase/checkout_setup.sql. No database changes were executed.",
);
