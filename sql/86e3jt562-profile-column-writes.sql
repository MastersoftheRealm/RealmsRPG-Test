-- 86e3jt562 — a signed-in user cannot write protected profile columns
-- =============================================================================
-- Status: APPLIED 2026-10-11 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Replay: idempotent (revoke + grant, create-or-replace, drop + create policies)
-- Destructive: no (no row deletes)
--
-- Before: authenticated could UPDATE every user_profiles column except role,
-- and could INSERT/UPDATE/DELETE their own usernames row. That skipped the
-- username rules, the 7-day cooldown, and any check on photo_url.
-- profile-pictures storage allowed {uid}.* for every role, including new_player.
--
-- After: the session client may INSERT id/display_name/created_at/updated_at
-- and UPDATE display_name/updated_at. Username, email, photo, and the username
-- map are written by the service role after the server actions check the rules.
-- Storage insert/update of a profile picture also requires the role flag
-- can_upload_profile_picture.
-- =============================================================================

-- Column privileges. A table-level UPDATE cannot have one column subtracted,
-- so revoke the table privilege and grant the columns the session client uses.
revoke insert, update on public.user_profiles from authenticated;

grant insert (
  id, display_name, created_at, updated_at
) on public.user_profiles to authenticated;

grant update (
  display_name, updated_at
) on public.user_profiles to authenticated;

revoke insert, update, delete on public.usernames from authenticated;

drop policy if exists "Users can insert own username" on public.usernames;
drop policy if exists "Users can update own username" on public.usernames;
drop policy if exists "Users can delete own username" on public.usernames;

-- Defence in depth if a later grant puts the columns back.
create or replace function public.prevent_client_profile_field_change()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.username is not null
      or new.username_display is not null
      or new.photo_url is not null
      or new.last_username_change is not null
      or new.email is not null
    then
      raise exception 'Profile fields must be set by the server'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.username is distinct from old.username
    or new.username_display is distinct from old.username_display
    or new.photo_url is distinct from old.photo_url
    or new.last_username_change is distinct from old.last_username_change
    or new.email is distinct from old.email
    or new.id is distinct from old.id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Profile fields must be set by the server'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_prevent_client_profile_field_change on public.user_profiles;
create trigger trg_prevent_client_profile_field_change
  before insert or update on public.user_profiles
  for each row execute function public.prevent_client_profile_field_change();

create or replace function public.auth_can_upload_profile_picture()
returns boolean
language sql
stable
security invoker
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.user_profiles up
    join public.role_policies rp on rp.role = up.role
    where up.id = (select auth.uid())::text
      and coalesce((rp.permissions ->> 'can_upload_profile_picture')::boolean, false)
  );
$function$;

revoke all on function public.auth_can_upload_profile_picture() from public;
grant execute on function public.auth_can_upload_profile_picture() to authenticated;

drop policy if exists "Users can upload own profile picture" on storage.objects;
create policy "Users can upload own profile picture"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and name like ((select auth.uid())::text || '.%')
  and public.auth_can_upload_profile_picture()
);

drop policy if exists "Users can update own profile picture" on storage.objects;
create policy "Users can update own profile picture"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and name like ((select auth.uid())::text || '.%')
  and public.auth_can_upload_profile_picture()
)
with check (
  bucket_id = 'profile-pictures'
  and name like ((select auth.uid())::text || '.%')
  and public.auth_can_upload_profile_picture()
);
