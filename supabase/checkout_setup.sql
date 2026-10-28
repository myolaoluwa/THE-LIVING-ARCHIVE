-- Run ONCE in Supabase SQL Editor after all earlier project migrations.
-- This is the atomic, combined form of the two checkout migrations.
-- Do not also run those two migrations manually after this succeeds.
begin;

-- 20261028000300_checkout_and_delivery.sql
-- Stripe Checkout and private delivery. Only the trusted service role may call
-- commerce RPCs; browser users never receive commerce table privileges.

alter table public.orders add column stripe_livemode boolean not null default false;
alter table public.orders add column commerce_revoked boolean not null default false;
alter table public.order_items add column digital_asset_id uuid references public.digital_assets(id) on delete restrict;
create table public.checkout_attempts (
 id uuid primary key references public.orders(id) on delete restrict,
 access_hash text not null check(access_hash ~ '^[a-f0-9]{64}$'),
 slugs text[] not null, session_url text, terms_version text not null default '2026-10-28', terms_accepted_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '1 hour'),
 access_expires_at timestamptz not null default (now()+interval '7 days'),
 created_at timestamptz not null default now()
);
create table public.commerce_rate_limits (
 key text not null, window_start bigint not null, hits integer not null default 1, created_at timestamptz not null default now(),
 primary key(key,window_start)
);
alter table public.checkout_attempts enable row level security;
alter table public.commerce_rate_limits enable row level security;
revoke all on public.checkout_attempts,public.commerce_rate_limits from public,anon,authenticated;
grant select,insert,update,delete on public.checkout_attempts,public.commerce_rate_limits to service_role;
-- The service client is isolated from all user sessions and runs server-side only.
grant select on public.books,public.book_editions,public.digital_assets,public.order_items,public.orders to service_role;

create function public.commerce_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer; w bigint;
begin
 if p_key !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 1000 or p_seconds not between 60 and 3600 then raise exception 'Invalid limit'; end if;
 w=floor(extract(epoch from now())/p_seconds)::bigint;
 insert into public.commerce_rate_limits(key,window_start) values(p_key,w)
 on conflict(key,window_start) do update set hits=public.commerce_rate_limits.hits+1 returning hits into n;
 return n<=p_limit;
end $$;

create function public.commerce_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
 'slug',b.slug,'title',case when b.title='4Daniel' then b.subtitle else b.title end,
 'price_minor',e.price_minor,'currency',e.currency) order by b.display_order,b.id),'[]'::jsonb)
 from public.books b join public.book_editions e on e.book_id=b.id
 where b.status='published' and not b.kindle_unlimited and e.format='ebook' and e.sale_channel='direct'
 and e.availability='available' and e.direct_sale_rights_confirmed and e.price_minor>0
 and e.currency in ('USD','EUR','GBP','ZAR')
 and exists(select 1 from public.digital_assets a join storage.objects s on s.name=a.storage_path and s.bucket_id='private-ebooks'
   where a.edition_id=e.id and a.status='ready' and a.reviewed_by is not null)
$$;

create function public.commerce_begin_checkout(p_id uuid,p_hash text,p_slugs text[],p_email text,p_live boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.checkout_attempts%rowtype; o public.orders%rowtype; r record;
 asset_key uuid; amount integer:=0; curr text; found_count integer:=0; ref text;
begin
 if p_hash !~ '^[a-f0-9]{64}$' or cardinality(p_slugs) not between 1 and 4
 or cardinality(p_slugs)<>(select count(distinct s) from unnest(p_slugs) s)
 or length(p_email)>254 or p_email<>lower(p_email) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid checkout'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into a from public.checkout_attempts where id=p_id;
 if a.id is not null then
  select * into o from public.orders where id=p_id;
  if a.access_hash<>p_hash or a.slugs<>p_slugs or o.customer_email<>p_email or o.stripe_livemode<>p_live or a.expires_at<now() then raise exception 'Checkout unavailable'; end if;
  if exists(select 1 from public.order_items i join public.book_editions e on e.id=i.edition_id
   join public.books b on b.id=e.book_id left join public.digital_assets da on da.id=i.digital_asset_id
   where i.order_id=p_id and (b.status<>'published' or b.kindle_unlimited or not e.direct_sale_rights_confirmed or e.availability<>'available'
   or da.id is null or da.status<>'ready' or da.reviewed_by is null
   or not exists(select 1 from storage.objects s where s.bucket_id='private-ebooks' and s.name=da.storage_path))) then raise exception 'An ebook is unavailable'; end if;

 else
  -- Lock the real catalog rows while prices and eligibility are snapshotted.
  ref='LA-'||replace(p_id::text,'-','');
  insert into public.orders(id,public_reference,customer_email,currency,subtotal_minor,total_minor,stripe_livemode)
  values(p_id,ref,p_email,'USD',0,0,p_live);
  for r in select b.id as book_id,b.slug,b.title,b.subtitle,b.status,b.kindle_unlimited,e.*
   from public.books b join public.book_editions e on e.book_id=b.id
   where b.slug=any(p_slugs) and e.format='ebook' and e.sale_channel='direct'
   order by e.id for update of b,e
  loop
   if r.status<>'published' or r.kindle_unlimited or r.availability<>'available' or not r.direct_sale_rights_confirmed
    or coalesce(r.price_minor,0)<=0 or r.currency is null or r.currency not in ('USD','EUR','GBP','ZAR') then raise exception 'An ebook is unavailable'; end if;
   if curr is not null and curr<>r.currency then raise exception 'Mixed currencies are not supported'; end if;
   curr=r.currency;
   select da.id into asset_key from public.digital_assets da join storage.objects s on s.name=da.storage_path and s.bucket_id='private-ebooks'
    where da.edition_id=r.id and da.status='ready' and da.reviewed_by is not null order by da.version desc limit 1 for share of da;
   if asset_key is null then raise exception 'A reviewed private ebook is required'; end if;
   insert into public.order_items(order_id,edition_id,book_title_snapshot,edition_format_snapshot,unit_price_minor,currency,digital_asset_id)
   values(p_id,r.id,case when r.title='4Daniel' then r.subtitle else r.title end,'ebook',r.price_minor,r.currency,asset_key);
   found_count=found_count+1; amount=amount+r.price_minor;
  end loop;
  if found_count<>cardinality(p_slugs) then raise exception 'An ebook is unavailable'; end if;
  update public.orders set currency=curr,subtotal_minor=amount,total_minor=amount where id=p_id;
  insert into public.checkout_attempts(id,access_hash,slugs) values(p_id,p_hash,p_slugs) returning * into a;
  select * into o from public.orders where id=p_id;
 end if;
 return jsonb_build_object('id',o.id,'reference',o.public_reference,'email',o.customer_email,'currency',o.currency,
 'subtotal_minor',o.subtotal_minor,'expires_at',floor(extract(epoch from a.expires_at)),
 'session_id',o.stripe_checkout_session_id,'session_url',a.session_url,
 'items',(select jsonb_agg(jsonb_build_object('edition_id',edition_id,'title',book_title_snapshot,'price_minor',unit_price_minor) order by edition_id)
 from public.order_items where order_id=p_id));
end $$;

create function public.commerce_bind_session(p_id uuid,p_hash text,p_session text,p_url text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.checkout_attempts where id=p_id and access_hash=p_hash for update;
 if not found or p_session !~ '^cs_(test_)?[A-Za-z0-9_]+$' or p_url !~ '^https://checkout\.stripe\.com/' then raise exception 'Invalid checkout session'; end if;
 update public.orders set stripe_checkout_session_id=p_session where id=p_id and (stripe_checkout_session_id is null or stripe_checkout_session_id=p_session);
 if not found then raise exception 'Checkout session mismatch'; end if;
 update public.checkout_attempts set session_url=p_url where id=p_id;
end $$;

create function public.commerce_apply_payment(p_event text,p_type text,p_session text,p_intent text,p_live boolean,
 p_state text,p_subtotal integer,p_tax integer,p_total integer,p_currency text,p_order uuid,p_email text) returns text
language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; ev uuid;
begin
 if p_event !~ '^evt_[A-Za-z0-9_]+$' or p_state not in ('paid','processing','failed','expired','partially_refunded','refunded','disputed') then raise exception 'Invalid payment event'; end if;
 insert into public.payment_events(provider,external_event_id,event_type) values('stripe',p_event,p_type)
 on conflict(provider,external_event_id) do nothing returning id into ev;
 if ev is null then return 'duplicate'; end if;
 select * into o from public.orders where stripe_checkout_session_id=p_session for update;
 if o.id is null or o.id<>p_order or o.stripe_livemode<>p_live then raise exception 'Payment does not match an order'; end if;
 if o.subtotal_minor<>p_subtotal or lower(o.currency)<>lower(p_currency) or p_tax<0 or p_total<>p_subtotal+p_tax then raise exception 'Payment amount mismatch'; end if;
 if o.stripe_payment_intent_id is not null and o.stripe_payment_intent_id<>p_intent then raise exception 'Payment intent mismatch'; end if;
 if p_intent is not null and p_intent !~ '^pi_[A-Za-z0-9_]+$' then raise exception 'Invalid payment intent'; end if;
 if p_state in ('partially_refunded','refunded','disputed') then
  update public.orders set payment_status=case when o.payment_status='refunded' then 'refunded' when p_state='disputed' then 'payment_processing' else p_state end,
    commerce_revoked=true,fulfillment_status='revoked',stripe_payment_intent_id=coalesce(p_intent,stripe_payment_intent_id),tax_minor=p_tax,total_minor=p_total where id=o.id;
  update public.entitlements set status='revoked',revoked_at=now() where order_item_id in(select id from public.order_items where order_id=o.id);
 elsif p_state='paid' and not o.commerce_revoked and o.payment_status not in ('refunded','partially_refunded') then
  if p_intent is null then raise exception 'Paid orders require a payment intent'; end if;
  if length(p_email)>254 or p_email<>lower(p_email) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'A valid purchase email is required'; end if;
  o.customer_email=p_email;

  update public.orders set payment_status='paid',customer_email=p_email,stripe_payment_intent_id=p_intent,tax_minor=p_tax,total_minor=p_total,fulfillment_status='fulfilled' where id=o.id;
  insert into public.entitlements(order_item_id,customer_email,edition_id,status)
   select id,o.customer_email,edition_id,'active' from public.order_items where order_id=o.id on conflict(order_item_id) do nothing;
  insert into public.customers(email) values(o.customer_email) on conflict(email) do nothing;
 elsif o.payment_status<>'paid' and not o.commerce_revoked then
  update public.orders set payment_status=case p_state when 'processing' then 'payment_processing' when 'failed' then 'payment_failed' else 'canceled' end,
   stripe_payment_intent_id=coalesce(p_intent,stripe_payment_intent_id) where id=o.id;
 end if;
 update public.payment_events set processed_at=now(),processing_status='processed' where id=ev;
 return 'processed';
end $$;

create function public.commerce_order_status(p_id uuid,p_hash text,p_session text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;
begin
 perform 1 from public.checkout_attempts where id=p_id and access_hash=p_hash and access_expires_at>now();
 if not found then raise exception 'Order access unavailable'; end if;
 select * into o from public.orders where id=p_id and stripe_checkout_session_id=p_session;
 if o.id is null then raise exception 'Order access unavailable'; end if;
 return jsonb_build_object('id',o.id,'reference',o.public_reference,'payment_status',o.payment_status,'access_revoked',o.commerce_revoked,
 'purchased_slugs',(select slugs from public.checkout_attempts where id=o.id),
 'currency',o.currency,'total_minor',o.total_minor,'tax_minor',o.tax_minor,
 'downloads',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'title',i.book_title_snapshot))
 from public.entitlements e join public.order_items i on i.id=e.order_item_id
 where i.order_id=o.id and e.status='active' and o.payment_status='paid' and not o.commerce_revoked),'[]'::jsonb));
end $$;

create function public.commerce_claim_download(p_id uuid,p_hash text,p_entitlement uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e public.entitlements%rowtype; a public.digital_assets%rowtype; i public.order_items%rowtype;
begin
 -- An order lock serializes authorization, refunds and download rate counting.
 perform 1 from public.orders o join public.checkout_attempts c on c.id=o.id
 where o.id=p_id and o.payment_status='paid' and not o.commerce_revoked and c.access_hash=p_hash and c.access_expires_at>now() for update of o;
 if not found then raise exception 'Download unavailable'; end if;
 select * into e from public.entitlements where id=p_entitlement and status='active';
 select * into i from public.order_items where id=e.order_item_id and order_id=p_id;
 if i.id is null then raise exception 'Download unavailable'; end if;
 if (select count(*) from public.download_events where entitlement_id=e.id and occurred_at>now()-interval '10 minutes')>=10 then raise exception 'Please retry later'; end if;
 select * into a from public.digital_assets where id=i.digital_asset_id;
 if a.id is null then raise exception 'Download unavailable'; end if;
 insert into public.download_events(entitlement_id,asset_id,result) values(e.id,a.id,'signed_url_requested');
 return jsonb_build_object('path',a.storage_path,'format',a.file_format);
end $$;

revoke all on function public.commerce_rate_limit(text,integer,integer),public.commerce_catalog(),public.commerce_begin_checkout(uuid,text,text[],text,boolean),
 public.commerce_bind_session(uuid,text,text,text),public.commerce_apply_payment(text,text,text,text,boolean,text,integer,integer,integer,text,uuid,text),
 public.commerce_order_status(uuid,text,text),public.commerce_claim_download(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.commerce_rate_limit(text,integer,integer),public.commerce_catalog(),public.commerce_begin_checkout(uuid,text,text[],text,boolean),
 public.commerce_bind_session(uuid,text,text,text),public.commerce_apply_payment(text,text,text,text,boolean,text,integer,integer,integer,text,uuid,text),
 public.commerce_order_status(uuid,text,text),public.commerce_claim_download(uuid,text,uuid) to service_role;

-- The owner confirmed direct-sale eligibility for all four titles on 2026-10-28.
-- This does NOT publish files, enable editions, or turn the $0 holding price into a sale.
update public.books set kindle_unlimited=false where slug in('4daniel-book-one','4daniel-book-two','the-bile-of-the-river','4daniel-book-three');
update public.book_editions set direct_sale_rights_confirmed=true where sale_channel='direct' and format='ebook'
 and book_id in(select id from public.books where slug in('4daniel-book-one','4daniel-book-two','the-bile-of-the-river','4daniel-book-three'));
notify pgrst,'reload schema';


-- 20261028000400_purchase_email_recovery.sql

create table public.purchase_recovery_tokens (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 order_id uuid not null references public.orders(id) on delete restrict,
 expires_at timestamptz not null default (now()+interval '30 minutes'), used_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.commerce_email_jobs (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 kind text not null check(kind in ('receipt','recovery')),status text not null default 'pending' check(status in ('pending','processing','sent','failed')),
 attempts integer not null default 0, retry_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(order_id,kind)
);
alter table public.purchase_recovery_tokens enable row level security;
alter table public.commerce_email_jobs enable row level security;
revoke all on public.purchase_recovery_tokens,public.commerce_email_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.purchase_recovery_tokens,public.commerce_email_jobs to service_role;

create function private.queue_purchase_receipt() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.payment_status='paid' and old.payment_status<>'paid' and not new.commerce_revoked then
  insert into public.commerce_email_jobs(order_id,kind) values(new.id,'receipt') on conflict(order_id,kind) do nothing;
 end if;
 return new;
end $$;
revoke all on function private.queue_purchase_receipt() from public,anon,authenticated;
create trigger queue_purchase_receipt after update of payment_status on public.orders for each row execute function private.queue_purchase_receipt();

create function public.commerce_request_recovery(p_email text) returns void language plpgsql security definer set search_path='' as $$ begin
 insert into public.commerce_email_jobs(order_id,kind)
 select id,'recovery' from public.orders where customer_email=p_email and payment_status='paid' and not commerce_revoked
 on conflict(order_id,kind) do update set status='pending',attempts=0,retry_at=now(),updated_at=now()
 where public.commerce_email_jobs.status in ('sent','failed') and public.commerce_email_jobs.updated_at<now()-interval '5 minutes';
end $$;

create function public.commerce_claim_email_jobs() returns jsonb language plpgsql security definer set search_path='' as $$
declare j record; jobs jsonb:='[]'::jsonb;
begin
 delete from public.purchase_recovery_tokens where expires_at<now()-interval '1 day';
 delete from public.commerce_rate_limits where created_at<now()-interval '2 days';
 update public.commerce_email_jobs set status='failed',updated_at=now() where status='processing' and attempts>=5 and updated_at<now()-interval '10 minutes';
 for j in select * from public.commerce_email_jobs where attempts<5 and retry_at<=now()
  and (status='pending' or (status='processing' and updated_at<now()-interval '10 minutes'))
  order by retry_at limit 3 for update skip locked
 loop
  if not exists(select 1 from public.orders where id=j.order_id and payment_status='paid' and not commerce_revoked) then
   update public.commerce_email_jobs set status='failed',updated_at=now() where id=j.id;
   continue;
  end if;
  update public.commerce_email_jobs set status='processing',attempts=attempts+1,updated_at=now() where id=j.id;
  jobs=jobs||jsonb_build_array((select jsonb_build_object('job_id',j.id,'kind',j.kind,'order_id',o.id,'email',o.customer_email,'reference',o.public_reference,
   'currency',o.currency,'total_minor',o.total_minor,'items',(select jsonb_agg(book_title_snapshot order by id) from public.order_items where order_id=o.id))
   from public.orders o where o.id=j.order_id and payment_status='paid' and not commerce_revoked));
 end loop;
 return jobs;
end $$;

create function public.commerce_issue_recovery(p_job uuid,p_hash text) returns void language plpgsql security definer set search_path='' as $$
declare order_key uuid;
begin
 if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token'; end if;
 select j.order_id into order_key from public.commerce_email_jobs j join public.orders o on o.id=j.order_id
 where j.id=p_job and j.status='processing' and o.payment_status='paid' and not o.commerce_revoked;
 if order_key is null then raise exception 'Delivery unavailable'; end if;
 insert into public.purchase_recovery_tokens(token_hash,order_id) values(p_hash,order_key);
end $$;

create function public.commerce_finish_email(p_job uuid,p_success boolean) returns void language plpgsql security definer set search_path='' as $$ begin
 update public.commerce_email_jobs set status=case when p_success then 'sent' when attempts>=5 then 'failed' else 'pending' end,
  retry_at=now()+interval '5 minutes'*greatest(attempts,1),updated_at=now() where id=p_job and status='processing';
end $$;

create function public.commerce_recover_access(p_hash text,p_access_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.purchase_recovery_tokens%rowtype; session_key text;
begin
 if p_access_hash !~ '^[a-f0-9]{64}$' then raise exception 'Access unavailable'; end if;
 select * into t from public.purchase_recovery_tokens where token_hash=p_hash and expires_at>now() and used_at is null for update;
 if t.order_id is null then raise exception 'Access unavailable'; end if;
 select stripe_checkout_session_id into session_key from public.orders where id=t.order_id and payment_status='paid' and not commerce_revoked for update;
 if session_key is null then raise exception 'Access unavailable'; end if;
 update public.checkout_attempts set access_hash=p_access_hash,access_expires_at=now()+interval '7 days' where id=t.order_id;
 update public.purchase_recovery_tokens set used_at=now() where token_hash=p_hash;
 return jsonb_build_object('order_id',t.order_id,'session_id',session_key);
end $$;
revoke all on function public.commerce_request_recovery(text),public.commerce_claim_email_jobs(),public.commerce_issue_recovery(uuid,text),public.commerce_finish_email(uuid,boolean),public.commerce_recover_access(text,text) from public,anon,authenticated;
grant execute on function public.commerce_request_recovery(text),public.commerce_claim_email_jobs(),public.commerce_issue_recovery(uuid,text),public.commerce_finish_email(uuid,boolean),public.commerce_recover_access(text,text) to service_role;
notify pgrst,'reload schema';

commit;
