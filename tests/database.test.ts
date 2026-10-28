import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import {
  catalogBook,
  rowSchema,
  editionRow,
} from "../src/lib/database/public-records";
import { z } from "zod";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { BookEditions } from "../src/components/book-editions";
const db = new PGlite();
const identities = {
  owner: "aaaaaaaa-0000-4000-8000-000000000001",
  administrator: "aaaaaaaa-0000-4000-8000-000000000002",
  editor: "aaaaaaaa-0000-4000-8000-000000000003",
  outsider: "aaaaaaaa-0000-4000-8000-000000000004",
};
async function actor(role: keyof typeof identities | "anon", aal = "aal1") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify(
      role === "anon"
        ? {}
        : { sub: identities[role], aal, role: "authenticated" },
    ),
  ]);
  await db.exec(`set role ${role === "anon" ? "anon" : "authenticated"}`);
}
async function count(table: string) {
  return Number(
    (await db.query<{ count: string }>(`select count(*) from public.${table}`))
      .rows[0].count,
  );
}
before(async () => {
  // Test fixtures supply only the Supabase-owned schemas and signed-claim context.
  // Migrations and RLS execute in the actual PostgreSQL engine, not a mocked query API.
  await db.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 grant usage on schema auth to anon,authenticated; grant execute on all functions in schema auth to anon,authenticated;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,unique(bucket_id,name));
 alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated;
 grant select,insert,update,delete on storage.objects to anon,authenticated;`);
  const files = (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files)
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  // The manual catalog reconciliation is safe to repeat without duplicating books.
  await db.exec(await readFile("supabase/migrations/20261028000100_current_catalog.sql", "utf8"));
  for (const [role, id] of Object.entries(identities)) {
    await db.query("insert into auth.users(id) values($1)", [id]);
    if (role !== "outsider")
      await db.query(
        "insert into public.admin_profiles(auth_user_id,role,display_name) values($1,$2,$2)",
        [id, role],
      );
  }
});
after(async () => {
  await db.close();
});
test("migrations create the verified collection and no commercial fiction", async () => {
  await actor("anon");
  assert.equal(await count("books"), 4);
  const synced = (await db.query<{slug:string;price_minor:number;currency:string;availability:string;direct_sale_rights_confirmed:boolean}>(
    "select b.slug,e.price_minor,e.currency,e.availability,e.direct_sale_rights_confirmed from public.books b join public.book_editions e on e.book_id=b.id where e.sale_channel='direct' order by b.display_order",
  )).rows;
  assert.deepEqual(synced.map((row) => row.price_minor), [777,999,693,0]);
  assert.ok(synced.every((row) => row.currency === "USD" && row.availability === "pending" && !row.direct_sale_rights_confirmed));
  const paperbacks = (await db.query<{external_product_identifier:string}>("select external_product_identifier from public.book_editions where format='paperback' order by external_product_identifier")).rows;
  assert.deepEqual(paperbacks.map((row) => row.external_product_identifier), ["B0CYVNQJ4M","B0FQP4FZ58","B0H4CRDM47"]);
  await actor("owner");
  assert.equal(await count("orders"), 0);
  assert.equal(await count("customers"), 0);
  assert.equal(await count("subscribers"), 0);
});
test("anonymous and authenticated nonstaff cannot read private records or write content", async () => {
  for (const role of ["anon", "outsider"] as const) {
    await actor(role);
    await assert.rejects(
      db.exec(
        "insert into public.books(slug,title) values('forbidden','Forbidden')",
      ),
    );
    for (const table of [
      "orders",
      "book_drafts",
      "digital_assets",
      "audit_logs",
    ]) {
      try {
        assert.equal(await count(table), 0);
      } catch (error) {
        if (error instanceof assert.AssertionError) throw error;
      }
    }
    await assert.rejects(
      db.exec(
        'select public.save_book_draft(null,\'{"slug":"forbidden","title":"Forbidden"}\',0)',
      ),
    );
  }
});
test("password-authenticated owners can manage content without MFA", async () => {
  for (const aal of ["aal1", "aal2"]) {
    await actor("owner", aal);
    assert.equal((await db.query<{role:string}>("select private.staff_role() as role")).rows[0].role, "owner");
    await db.exec("insert into public.books(slug,title) values('password-access-check','Password access check')");
    await db.exec("delete from public.books where slug='password-access-check'");
  }
});
test("inactive staff and invalid assurance claims do not grant administrator access", async () => {
  await db.exec("reset role");
  await db.exec("update public.admin_profiles set active=false where role='editor'");
  await actor("editor");
  assert.equal((await db.query<{role:string|null}>("select private.staff_role() as role")).rows[0].role, null);
  await assert.rejects(db.exec("insert into public.books(slug,title) values('inactive-access','Denied')"));
  await db.exec("reset role");
  await db.exec("update public.admin_profiles set active=true where role='editor'");
  await actor("owner", "invalid");
  assert.equal((await db.query<{role:string|null}>("select private.staff_role() as role")).rows[0].role, null);
  await assert.rejects(db.exec("insert into public.books(slug,title) values('invalid-access','Denied')"));
});
let newBookId: string;
let draftData: Record<string, unknown>;
test("editor can save a real draft but cannot publish or change prices", async () => {
  await actor("editor");
  const seed = (
    await db.query<{ data: Record<string, unknown> }>(
      "select data from public.book_drafts limit 1",
    )
  ).rows[0].data;
  draftData = { ...seed, slug: "policy-test-book", title: "Policy test book" };
  newBookId = (
    await db.query<{ id: string }>(
      "select public.save_book_draft(null,$1::jsonb,0) as id",
      [JSON.stringify(draftData)],
    )
  ).rows[0].id;
  await assert.rejects(
    db.query("select public.publish_book($1,1)", [newBookId]),
  );
  await assert.rejects(
    db
      .exec(
        "update public.books set title='Illegal live edit' where status='published' returning id",
      )
      .then((results) => {
        if (results[0]?.affectedRows === 0)
          throw new Error("RLS denied update");
      }),
  );
  await assert.rejects(
    db.query(
      "insert into public.book_editions(book_id,format,sale_channel) values($1,'ebook','direct')",
      [newBookId],
    ),
  );
  await actor("anon");
  assert.equal(
    (await db.query("select id from public.books where id=$1", [newBookId]))
      .rows.length,
    0,
  );
});
test("administrator publishes atomically, changes persist, stale drafts cannot overwrite", async () => {
  await actor("administrator");
  await db.query("select public.publish_book($1,1)", [newBookId]);
  await actor("anon");
  assert.equal(
    (
      await db.query<{ title: string }>(
        "select title from public.books where id=$1",
        [newBookId],
      )
    ).rows[0].title,
    "Policy test book",
  );
  await actor("editor");
  await db.query("select public.save_book_draft($1,$2::jsonb,1)", [
    newBookId,
    JSON.stringify({ ...draftData, title: "Revised draft" }),
  ]);
  await assert.rejects(
    db.query("select public.save_book_draft($1,$2::jsonb,1)", [
      newBookId,
      JSON.stringify(draftData),
    ]),
  );
  await actor("anon");
  assert.equal(
    (
      await db.query<{ title: string }>(
        "select title from public.books where id=$1",
        [newBookId],
      )
    ).rows[0].title,
    "Policy test book",
  );
  await actor("administrator");
  await db.query("select public.publish_book($1,2)", [newBookId]);
  await actor("anon");
  assert.equal(
    (
      await db.query<{ title: string }>(
        "select title from public.books where id=$1",
        [newBookId],
      )
    ).rows[0].title,
    "Revised draft",
  );
  await actor("administrator");
  await db.query("select public.set_book_status($1,'draft')", [newBookId]);
  await actor("anon");
  assert.equal(
    (await db.query("select id from public.books where id=$1", [newBookId]))
      .rows.length,
    0,
  );
});
test("draft page edits remain private until an administrator publishes", async () => {
  await actor("editor");
  const row = (
    await db.query<{ content: Record<string, unknown>; version: number }>(
      "select content,version from public.content_drafts where page_slug='home'",
    )
  ).rows[0];
  await db.query(
    "select public.save_content_draft('home','Homepage',$1::jsonb,$2)",
    [
      JSON.stringify({ ...row.content, hero_first: "Changed draft" }),
      row.version,
    ],
  );
  await assert.rejects(
    db.query("select public.publish_content('home',$1)", [row.version + 1]),
  );
  await actor("anon");
  assert.equal(
    (
      await db.query<{ content: { hero_first: string } }>(
        "select content from public.pages where slug='home'",
      )
    ).rows[0].content.hero_first,
    "History",
  );
  await actor("administrator");
  await db.query("select public.publish_content('home',$1)", [row.version + 1]);
  await actor("anon");
  assert.equal(
    (
      await db.query<{ content: { hero_first: string } }>(
        "select content from public.pages where slug='home'",
      )
    ).rows[0].content.hero_first,
    "Changed draft",
  );
});
test("owner-only settings and role management, last owner cannot be removed", async () => {
  await actor("administrator");
  await assert.rejects(
    db.exec(
      "insert into public.site_settings(key,value) values('site_name','Tampered') on conflict(key) do update set value=excluded.value",
    ),
  );
  const updated = await db.exec(
    "update public.admin_profiles set role='owner' where auth_user_id='aaaaaaaa-0000-4000-8000-000000000002'",
  );
  assert.equal(updated[0].affectedRows, 0);
  await actor("owner");
  await assert.rejects(
    db.exec(
      "update public.admin_profiles set role='editor' where role='owner'",
    ),
  );
  await assert.rejects(
    db.exec(
      "insert into public.site_settings(key,value) values('stripe_secret_key','must-never-store')",
    ),
  );
});
test("commercial records, entitlements and audit logs are immutable through admin sessions", async () => {
  await actor("owner");
  await assert.rejects(
    db.exec(
      "insert into public.orders(public_reference,customer_email,currency,subtotal_minor,total_minor,payment_status) values('fake','fake@example.test','USD',100,100,'paid')",
    ),
  );
  await assert.rejects(
    db.exec(
      "insert into public.audit_logs(action,table_name) values('FORGED','orders')",
    ),
  );
  assert.ok((await count("audit_logs")) > 0);
  await actor("administrator");
  assert.equal(await count("audit_logs"), 0);
});
test("storage rejects anonymous and editor ebook access; versions cannot be overwritten", async () => {
  await actor("anon");
  assert.equal(
    (await db.query("select * from storage.objects")).rows.length,
    0,
  );
  await assert.rejects(
    db.exec(
      "insert into storage.objects(bucket_id,name) values('private-ebooks','test.pdf')",
    ),
  );
  await actor("editor");
  await assert.rejects(
    db.exec(
      "insert into storage.objects(bucket_id,name) values('private-ebooks','aaaaaaaa-0000-4000-8000-000000000003/file.pdf')",
    ),
  );
  await actor("owner");
  await db.exec(
    "insert into storage.objects(bucket_id,name) values('private-ebooks','aaaaaaaa-0000-4000-8000-000000000001/file.pdf')",
  );
  assert.equal(
    (await db.exec("update storage.objects set name='replaced.pdf'"))[0]
      .affectedRows,
    0,
  );
  await actor("anon");
  assert.equal(
    (await db.query("select * from storage.objects")).rows.length,
    0,
  );
});
test("unverified external links and unready direct editions cannot become available", async () => {
  await actor("administrator");
  await assert.rejects(
    db.exec(
      "update public.book_editions set availability='available' where format='hardcover'",
    ),
  );
  await assert.rejects(
    db.exec(
      "update public.book_editions set price_minor=100,currency='USD',direct_sale_rights_confirmed=true,availability='available' where sale_channel='direct'",
    ),
  );
  await assert.rejects(
    db.exec(
      "update public.book_editions set external_purchase_url='https://attacker.example/dp/B0FNX7L165' where sale_channel='amazon'",
    ),
  );
});
test("draft covers remain private and become readable only with a published book", async () => {
  await actor("editor");
  const path = `${identities.editor}/policy-cover/cover.jpg`;
  await db.query(
    "insert into storage.objects(bucket_id,name) values('book-covers',$1)",
    [path],
  );
  const cover = (
    await db.query<{ id: string }>(
      "insert into public.media_assets(storage_path,mime_type,file_size,file_checksum,width,height,created_by) values($1,'image/jpeg',100,$2,300,400,$3) returning id",
      [path, "a".repeat(64), identities.editor],
    )
  ).rows[0].id;
  await actor("anon");
  assert.equal(
    (await db.query("select id from public.media_assets where id=$1", [cover]))
      .rows.length,
    0,
  );
  assert.equal(
    (await db.query("select id from storage.objects where name=$1", [path]))
      .rows.length,
    0,
  );
  await actor("administrator");
  await db.query(
    "update public.books set cover_asset_id=$1,status='published' where id=$2",
    [cover, newBookId],
  );
  await actor("anon");
  assert.equal(
    (await db.query("select id from public.media_assets where id=$1", [cover]))
      .rows.length,
    1,
  );
  assert.equal(
    (await db.query("select id from storage.objects where name=$1", [path]))
      .rows.length,
    1,
  );
  await actor("administrator");
  await db.query("select public.set_book_status($1,'draft')", [newBookId]);
  await actor("anon");
  assert.equal(
    (await db.query("select id from storage.objects where name=$1", [path]))
      .rows.length,
    0,
  );
});
test("private asset versions cannot be repointed, overwritten or removed by administrative sessions", async () => {
  await actor("owner");
  const path = `${identities.owner}/file.pdf`;
  const edition = (
    await db.query<{ id: string }>(
      "select id from public.book_editions where book_id='20000000-0000-4000-8000-000000000001' and sale_channel='direct'",
    )
  ).rows[0].id;
  const asset = (
    await db.query<{ id: string }>(
      "insert into public.digital_assets(edition_id,storage_path,file_format,file_size,file_checksum,version,created_by) values($1,$2,'pdf',100,$3,1,$4) returning id",
      [edition, path, "b".repeat(64), identities.owner],
    )
  ).rows[0].id;
  await assert.rejects(
    db.query(
      "update public.digital_assets set storage_path='repointed.pdf' where id=$1",
      [asset],
    ),
  );
  assert.equal(
    (
      await db.query("delete from storage.objects where name=$1 returning id", [
        path,
      ])
    ).rows.length,
    0,
  );
  await db.query(
    "update public.digital_assets set status='ready',reviewed_by=$2 where id=$1",
    [asset, identities.owner],
  );
  await db.query(
    "update public.book_editions set price_minor=100,currency='EUR',direct_sale_rights_confirmed=true,availability='available' where id=$1",
    [edition],
  );
  await actor("editor");
  assert.equal(
    (
      await db.query("select id from public.digital_assets where id=$1", [
        asset,
      ])
    ).rows.length,
    0,
  );
});
test("real published PostgreSQL records render the confirmed catalog and keep checkout disabled", async () => {
  await actor("anon");
  const rows = z
    .array(rowSchema)
    .parse(
      (await db.query("select * from public.books order by display_order"))
        .rows,
    );
  const editions = z
    .array(editionRow)
    .parse((await db.query("select * from public.book_editions")).rows);
  assert.equal(rows.length, 4);
  for (const [index, row] of rows.entries()) {
    const book = catalogBook(
      row,
      editions,
      String(index + 1).padStart(2, "0"),
      row.series_id ? "4Daniel" : undefined,
    );
    assert.equal(book.title, row.title);
    if (row.slug === "4daniel-book-three") {
      assert.equal(book.series, "4Daniel · Book Three");
      assert.equal(book.kindleUnlimited, true);
      assert.deepEqual(book.ebookPrice, { amountMinor: 0, currency: "USD" });
    } else {
      assert.ok(book.amazonPaperback?.startsWith("https://www.amazon.com/dp/"));
    }
    assert.ok(book.cover.startsWith("/images/"));
    const markup = renderToStaticMarkup(createElement(BookEditions, { book }));
    assert.ok(markup.includes(book.amazonEbook));
    assert.ok(markup.includes("Buy ebook directly"));
    assert.ok(markup.includes('disabled=""'));
    assert.equal(
      markup.includes("Buy hardcover on Amazon"),
      row.slug === "the-bile-of-the-river",
    );
    assert.ok(!markup.includes("/checkout"));
  }
});

test("draft deletion cascades safely while published books resist deletion", async () => {
  await actor("administrator");
  const { rows } = await db.query<{ id: string }>(
    "select public.save_book_draft(null,$1::jsonb,0) as id",
    [
      JSON.stringify({
        ...draftData,
        slug: "disposable-draft",
        title: "Disposable draft",
      }),
    ],
  );
  const id = rows[0].id;
  await actor("editor");
  const denied = await db.query(
    "delete from public.books where id=$1 returning id",
    [id],
  );
  assert.equal(denied.rows.length, 0);
  await actor("administrator");
  const removed = await db.query(
    "delete from public.books where id=$1 returning id",
    [id],
  );
  assert.equal(removed.rows.length, 1);
  assert.equal(
    (
      await db.query(
        "select book_id from public.book_drafts where book_id=$1",
        [id],
      )
    ).rows.length,
    0,
  );
  const published = await db.query(
    "delete from public.books where id='20000000-0000-4000-8000-000000000001' returning id",
  );
  assert.equal(published.rows.length, 0);
});

test("populated operational records remain private and revoked staff lose access", async () => {
  // Ephemeral fixtures in the in-memory test database only, never migration seed data.
  await db.exec("reset role");
  await db.exec(`insert into public.customers(email,name) values('fixture@example.test','Isolation fixture');
    insert into public.orders(public_reference,customer_email,currency,subtotal_minor,total_minor) values('ISOLATION-TEST','fixture@example.test','USD',100,100);
    insert into public.subscribers(email,consent_status) values('fixture@example.test','pending');
    insert into public.contact_messages(name,email,category,subject,message) values('Isolation fixture','fixture@example.test','general','Isolation test','In-memory test fixture only.');`);
  for (const role of ["editor", "outsider"] as const) {
    await actor(role);
    for (const table of [
      "orders",
      "customers",
      "subscribers",
      "contact_messages",
    ])
      assert.equal(await count(table), 0);
  }
  await actor("anon");
  await assert.rejects(
    db.exec("select * from public.orders"),
    /permission denied/,
  );
  await actor("administrator");
  for (const table of [
    "orders",
    "customers",
    "subscribers",
    "contact_messages",
  ])
    assert.equal(await count(table), 1);
  await actor("owner");
  await db.query(
    "update public.admin_profiles set active=false where auth_user_id=$1",
    [identities.administrator],
  );
  await actor("administrator");
  assert.equal(await count("orders"), 0);
  await assert.rejects(
    db.exec("select public.admin_metrics()"),
    /Permission denied/,
  );
  await actor("owner");
  await db.query(
    "update public.admin_profiles set active=true where auth_user_id=$1",
    [identities.administrator],
  );
});
