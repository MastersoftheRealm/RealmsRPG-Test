-- 0001 — Audit remediation, wave 1: privilege escalation, access-control authority, id retirement
-- Applied: 2026-08-13 via Supabase apply_migration (name: audit_remediation_wave1_security)
-- Source: reports/audit-2026-08-13/00-database-and-infrastructure.md
-- Replay-safe: yes (idempotent — guarded drops, create-or-replace, IF NOT EXISTS)
-- Destructive: no (drops two policies and two column grants; no data is deleted)
-- Prereqs: none. Baseline schema: sql/schema/0000_baseline_2026-08-13.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. P0 — privilege escalation: any authenticated user could become admin.
--
-- The previous guard was BEFORE UPDATE OF role, so it never fired on INSERT,
-- while `authenticated` held INSERT privilege on the role column and the INSERT
-- policy only checked `id = auth.uid()`. A fresh account could insert its own
-- profile row with role='admin'; an existing one could delete-then-reinsert.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      -- Ignore any client-supplied role on self-service profile creation.
      new.role := 'new_player';
    elsif new.role is distinct from old.role then
      raise exception 'Changing user role is not permitted' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_prevent_unauthorized_role_change on public.user_profiles;
create trigger trg_prevent_unauthorized_role_change
  before insert or update on public.user_profiles
  for each row execute function public.prevent_unauthorized_role_change();

-- Defence in depth: clients cannot name the role column at all.
--
-- A column-level REVOKE is a no-op while a table-level privilege exists (a
-- table grant implies every column and cannot have one column subtracted), so
-- the table-level INSERT/UPDATE must be revoked and re-granted per column.
-- Every column except `role` is granted, preserving current app behaviour:
-- createUserProfileAction inserts id/email/display_name/username/
-- username_display/created_at/updated_at; the profile-picture upload upserts
-- photo_url; changeUsernameAction updates username/username_display/
-- last_username_change. Role changes go through /api/admin/users/update-role,
-- which uses the service-role client and is unaffected.
revoke insert, update on public.user_profiles from authenticated;

grant insert (
  id, email, display_name, username, username_display,
  photo_url, last_username_change, created_at, updated_at
) on public.user_profiles to authenticated;

grant update (
  id, email, display_name, username, username_display,
  photo_url, last_username_change, created_at, updated_at
) on public.user_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. P0 — remove the client-callable cascade delete of an entire account.
--
-- Every FK into user_profiles is ON DELETE CASCADE, so this policy let a single
-- client call destroy all of a user's characters and library. Account deletion
-- runs through deleteAccountAction, which holds the service role.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can delete own profile" on public.user_profiles;

-- ---------------------------------------------------------------------------
-- 3. P2 — role_policies published the whole authorization matrix to every user.
--
-- Scoped to the caller's own role, plus admins (the admin roles page reads all
-- rows through the user-scoped client, so an own-row-only policy would break it).
-- ---------------------------------------------------------------------------
drop policy if exists role_policies_select_authenticated on public.role_policies;
create policy role_policies_select_scoped on public.role_policies
  for select to authenticated
  using (
    role = (select up.role from public.user_profiles up where up.id = (select auth.uid())::text)
    or exists (
      select 1 from public.user_profiles up
      where up.id = (select auth.uid())::text and up.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- 4. P1 — characters.visibility becomes the single source of truth.
--
-- Access control previously read data->>'visibility' (a copy inside the JSONB
-- blob) while list/filter UI read the real column, with nothing keeping them in
-- sync. 14 rows already disagreed. Verified before applying: 0 rows have a NULL
-- visibility column, so NOT NULL is safe without a backfill.
-- ---------------------------------------------------------------------------
alter table public.characters
  alter column visibility set default 'private';

update public.characters
  set visibility = coalesce(visibility, data ->> 'visibility', 'private')
  where visibility is null;

alter table public.characters
  alter column visibility set not null;

alter table public.characters
  drop constraint if exists characters_visibility_check;
alter table public.characters
  add constraint characters_visibility_check
  check (visibility in ('private', 'campaign', 'public'));

-- Rewrite both SELECT policies to read the column. The campaign branch keeps its
-- existing shape (including tolerating both key spellings in campaigns.characters)
-- so this migration changes only the visibility source, not campaign semantics.
drop policy if exists characters_select_public_anon on public.characters;
create policy characters_select_public_anon on public.characters
  for select to anon
  using (visibility = 'public');

drop policy if exists characters_select_authenticated on public.characters;
create policy characters_select_authenticated on public.characters
  for select to authenticated
  using (
    user_id = (select auth.uid())::text
    or visibility = 'public'
    or (
      visibility = 'campaign'
      and exists (
        select 1
        from campaigns c
        cross join lateral jsonb_array_elements(
          case
            when c.characters is null then '[]'::jsonb
            when jsonb_typeof(c.characters) = 'array' then c.characters
            else '[]'::jsonb
          end
        ) elem(value)
        where (
          (
            (elem.value ? 'characterId')
            and (elem.value ->> 'characterId') = characters.id
            and (elem.value ->> 'userId') = characters.user_id
          )
          or (
            (elem.value ? 'character_id')
            and (elem.value ->> 'character_id') = characters.id
            and (elem.value ->> 'user_id') = characters.user_id
          )
        )
        and private.auth_is_campaign_participant(c.id)
      )
    )
  );

create index if not exists idx_characters_visibility on public.characters (visibility);

-- ---------------------------------------------------------------------------
-- 5. P1 — codex ids must never be reused.
--
-- Confirmed in production: feat id 248 was "Flawless Fighter", was deleted, and
-- 26 minutes later became "Elemental Adaptation", silently repointing every
-- character that had taken the old feat. Deleting a codex entity now records a
-- tombstone, and id allocation must skip retired ids as well as live ones.
--
-- Service-role only by design: RLS on, no policies. Codex writes already run
-- through the service-role client in admin server actions.
-- ---------------------------------------------------------------------------
create table if not exists public.codex_retired_ids (
  entity_type text not null,
  id text not null,
  retired_at timestamptz not null default now(),
  retired_by text,
  primary key (entity_type, id)
);

alter table public.codex_retired_ids enable row level security;

comment on table public.codex_retired_ids is
  'Tombstones for deleted codex/official entity ids. Id allocation must never reuse an id present here. Service-role access only (RLS enabled, no policies).';

-- Seed the one known recycled id so it is never handed out a third time.
insert into public.codex_retired_ids (entity_type, id, retired_at)
  values ('codex_feats', '248', '2026-04-20 17:56:54.599932+00')
  on conflict (entity_type, id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. P2 — performance and storage hygiene.
-- ---------------------------------------------------------------------------
create index if not exists idx_vtt_actions_token_id on public.vtt_actions (token_id);

-- vtt-maps was the only bucket with no size or mime restriction.
update storage.buckets
  set file_size_limit = 26214400,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']
  where id = 'vtt-maps';

-- ---------------------------------------------------------------------------
-- 7. DEFERRED — FK from user_profiles.id to auth.users.id.
--
-- Not done here, deliberately. user_profiles.id is `text` while auth.users.id is
-- `uuid`, so the constraint cannot be created without first migrating the column
-- type — and every FK into user_profiles (characters, user_items, user_powers,
-- usernames, crafting_sessions, …) is text too, so the type change has to move
-- all of them together. That belongs in its own migration with a rehearsal on a
-- branch database.
--
-- Related open item: one orphan profile (f4f4961c…, username player958773) has
-- no auth.users row, consistent with deleteAccountAction having partially failed.
-- Left in place; deleting it cascades that user's content, which is an owner
-- decision, not an audit one.
-- ---------------------------------------------------------------------------

commit;
