-- Phase 3: catalog, publishing, administration and Phase 4 data boundaries.
-- Requires the auth and storage schemas provided by Supabase.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table public.admin_profiles (
 id uuid primary key default gen_random_uuid(), auth_user_id uuid not null unique references auth.users(id) on delete restrict,
 role text not null check (role in ('owner','administrator','editor')), display_name text not null check(length(display_name) between 1 and 120),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function private.staff_role() returns text language sql stable security definer set search_path='' as $$
 select role from public.admin_profiles where auth_user_id=(select auth.uid()) and active and (select auth.jwt()->>'aal')='aal2'
$$;
create function private.can_edit() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(private.staff_role() in ('owner','administrator','editor'),false) $$;
create function private.can_manage() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(private.staff_role() in ('owner','administrator'),false) $$;
create function private.is_owner() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(private.staff_role()='owner',false) $$;

create table public.book_series (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), description text not null default '', display_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.media_assets (
 id uuid primary key default gen_random_uuid(), storage_path text not null unique, mime_type text not null check(mime_type='image/jpeg'),
 file_size bigint not null check(file_size between 1 and 10485760), file_checksum text not null check(file_checksum ~ '^[a-f0-9]{64}$'),
 width integer not null check(width>0), height integer not null check(height>0), created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.books (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(length(slug)<=120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check(length(title) between 1 and 200), subtitle text not null default '', short_description text not null default '', full_description text[] not null default '{}',
 genre text not null default '', series_id uuid references public.book_series(id) on delete restrict, series_position integer check(series_position>0),
 cover_asset_id uuid references public.media_assets(id) on delete restrict, cover_path text not null default '' check(cover_path='' or cover_path ~ '^/images/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$'),
 publication_date date, language text not null default 'en', featured boolean not null default false, display_order integer not null default 0,
 status text not null default 'draft' check(status in ('draft','published','archived')), tone text not null default 'sage' check(tone in ('sage','walnut','navy')),
 themes text[] not null default '{}', source_url text not null default '' check(source_url='' or source_url ~ '^https://'),
 seo_title text not null default '', seo_description text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'published' or (length(short_description)>0 and cardinality(full_description)>0 and (cover_asset_id is not null or cover_path<>'')))
);
create index books_public_order on public.books(status,display_order,id);
create table public.book_drafts (
 book_id uuid primary key references public.books(id) on delete cascade, data jsonb not null check(jsonb_typeof(data)='object'), version integer not null default 1,
 updated_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.book_editions (
 id uuid primary key default gen_random_uuid(), book_id uuid not null references public.books(id) on delete restrict,
 format text not null check(format in ('ebook','hardcover','paperback')), isbn text check(isbn is null or isbn ~ '^[0-9Xx-]{10,17}$'),
 currency text check(currency is null or currency ~ '^[A-Z]{3}$'), price_minor integer check(price_minor>=0),
 sale_channel text not null check(sale_channel in ('direct','amazon')), availability text not null default 'pending' check(availability in ('pending','available','unavailable')),
 external_purchase_url text, external_product_identifier text, link_verified boolean not null default false,
 direct_sale_rights_confirmed boolean not null default false, tax_category text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(book_id,format,sale_channel),
 check((sale_channel='direct' and format='ebook' and external_purchase_url is null and external_product_identifier is null and not link_verified) or
       (sale_channel='amazon' and (external_purchase_url is null or external_purchase_url ~ '^https://www\.amazon\.(com|co\.uk|de|co\.za)/dp/[A-Z0-9]{10}$'))),
 check(sale_channel<>'amazon' or availability<>'available' or (link_verified and external_purchase_url is not null and external_product_identifier=substring(external_purchase_url from '/dp/([A-Z0-9]{10})$'))),
 check(sale_channel<>'direct' or availability<>'available' or (price_minor is not null and currency is not null and direct_sale_rights_confirmed))
);
create index editions_book on public.book_editions(book_id);
create table public.digital_assets (
 id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.book_editions(id) on delete restrict,
 storage_path text not null unique, file_format text not null check(file_format in ('pdf','epub')), file_size bigint not null check(file_size between 1 and 26214400),
 file_checksum text not null check(file_checksum ~ '^[a-f0-9]{64}$'), version integer not null check(version>0),
 status text not null default 'pending_review' check(status in ('pending_review','ready','retired')), reviewed_by uuid references auth.users(id),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(edition_id,version)
);
create table public.upload_intents (
 id uuid primary key default gen_random_uuid(), created_by uuid not null references auth.users(id), kind text not null check(kind in ('cover','ebook')),
 edition_id uuid references public.book_editions(id) on delete restrict, storage_path text not null unique,
 file_name text not null check(length(file_name)<=200), expected_size bigint not null check(expected_size between 1 and 26214400),
 status text not null default 'pending' check(status in ('pending','completed','rejected')), expires_at timestamptz not null default (now()+interval '30 minutes'), created_at timestamptz not null default now(),
 check((kind='cover' and edition_id is null) or (kind='ebook' and edition_id is not null))
);

create table public.pages (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug in ('home','about','contact')),
 title text not null, content jsonb not null check(jsonb_typeof(content)='object'), status text not null check(status in ('published','archived')),
 seo_metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.content_drafts (
 id uuid primary key default gen_random_uuid(), page_slug text not null unique check(page_slug in ('home','about','contact')), title text not null,
 content jsonb not null check(jsonb_typeof(content)='object'), version integer not null default 1, updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.journal_posts (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, excerpt text not null default '', content text not null default '',
 featured_image uuid references public.media_assets(id), status text not null default 'draft' check(status in ('draft','published','archived')),
 published_at timestamptz, seo_metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.testimonials (
 id uuid primary key default gen_random_uuid(), book_id uuid references public.books(id), reviewer_name text not null, quote text not null,
 source text not null default '', source_url text, permission_status text not null default 'pending' check(permission_status in ('pending','approved','rejected')),
 display_status text not null default 'hidden' check(display_status in ('hidden','published')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(display_status<>'published' or permission_status='approved')
);
create table public.site_settings (
 key text primary key check(key in ('site_name','contact_email','newsletter_intro')), value text not null default '' check(length(value)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Commerce tables are deliberately not writable by authenticated administrators.
create table public.customers (
 id uuid primary key default gen_random_uuid(), email text not null unique, name text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), public_reference text not null unique, customer_id uuid references public.customers(id), customer_email text not null, customer_name text,
 currency text not null check(currency ~ '^[A-Z]{3}$'), subtotal_minor integer not null check(subtotal_minor>=0), tax_minor integer not null default 0 check(tax_minor>=0), total_minor integer not null check(total_minor=subtotal_minor+tax_minor),
 payment_status text not null default 'pending' check(payment_status in ('pending','payment_processing','paid','payment_failed','canceled','partially_refunded','refunded')),
 fulfillment_status text not null default 'pending' check(fulfillment_status in ('pending','fulfilled','failed','revoked')),
 stripe_checkout_session_id text unique, stripe_payment_intent_id text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
 edition_id uuid not null references public.book_editions(id) on delete restrict, book_title_snapshot text not null, edition_format_snapshot text not null,
 unit_price_minor integer not null check(unit_price_minor>=0), currency text not null, quantity integer not null default 1 check(quantity=1), created_at timestamptz not null default now(), unique(order_id,edition_id)
);
create index orders_created on public.orders(created_at desc);
create index order_items_order on public.order_items(order_id);
create table public.entitlements (
 id uuid primary key default gen_random_uuid(), order_item_id uuid not null unique references public.order_items(id), customer_email text not null,
 edition_id uuid not null references public.book_editions(id), status text not null check(status in ('active','revoked')), granted_at timestamptz not null default now(), revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.download_tokens (
 id uuid primary key default gen_random_uuid(), entitlement_id uuid not null references public.entitlements(id), token_hash text not null unique, expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now()
);
create table public.download_events (
 id uuid primary key default gen_random_uuid(), entitlement_id uuid not null references public.entitlements(id), asset_id uuid not null references public.digital_assets(id), occurred_at timestamptz not null default now(), result text not null, security_metadata jsonb not null default '{}'
);
create table public.payment_events (
 id uuid primary key default gen_random_uuid(), provider text not null, external_event_id text not null, event_type text not null, processed_at timestamptz,
 processing_status text not null default 'pending', created_at timestamptz not null default now(), unique(provider,external_event_id)
);
create table public.subscribers (
 id uuid primary key default gen_random_uuid(), email text not null unique, consent_status text not null check(consent_status in ('pending','confirmed','unsubscribed')),
 consent_timestamp timestamptz, consent_source text, unsubscribe_timestamp timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.contact_messages (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null, category text not null, subject text not null, message text not null,
 status text not null default 'new' check(status in ('new','read','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid, actor_role text, action text not null, table_name text not null, record_id text, changed_fields text[] not null default '{}', occurred_at timestamptz not null default now()
);
create index audit_time on public.audit_logs(occurred_at desc);

create function private.stamp_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare row_data jsonb; changes text[];
begin
 row_data=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 if tg_op='UPDATE' then select array_agg(n.key) into changes from jsonb_each(to_jsonb(new)) n where n.value is distinct from to_jsonb(old)->n.key; end if;
 insert into public.audit_logs(actor_id,actor_role,action,table_name,record_id,changed_fields) values(auth.uid(),private.staff_role(),tg_op,tg_table_name,coalesce(row_data->>'id',row_data->>'book_id',row_data->>'key'),coalesce(changes,'{}'));
 return case when tg_op='DELETE' then old else new end;
end $$;
do $$ declare t text; begin
 foreach t in array array['admin_profiles','book_series','books','book_drafts','book_editions','digital_assets','pages','content_drafts','journal_posts','testimonials','site_settings','customers','orders','subscribers','contact_messages'] loop
 execute format('create trigger stamp_%I before update on public.%I for each row execute function private.stamp_updated_at()',t,t);
 end loop;
 foreach t in array array['admin_profiles','book_series','books','book_drafts','book_editions','digital_assets','media_assets','upload_intents','pages','content_drafts','journal_posts','testimonials','site_settings','customers','orders','order_items','entitlements','download_tokens','payment_events','subscribers','contact_messages'] loop
 execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function private.audit_change()',t,t);
 end loop;
end $$;

create function private.guard_last_owner() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(74293621);
 if old.role='owner' and old.active and (tg_op='DELETE' or new.role<>'owner' or not new.active) and
    not exists(select 1 from public.admin_profiles where role='owner' and active and id<>old.id) then
 raise exception 'The last active owner cannot be removed or demoted'; end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
create trigger guard_last_owner before update or delete on public.admin_profiles for each row execute function private.guard_last_owner();
create function private.guard_direct_ready() returns trigger language plpgsql set search_path='' as $$ begin
 if new.sale_channel='direct' and new.availability='available' and not exists(select 1 from public.digital_assets where edition_id=new.id and status='ready') then raise exception 'A reviewed digital asset is required'; end if; return new;
end $$;
create trigger guard_direct_ready before insert or update on public.book_editions for each row execute function private.guard_direct_ready();

-- Revoke accidental defaults. Explicit grants plus RLS are both required.
revoke all on public.admin_profiles,public.book_series,public.media_assets,public.books,public.book_drafts,public.book_editions,public.digital_assets,public.upload_intents,public.pages,public.content_drafts,public.journal_posts,public.testimonials,public.site_settings,public.customers,public.orders,public.order_items,public.entitlements,public.download_tokens,public.download_events,public.payment_events,public.subscribers,public.contact_messages,public.audit_logs from anon, authenticated;
do $$ declare t text; begin
 foreach t in array array['admin_profiles','book_series','media_assets','books','book_drafts','book_editions','digital_assets','upload_intents','pages','content_drafts','journal_posts','testimonials','site_settings','customers','orders','order_items','entitlements','download_tokens','download_events','payment_events','subscribers','contact_messages','audit_logs'] loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;
grant select on public.books,public.book_editions,public.book_series,public.media_assets,public.pages,public.site_settings,public.journal_posts,public.testimonials to anon,authenticated;
grant select,insert,update,delete on public.admin_profiles,public.books,public.book_drafts,public.book_series,public.book_editions,public.content_drafts,public.pages,public.journal_posts,public.testimonials,public.site_settings,public.upload_intents,public.media_assets,public.digital_assets to authenticated;
grant select on public.customers,public.orders,public.order_items,public.entitlements,public.download_events,public.subscribers,public.contact_messages,public.audit_logs to authenticated;
grant update(status) on public.contact_messages to authenticated;
-- No role gets direct access to download_tokens or payment_events through the Data API.

create policy profile_read on public.admin_profiles for select to authenticated using(auth_user_id=auth.uid() or private.is_owner());
create policy profile_write on public.admin_profiles for all to authenticated using(private.is_owner()) with check(private.is_owner());
create policy books_read on public.books for select using(status='published' or private.can_edit());
create policy books_insert on public.books for insert to authenticated with check(private.can_manage() or (private.can_edit() and status='draft'));
create policy books_update on public.books for update to authenticated using(private.can_manage() or (private.can_edit() and status='draft')) with check(private.can_manage() or (private.can_edit() and status='draft'));
create policy books_delete on public.books for delete to authenticated using(private.can_manage() and status='draft');
create policy series_read on public.book_series for select using(true);
create policy series_write on public.book_series for all to authenticated using(private.can_manage()) with check(private.can_manage());
create policy drafts_staff on public.book_drafts for all to authenticated using(private.can_edit()) with check(private.can_edit());
create policy editions_read on public.book_editions for select using(private.can_manage() or exists(select 1 from public.books b where b.id=book_id and b.status='published'));
create policy editions_write on public.book_editions for all to authenticated using(private.can_manage()) with check(private.can_manage());
create policy media_read on public.media_assets for select using(private.can_edit() or exists(select 1 from public.books b where b.cover_asset_id=public.media_assets.id and b.status='published'));
create policy media_write on public.media_assets for insert to authenticated with check(private.can_edit() and created_by=auth.uid());
create policy digital_read on public.digital_assets for select to authenticated using(private.can_manage());
create policy digital_insert on public.digital_assets for insert to authenticated with check(private.can_manage() and created_by=auth.uid());
create policy digital_update on public.digital_assets for update to authenticated using(private.can_manage()) with check(private.can_manage());
create policy upload_staff on public.upload_intents for all to authenticated using(private.can_edit() and created_by=auth.uid()) with check(created_by=auth.uid() and ((kind='cover' and private.can_edit()) or (kind='ebook' and private.can_manage())));
create policy pages_read on public.pages for select using(status='published' or private.can_edit());
create policy pages_write on public.pages for all to authenticated using(private.can_manage()) with check(private.can_manage());
create policy content_staff on public.content_drafts for all to authenticated using(private.can_edit()) with check(private.can_edit());
create policy journal_read on public.journal_posts for select using(status='published' or private.can_edit());
create policy journal_write on public.journal_posts for all to authenticated using(private.can_manage() or (private.can_edit() and status='draft')) with check(private.can_manage() or (private.can_edit() and status='draft'));
create policy testimonial_read on public.testimonials for select using((display_status='published' and permission_status='approved') or private.can_manage());
create policy testimonial_write on public.testimonials for all to authenticated using(private.can_manage()) with check(private.can_manage());
create policy settings_read on public.site_settings for select using(true);
create policy settings_owner on public.site_settings for all to authenticated using(private.is_owner()) with check(private.is_owner());
do $$ declare t text; begin
 foreach t in array array['customers','orders','order_items','entitlements','download_events','subscribers','contact_messages'] loop
 execute format('create policy read_managers on public.%I for select to authenticated using(private.can_manage())',t);
 end loop;
end $$;
create policy contact_status on public.contact_messages for update to authenticated using(private.can_manage()) with check(private.can_manage());
create policy audit_owner on public.audit_logs for select to authenticated using(private.is_owner());

-- Avoid exposing trigger helpers as RPCs. Policies call only the explicit private helpers.
revoke all on all functions in schema private from public;
grant execute on function private.staff_role(),private.can_edit(),private.can_manage(),private.is_owner() to anon,authenticated;
commit;
