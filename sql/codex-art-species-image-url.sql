-- Codex card art: species image_url column + codex-art storage bucket (TASK-405 phase 1)
-- Apply via Supabase MCP apply_migration or SQL Editor.
-- Writes: admin-only through /api/upload/codex-art (service role). Public read URLs.

alter table public.codex_species
  add column if not exists image_url text;

comment on column public.codex_species.image_url is
  'Public URL for species card/hero art (codex-art bucket). Admin upload via /api/upload/codex-art.';

-- Public bucket for codex card art (species, creatures, equipment, powers, techniques).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'codex-art',
  'codex-art',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Codex art is publicly readable" on storage.objects;
create policy "Codex art is publicly readable"
on storage.objects for select
to public
using (bucket_id = 'codex-art');

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- Admin uploads use service role in /api/upload/codex-art after isAdmin() check.
