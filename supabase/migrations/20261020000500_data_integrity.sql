begin;
alter table public.customers add constraint customer_email_valid check(email=lower(email) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
alter table public.orders add constraint order_email_valid check(customer_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
alter table public.subscribers add constraint subscriber_consent_valid check(
 (consent_status<>'confirmed' or (consent_timestamp is not null and consent_source is not null)) and
 (consent_status<>'unsubscribed' or unsubscribe_timestamp is not null)
);
alter table public.subscribers add constraint subscriber_email_valid check(email=lower(email) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
alter table public.contact_messages add constraint enquiry_fields_valid check(
 length(name) between 1 and 120 and length(subject) between 1 and 200 and length(message) between 10 and 5000 and
 email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
);
alter table public.download_tokens add constraint token_hash_valid check(token_hash ~ '^[a-f0-9]{64}$' and expires_at>created_at);
alter table public.order_items add constraint ebook_order_only check(edition_format_snapshot='ebook' and currency ~ '^[A-Z]{3}$');
create function private.guard_asset_object() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from storage.objects where bucket_id=case when tg_table_name='media_assets' then 'book-covers' else 'private-ebooks' end and name=new.storage_path) then
  raise exception 'The private storage object must exist before asset registration';
 end if;
 return new;
end $$;
create trigger guard_cover_object before insert on public.media_assets for each row execute function private.guard_asset_object();
create trigger guard_ebook_object before insert on public.digital_assets for each row execute function private.guard_asset_object();
revoke all on function private.guard_asset_object() from public;
commit;
