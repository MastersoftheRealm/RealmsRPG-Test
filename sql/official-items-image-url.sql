-- Armament card art: official_items.image_url (weapon / armor / shield only)
-- Status: Applied on RealmsRPG-Test — migration official_items_image_url (20260702143123).
-- codex_equipment (simple gear) does NOT get images.

alter table public.official_items
  add column if not exists image_url text;

comment on column public.official_items.image_url is
  'Public URL for armament card art (weapon/armor/shield) in codex-art bucket. Admin upload via /api/upload/codex-art.';
