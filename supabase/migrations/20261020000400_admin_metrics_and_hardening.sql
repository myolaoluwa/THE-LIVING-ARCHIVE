begin;
-- Metadata versions cannot be repointed or deleted through the authenticated API.
revoke update,delete on public.digital_assets from authenticated;
grant update(status,reviewed_by) on public.digital_assets to authenticated;
revoke delete on public.book_drafts,public.content_drafts from authenticated;
alter table public.book_editions add constraint supported_price_currency check(currency is null or currency in ('USD','EUR','GBP','ZAR'));
alter table public.site_settings add constraint contact_email_format check(key<>'contact_email' or value='' or value ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

create function public.admin_metrics() returns jsonb language plpgsql security invoker set search_path='' as $$
declare totals jsonb;
begin
 if not private.can_manage() then raise exception 'Permission denied'; end if;
 select coalesce(jsonb_agg(x),'[]'::jsonb) into totals from (select currency,sum(total_minor) as amount_minor,count(*) as order_count from public.orders where payment_status='paid' group by currency order by currency) x;
 return jsonb_build_object('orders',(select count(*) from public.orders),'paid_orders',(select count(*) from public.orders where payment_status='paid'),'enquiries',(select count(*) from public.contact_messages where status='new'),'subscribers',(select count(*) from public.subscribers where consent_status='confirmed'),'paid_totals',totals);
end $$;
revoke all on function public.admin_metrics() from public;
grant execute on function public.admin_metrics() to authenticated;
commit;
