begin;
create function public.save_book_draft(p_book_id uuid, p_data jsonb, p_version integer) returns uuid
language plpgsql security invoker set search_path='' as $$
declare book_key uuid; current_version integer;
begin
 if not private.can_edit() then raise exception 'Permission denied'; end if;
 if jsonb_typeof(p_data)<>'object' or length(p_data::text)>100000 or length(coalesce(p_data->>'title','')) not between 1 and 200 or coalesce(p_data->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid book draft'; end if;
 if p_book_id is null then
  insert into public.books(slug,title) values(p_data->>'slug',p_data->>'title') returning id into book_key;
  insert into public.book_drafts(book_id,data,updated_by) values(book_key,p_data,auth.uid());
 else
  book_key=p_book_id;
  select version into current_version from public.book_drafts where book_id=book_key for update;
  if current_version is null or current_version<>p_version then raise exception 'This draft changed. Reload before saving.'; end if;
  update public.book_drafts set data=p_data,version=version+1,updated_by=auth.uid() where book_id=book_key;
 end if;
 return book_key;
end $$;
create function public.publish_book(p_book_id uuid, p_version integer) returns void
language plpgsql security invoker set search_path='' as $$
declare d jsonb; v integer;
begin
 if not private.can_manage() then raise exception 'Publishing requires an owner or administrator'; end if;
 select data,version into d,v from public.book_drafts where book_id=p_book_id for update;
 if d is null or v<>p_version then raise exception 'This draft changed. Reload before publishing.'; end if;
 update public.books set slug=d->>'slug',title=d->>'title',subtitle=coalesce(d->>'subtitle',''), short_description=d->>'short_description',
 full_description=array(select jsonb_array_elements_text(d->'full_description')), genre=coalesce(d->>'genre',''),
 series_id=nullif(d->>'series_id','')::uuid,series_position=nullif(d->>'series_position','')::integer,
 cover_asset_id=nullif(d->>'cover_asset_id','')::uuid,cover_path=coalesce(d->>'cover_path',''), publication_date=nullif(d->>'publication_date','')::date,
 language=coalesce(d->>'language','en'),featured=coalesce((d->>'featured')::boolean,false), display_order=coalesce((d->>'display_order')::integer,0),
 tone=coalesce(d->>'tone','sage'), themes=array(select jsonb_array_elements_text(d->'themes')),source_url=coalesce(d->>'source_url',''),
 seo_title=coalesce(d->>'seo_title',''),seo_description=coalesce(d->>'seo_description',''),status='published' where id=p_book_id;
 if not found then raise exception 'Book not found'; end if;
end $$;
create function public.set_book_status(p_book_id uuid,p_status text) returns void language plpgsql security invoker set search_path='' as $$ begin
 if not private.can_manage() or p_status not in ('draft','archived') then raise exception 'Permission denied'; end if;
 update public.books set status=p_status where id=p_book_id;
 if not found then raise exception 'Book not found'; end if;
end $$;

create function public.save_content_draft(p_slug text,p_title text,p_content jsonb,p_version integer) returns void
language plpgsql security invoker set search_path='' as $$ declare current_version integer; begin
 if not private.can_edit() then raise exception 'Permission denied'; end if;
 if p_slug not in ('home','about','contact') or length(p_title) not between 1 and 200 or jsonb_typeof(p_content)<>'object' or length(p_content::text)>100000 then raise exception 'Invalid content'; end if;
 select version into current_version from public.content_drafts where page_slug=p_slug for update;
 if current_version is null then
  if p_version<>0 then raise exception 'Draft not found'; end if;
  insert into public.content_drafts(page_slug,title,content,updated_by) values(p_slug,p_title,p_content,auth.uid());
 else
  if current_version<>p_version then raise exception 'This draft changed. Reload before saving.'; end if;
  update public.content_drafts set title=p_title,content=p_content,version=version+1,updated_by=auth.uid() where page_slug=p_slug;
 end if;
end $$;
create function public.publish_content(p_slug text,p_version integer) returns void
language plpgsql security invoker set search_path='' as $$ declare d public.content_drafts%rowtype; begin
 if not private.can_manage() then raise exception 'Publishing requires an owner or administrator'; end if;
 select * into d from public.content_drafts where page_slug=p_slug for update;
 if d.id is null or d.version<>p_version then raise exception 'This draft changed. Reload before publishing.'; end if;
 insert into public.pages(slug,title,content,status) values(d.page_slug,d.title,d.content,'published')
 on conflict(slug) do update set title=excluded.title,content=excluded.content,status='published';
end $$;

create function public.finalize_upload(p_intent_id uuid,p_path text,p_checksum text,p_size bigint,p_format text,p_width integer default null,p_height integer default null) returns uuid
language plpgsql security invoker set search_path='' as $$
declare i public.upload_intents%rowtype; asset_key uuid; next_version integer;
begin
 select * into i from public.upload_intents where id=p_intent_id for update;
 if i.id is null or i.created_by<>auth.uid() or i.status<>'pending' or i.expires_at<now() then raise exception 'Upload unavailable or expired'; end if;
 if p_size<=0 or p_checksum !~ '^[a-f0-9]{64}$' then raise exception 'Invalid asset'; end if;
 if i.kind='ebook' then
  if not private.can_manage() or p_path<>i.storage_path or p_size<>i.expected_size or p_format not in ('pdf','epub') then raise exception 'Invalid ebook upload'; end if;
  perform 1 from public.book_editions where id=i.edition_id and format='ebook' and sale_channel='direct' for update;
  if not found then raise exception 'A direct ebook edition is required'; end if;
  select coalesce(max(version),0)+1 into next_version from public.digital_assets where edition_id=i.edition_id;
  insert into public.digital_assets(edition_id,storage_path,file_format,file_size,file_checksum,version,created_by)
  values(i.edition_id,p_path,p_format,p_size,p_checksum,next_version,auth.uid()) returning id into asset_key;
 else
  if not private.can_edit() or p_path<>auth.uid()::text||'/'||i.id::text||'/cover.jpg' or p_format<>'jpeg' then raise exception 'Invalid cover upload'; end if;
  insert into public.media_assets(storage_path,mime_type,file_size,file_checksum,width,height,created_by)
  values(p_path,'image/jpeg',p_size,p_checksum,p_width,p_height,auth.uid()) returning id into asset_key;
 end if;
 update public.upload_intents set status='completed' where id=i.id;
 return asset_key;
end $$;
create function public.record_asset_access(p_asset_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if not private.can_manage() or not exists(select 1 from public.digital_assets where id=p_asset_id) then raise exception 'Permission denied'; end if;
 insert into public.audit_logs(actor_id,actor_role,action,table_name,record_id) values(auth.uid(),private.staff_role(),'ADMIN_DOWNLOAD','digital_assets',p_asset_id::text);
end $$;

-- Bucket configuration is allowed; object data is managed exclusively through Storage API.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('book-covers','book-covers',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('private-ebooks','private-ebooks',false,26214400,array['application/pdf','application/epub+zip'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy archive_cover_read on storage.objects for select using(bucket_id='book-covers' and
 (private.can_edit() or exists(select 1 from public.media_assets m join public.books b on b.cover_asset_id=m.id where m.storage_path=name and b.status='published')));
create policy archive_cover_insert on storage.objects for insert to authenticated with check(bucket_id='book-covers' and private.can_edit() and split_part(name,'/',1)=auth.uid()::text);
create policy archive_ebook_read on storage.objects for select to authenticated using(bucket_id='private-ebooks' and private.can_manage());
create policy archive_ebook_insert on storage.objects for insert to authenticated with check(bucket_id='private-ebooks' and private.can_manage() and split_part(name,'/',1)=auth.uid()::text);
-- No UPDATE policy: existing versions cannot be overwritten. Only unreferenced temporary files can be removed.
create policy archive_temporary_delete on storage.objects for delete to authenticated using(
 split_part(name,'/',1)=auth.uid()::text and
 ((bucket_id='book-covers' and private.can_edit() and not exists(select 1 from public.media_assets m where m.storage_path=name)) or
 (bucket_id='private-ebooks' and private.can_manage() and not exists(select 1 from public.digital_assets a where a.storage_path=name)))
);

revoke all on function public.save_book_draft(uuid,jsonb,integer),public.publish_book(uuid,integer),public.set_book_status(uuid,text),public.save_content_draft(text,text,jsonb,integer),public.publish_content(text,integer),public.finalize_upload(uuid,text,text,bigint,text,integer,integer),public.record_asset_access(uuid) from public;
grant execute on function public.save_book_draft(uuid,jsonb,integer),public.publish_book(uuid,integer),public.set_book_status(uuid,text),public.save_content_draft(text,text,jsonb,integer),public.publish_content(text,integer),public.finalize_upload(uuid,text,text,bigint,text,integer,integer),public.record_asset_access(uuid) to authenticated;
commit;
