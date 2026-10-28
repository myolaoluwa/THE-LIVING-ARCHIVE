-- Owner-requested password-only administration. Existing role and storage
-- policies continue to require an active staff profile; no public grants change.
begin;
create or replace function private.staff_role() returns text
language sql stable security definer set search_path='' as $$
 select role from public.admin_profiles
 where auth_user_id=(select auth.uid()) and active
   and (select auth.jwt()->>'aal') in ('aal1','aal2')
$$;
revoke all on function private.staff_role() from public;
grant execute on function private.staff_role() to anon,authenticated;
notify pgrst, 'reload schema';
commit;
