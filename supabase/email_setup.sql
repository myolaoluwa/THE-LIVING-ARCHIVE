-- Run once in the connected Supabase SQL Editor when commerce_email_jobs is absent.
-- This is the existing 20261028000400 email/recovery migration; do not rerun it after success.
begin;
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
