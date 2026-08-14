-- TASK-738 / audit report 03 P1-8: idempotency key for character create.
--
-- `POST /api/characters` had no idempotency key, so a create whose response was lost
-- (mobile handoff, tab throttle, timeout) re-enabled the button and a second click
-- inserted a second character. The route now accepts a client-generated
-- `clientRequestId` and replays the first result instead of inserting again.
--
-- The partial unique index is what makes the replay race-safe: two concurrent retries
-- cannot both insert, the loser gets 23505 and the route re-reads the winning row.
-- Scoped per user so one player's key can never collide with another's.
-- Nullable + partial: existing rows and any caller that omits the key are unaffected.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

COMMENT ON COLUMN public.characters.client_request_id IS
  'Client-generated idempotency key for POST /api/characters (TASK-738). Null for rows created before the key existed or by callers that omit it.';

CREATE UNIQUE INDEX IF NOT EXISTS characters_user_client_request_id_key
  ON public.characters (user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;
