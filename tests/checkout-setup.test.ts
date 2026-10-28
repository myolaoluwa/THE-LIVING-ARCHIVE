import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("the single-copy checkout setup runs atomically after the installed schema", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;
  create schema auth;create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
  create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
  grant usage on schema auth to anon,authenticated;
  create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,unique(bucket_id,name));
  alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;
  grant select,insert,update,delete on storage.objects to anon,authenticated;`);
    for (const file of (await readdir("supabase/migrations"))
      .filter((file) => file.endsWith(".sql") && file < "20261028000300")
      .sort())
      await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    const setup = await readFile("supabase/checkout_setup.sql", "utf8");
    const interrupted = setup.replace(
      /commit;\s*$/,
      () =>
        "do $$ begin raise exception 'Injected setup interruption'; end $$;\ncommit;",
    );
    await assert.rejects(db.exec(interrupted), /Injected setup interruption/);
    await db.exec("rollback");
    assert.equal(
      (
        await db.query<{ table_name: string | null }>(
          "select to_regclass('public.checkout_attempts')::text as table_name",
        )
      ).rows[0].table_name,
      null,
    );
    await db.exec(setup);
    await db.exec("set role service_role");
    assert.deepEqual(
      (
        await db.query<{ books: unknown[] }>(
          "select public.commerce_catalog() as books",
        )
      ).rows[0].books,
      [],
    );
    await db.exec("reset role;set role anon");
    await assert.rejects(
      db.exec("select public.commerce_catalog()"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
