-- DEV-376 / TASK-392: Drop legacy DB tooltip stack
-- Replaced by InfoTippy + public/tooltip-text.tsx (Floating UI).
-- Applied to RealmsRPG-Test via Supabase MCP 2026-06-30 (migration: drop_legacy_ui_tooltips).

DROP TABLE IF EXISTS public.ui_tooltips CASCADE;

DROP FUNCTION IF EXISTS public.set_ui_tooltips_updated_at() CASCADE;

ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS show_tooltips;
