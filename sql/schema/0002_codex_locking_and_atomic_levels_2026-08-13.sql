-- 0002 — Audit remediation, wave 1b: codex optimistic locking + atomic archetype level replace
-- Applied: 2026-08-13 via Supabase apply_migration (name: audit_remediation_codex_locking)
-- Source: reports/audit-2026-08-13/08-admin-surface.md (F-07 optimistic locking, F-04 archetype replace)
-- Replay-safe: yes (add column if not exists, create or replace, guarded trigger drops)
-- Destructive: no
-- Prereqs: 0001. Verified before applying: only codex_archetype_levels had updated_at;
--   codex_archetype_levels has UNIQUE (archetype_id, level) so insert-before-delete is impossible,
--   which is why the replace must be transactional server-side; all level payload columns are text,
--   so ->> extraction is correct.

begin;

-- ---------------------------------------------------------------------------
-- 1. updated_at on the nine codex tables.
--
-- The admin editors now send an optimistic-locking precondition, but the columns
-- did not exist, so the feature was coded and wired yet permanently dormant and
-- two admins editing one entity silently last-write-wins.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'codex_feats', 'codex_skills', 'codex_species', 'codex_traits', 'codex_parts',
    'codex_properties', 'codex_equipment', 'codex_archetypes', 'codex_creature_feats'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists updated_at timestamptz not null default now()', t
    );
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      t || '_touch_updated_at', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Atomic archetype level replace.
--
-- The previous app-side flow deleted every level then re-inserted, so an insert
-- failure left an archetype with zero levels and wiped its progression. The app
-- keeps a snapshot-restore fallback, but a single transaction server-side is the
-- real fix. Refuses an empty level set outright — that is never a legitimate save.
--
-- SECURITY DEFINER with a pinned search_path, and execute revoked from every
-- client role: only the service-role path used by the admin server actions can
-- call it.
-- ---------------------------------------------------------------------------
create or replace function public.replace_archetype_levels(p_archetype_id text, p_levels jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  inserted integer;
begin
  if p_levels is null or jsonb_typeof(p_levels) <> 'array' then
    raise exception 'replace_archetype_levels: p_levels must be a JSON array';
  end if;

  if jsonb_array_length(p_levels) = 0 then
    raise exception 'refusing to clear all levels for archetype %', p_archetype_id;
  end if;

  delete from public.codex_archetype_levels where archetype_id = p_archetype_id;

  insert into public.codex_archetype_levels (
    archetype_id, level, feats, skills, powers, techniques, armaments, equipment,
    remove_feats, remove_powers, remove_techniques, remove_armaments, notes
  )
  select
    p_archetype_id,
    (e ->> 'level')::int,
    e ->> 'feats', e ->> 'skills', e ->> 'powers', e ->> 'techniques',
    e ->> 'armaments', e ->> 'equipment', e ->> 'remove_feats', e ->> 'remove_powers',
    e ->> 'remove_techniques', e ->> 'remove_armaments', e ->> 'notes'
  from jsonb_array_elements(p_levels) e;

  get diagnostics inserted = row_count;
  return inserted;
end;
$function$;

revoke all on function public.replace_archetype_levels(text, jsonb) from public;
revoke all on function public.replace_archetype_levels(text, jsonb) from anon;
revoke all on function public.replace_archetype_levels(text, jsonb) from authenticated;

commit;
