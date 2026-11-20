--
-- PostgreSQL database dump
--

\restrict pZcaD7tY2VgNRh4lxstxYPDezqHVCG8FIpMVNVRndQyYihcRqIkz3chwS21DD6b

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA private;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone',
    'recovery_code'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'new_player',
    'playtester',
    'developer',
    'admin'
);


--
-- Name: realms_image_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.realms_image_category AS ENUM (
    'species',
    'creature',
    'weapon',
    'armor',
    'shield',
    'equipment',
    'power',
    'technique'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
    revoke trigger on cron.job_run_details from postgres;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
begin
    if not exists (
        select 1
        from pg_catalog.pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8.0', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
            set search_path to ''
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: auth_is_campaign_owner(text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.auth_is_campaign_owner(p_campaign_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND c.owner_id = (select auth.uid())::text
  );
$$;


--
-- Name: auth_is_campaign_participant(text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.auth_is_campaign_participant(p_campaign_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND (
        c.owner_id = (select auth.uid())::text
        OR EXISTS (
          SELECT 1 FROM public.campaign_members m
          WHERE m.campaign_id = c.id
            AND m.user_id = (select auth.uid())::text
        )
      )
  );
$$;


--
-- Name: auth_is_vtt_campaign_owner(text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.auth_is_vtt_campaign_owner(p_campaign_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND c.owner_id = (select auth.uid())::text
  );
$$;


--
-- Name: auth_is_vtt_campaign_participant(text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.auth_is_vtt_campaign_participant(p_campaign_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND (
        c.owner_id = (select auth.uid())::text
        OR EXISTS (
          SELECT 1
          FROM public.campaign_members m
          WHERE m.campaign_id = c.id
            AND m.user_id = (select auth.uid())::text
        )
      )
  );
$$;


--
-- Name: campaign_roster_user_joined(text, text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.campaign_roster_user_joined(p_campaign_id text, p_user_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT p_user_id IS NOT NULL
    AND btrim(p_user_id) <> ''
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = p_campaign_id
        AND (
          c.owner_id = p_user_id
          OR EXISTS (
            SELECT 1
            FROM public.campaign_members m
            WHERE m.campaign_id = c.id
              AND m.user_id = p_user_id
          )
        )
    );
$$;


--
-- Name: enforce_campaign_roster_members(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.enforce_campaign_roster_members() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_entry jsonb;
  new_user text;
  new_character text;
  actor text;
BEGIN
  IF NEW.characters IS NULL OR jsonb_typeof(NEW.characters) <> 'array' THEN
    RAISE EXCEPTION 'campaign roster must be a json array'
      USING ERRCODE = '23514';
  END IF;

  actor := (SELECT auth.uid())::text;

  FOR new_entry IN
    SELECT value FROM jsonb_array_elements(NEW.characters)
  LOOP
    IF jsonb_typeof(new_entry) <> 'object' THEN
      RAISE EXCEPTION 'campaign roster entries must be objects'
        USING ERRCODE = '23514';
    END IF;

    new_user := COALESCE(new_entry->>'userId', new_entry->>'user_id');
    new_character := COALESCE(new_entry->>'characterId', new_entry->>'character_id');

    IF new_user IS NULL OR btrim(new_user) = ''
       OR new_character IS NULL OR btrim(new_character) = '' THEN
      RAISE EXCEPTION 'campaign roster entry is missing user or character id'
        USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
        CASE
          WHEN OLD.characters IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(OLD.characters) = 'array' THEN OLD.characters
          ELSE '[]'::jsonb
        END
      ) AS old_entry
      WHERE COALESCE(old_entry->>'userId', old_entry->>'user_id') = new_user
        AND COALESCE(old_entry->>'characterId', old_entry->>'character_id') = new_character
    ) THEN
      CONTINUE;
    END IF;

    IF actor IS NOT NULL AND new_user IS DISTINCT FROM actor THEN
      RAISE EXCEPTION 'roster can only add your own characters'
        USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.characters ch
      WHERE ch.id = new_character
        AND ch.user_id = new_user
    ) THEN
      RAISE EXCEPTION 'roster character is not owned by that user'
        USING ERRCODE = '42501';
    END IF;

    IF new_user IS DISTINCT FROM NEW.owner_id AND NOT EXISTS (
      SELECT 1
      FROM public.campaign_members m
      WHERE m.campaign_id = NEW.id
        AND m.user_id = new_user
    ) THEN
      RAISE EXCEPTION 'roster user has not joined this campaign'
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


--
-- Name: _official_power_rebuilt_mechanic_part_names(boolean, text, integer, text, text, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._official_power_rebuilt_mechanic_part_names(p_is_reaction boolean, p_action_type text, p_range_steps integer, p_area_type text, p_duration_type text, p_payload_duration jsonb, p_damage jsonb) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT array_remove(
    ARRAY[]::text[]
    || CASE WHEN COALESCE(p_is_reaction, false) THEN ARRAY['Power Reaction'] ELSE ARRAY[]::text[] END
    || CASE p_action_type
         WHEN 'quick' THEN ARRAY['Power Quick or Free Action']
         WHEN 'free' THEN ARRAY['Power Quick or Free Action']
         WHEN 'long3' THEN ARRAY['Power Long Action']
         WHEN 'long4' THEN ARRAY['Power Long Action']
         ELSE ARRAY[]::text[]
       END
    || CASE WHEN COALESCE(p_range_steps, 0) > 0 THEN ARRAY['Power Range'] ELSE ARRAY[]::text[] END
    || CASE p_area_type
         WHEN 'sphere' THEN ARRAY['Sphere of Effect']
         WHEN 'cylinder' THEN ARRAY['Cylinder of Effect']
         WHEN 'cone' THEN ARRAY['Cone of Effect']
         WHEN 'line' THEN ARRAY['Line of Effect']
         WHEN 'trail' THEN ARRAY['Trail of Effect']
         ELSE ARRAY[]::text[]
       END
    || CASE p_duration_type
         WHEN 'rounds' THEN ARRAY['Duration (Round)']
         WHEN 'minutes' THEN ARRAY['Duration (Minute)']
         WHEN 'hours' THEN ARRAY['Duration (Hour)']
         WHEN 'days' THEN ARRAY['Duration (Days)']
         WHEN 'permanent' THEN ARRAY['Duration (Permanent)']
         ELSE ARRAY[]::text[] END
    || CASE WHEN COALESCE((p_payload_duration->>'focus')::boolean, false)
         THEN ARRAY['Focus for Duration'] ELSE ARRAY[]::text[] END
    || CASE WHEN COALESCE((p_payload_duration->>'noHarm')::boolean, false)
         THEN ARRAY['No Harm or Adaptation for Duration'] ELSE ARRAY[]::text[] END
    || CASE WHEN COALESCE((p_payload_duration->>'endsOnActivation')::boolean, false)
         THEN ARRAY['Duration Ends On Activation'] ELSE ARRAY[]::text[] END
    || CASE WHEN COALESCE((p_payload_duration->>'sustain')::int, 0) > 0
         THEN ARRAY['Sustain for Duration'] ELSE ARRAY[]::text[] END
    || COALESCE(
         (
           SELECT array_agg(DISTINCT mapped.name)
           FROM jsonb_array_elements(COALESCE(p_damage, '[]'::jsonb)) AS d(elem)
           CROSS JOIN LATERAL (
             SELECT CASE lower(elem->>'type')
               WHEN 'fire' THEN 'Elemental Damage'
               WHEN 'cold' THEN 'Elemental Damage'
               WHEN 'ice' THEN 'Elemental Damage'
               WHEN 'lightning' THEN 'Elemental Damage'
               WHEN 'acid' THEN 'Elemental Damage'
               WHEN 'poison' THEN 'Poison or Necrotic Damage'
               WHEN 'necrotic' THEN 'Poison or Necrotic Damage'
               WHEN 'sonic' THEN 'Sonic Damage'
               WHEN 'spiritual' THEN 'Spiritual Damage'
               WHEN 'psychic' THEN 'Psychic Damage'
               WHEN 'physical' THEN 'Physical Damage'
               WHEN 'bludgeoning' THEN 'Physical Damage'
               WHEN 'piercing' THEN 'Physical Damage'
               WHEN 'slashing' THEN 'Physical Damage'
               WHEN 'magic' THEN 'Magic Damage'
               WHEN 'light' THEN 'Light Damage'
               ELSE NULL
             END AS name
           ) mapped
           WHERE mapped.name IS NOT NULL
             AND COALESCE(elem->>'type', 'none') <> 'none'
             AND COALESCE((elem->>'amount')::int, 0) > 0
             AND COALESCE((elem->>'size')::int, 0) >= 4
         ),
         ARRAY[]::text[]
       )
    || CASE
         WHEN COALESCE(
           (
             SELECT SUM(COALESCE((elem->>'amount')::int, 0))
             FROM jsonb_array_elements(COALESCE(p_damage, '[]'::jsonb)) AS d(elem)
             WHERE COALESCE(elem->>'type', 'none') <> 'none'
               AND COALESCE((elem->>'amount')::int, 0) > 0
               AND COALESCE((elem->>'size')::int, 0) >= 4
           ), 0) > 1
         AND COALESCE(
           (
             SELECT MAX(COALESCE((elem->>'size')::int, 0))
             FROM jsonb_array_elements(COALESCE(p_damage, '[]'::jsonb)) AS d(elem)
             WHERE COALESCE(elem->>'type', 'none') <> 'none'
               AND COALESCE((elem->>'amount')::int, 0) > 0
               AND COALESCE((elem->>'size')::int, 0) >= 4
           ), 0) >= 4
         THEN ARRAY['Power Split Damage Dice', 'Split Damage Dice']
         ELSE ARRAY[]::text[]
       END,
    NULL
  );
$$;


--
-- Name: add_campaign_character_relational(text, text, text, jsonb, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_owner_max_characters integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_campaign public.campaigns%ROWTYPE;
  v_character public.characters%ROWTYPE;
  v_roster jsonb;
  v_entry jsonb;
  v_document jsonb;
  v_now timestamp without time zone;
  v_visibility_updated boolean := false;
BEGIN
  IF nullif(p_actor_id,'') IS NULL OR nullif(p_campaign_id,'') IS NULL
     OR nullif(p_character_id,'') IS NULL
     OR jsonb_typeof(p_roster_entry) IS DISTINCT FROM 'object'
     OR p_max_campaign_characters < 1 OR p_owner_max_characters < 1 THEN
    RAISE EXCEPTION 'Invalid campaign add input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;
  IF v_campaign.owner_id IS DISTINCT FROM p_actor_id THEN
    RETURN jsonb_build_object('status','forbidden');
  END IF;

  SELECT * INTO v_character
  FROM public.characters
  WHERE id = p_character_id AND user_id = p_actor_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;
  IF p_expected_updated_at IS NOT NULL
     AND v_character.updated_at IS DISTINCT FROM
       (p_expected_updated_at::timestamptz AT TIME ZONE 'UTC') THEN
    RETURN jsonb_build_object('status','conflict');
  END IF;

  v_roster := CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
    THEN v_campaign.characters ELSE '[]'::jsonb END;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','already_in_campaign');
  END IF;
  IF jsonb_array_length(v_roster) >= p_max_campaign_characters THEN
    RETURN jsonb_build_object('status','campaign_full');
  END IF;
  IF (
    SELECT count(*) FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
  ) >= p_owner_max_characters THEN
    RETURN jsonb_build_object('status','character_limit');
  END IF;

  v_entry := p_roster_entry || jsonb_build_object(
    'userId', p_actor_id,
    'characterId', p_character_id
  );
  INSERT INTO public.campaign_members (campaign_id, user_id)
  VALUES (v_campaign.id, p_actor_id)
  ON CONFLICT (campaign_id, user_id) DO NOTHING;
  UPDATE public.campaigns
  SET characters = v_roster || jsonb_build_array(v_entry)
  WHERE id = v_campaign.id;

  IF coalesce(v_character.visibility,'private') NOT IN ('campaign','public') THEN
    v_document := public.get_character_relational_document(p_character_id);
    v_document := jsonb_set(v_document, '{visibility}', '"campaign"'::jsonb, true);
    v_now := greatest(
      clock_timestamp() AT TIME ZONE 'UTC',
      coalesce(v_character.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
        + interval '1 millisecond'
    )::timestamp(3);
    PERFORM public.apply_character_relational_document(p_character_id, v_document, v_now);
    v_visibility_updated := true;
  END IF;

  RETURN jsonb_build_object('status','updated','visibilityUpdated',v_visibility_updated);
END;
$$;


--
-- Name: apply_character_inventory_patch(text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_character_inventory_patch(p_character_id text, p_owner_id text, p_patch jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_op jsonb;
  v_bucket text;
  v_category text;
  v_slot text;
  v_row public.character_inventory;
  v_row_id uuid;
  v_item jsonb;
  v_expected jsonb;
  v_position integer;
  v_max integer;
  v_plan jsonb[] := ARRAY[]::jsonb[];
  v_step jsonb;
  v_created jsonb := '[]'::jsonb;
  v_type record;
  v_description record;
  v_name text;
  v_quantity integer;
  v_equipped boolean;
  v_cost numeric;
  v_inv_row record;
  v_current_pos integer;
BEGIN
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_patch->'ops') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'inventoryPatch must be an object with ops array'
      USING ERRCODE = '22023';
  END IF;

  -- Phase 1: validate every op (no writes).
  FOR v_op IN SELECT value FROM jsonb_array_elements(p_patch->'ops') LOOP
    IF v_op->>'op' NOT IN ('add','update','remove','reorder') THEN
      RAISE EXCEPTION 'Unknown inventory patch op %', v_op->>'op' USING ERRCODE = '22023';
    END IF;
    v_bucket := v_op->>'bucket';
    IF v_bucket NOT IN ('weapons','shields','armor','items','accessories','mainHand','offHand') THEN
      RAISE EXCEPTION 'Unknown inventory patch bucket %', v_bucket USING ERRCODE = '22023';
    END IF;
    SELECT p_category, p_slot INTO v_category, v_slot
    FROM public.inventory_patch_bucket_category(v_bucket);

    IF v_op->>'op' = 'add' THEN
      v_item := v_op->'item';
      IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'Add op requires item object' USING ERRCODE = '22023';
      END IF;
      IF nullif(v_op->>'inventoryRowId','') IS NOT NULL THEN
        PERFORM 1 FROM public.character_inventory
        WHERE inventory_row_id = (v_op->>'inventoryRowId')::uuid;
        IF FOUND THEN
          RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
        END IF;
      END IF;
      v_plan := v_plan || jsonb_build_object('op', v_op);
      CONTINUE;
    END IF;

    v_row_id := nullif(v_op->>'inventoryRowId','')::uuid;
    IF v_row_id IS NULL THEN
      RAISE EXCEPTION 'Inventory patch row requires inventoryRowId' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_row
    FROM public.character_inventory i
    WHERE i.character_id = p_character_id AND i.inventory_row_id = v_row_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    v_expected := v_op->'expected';
    IF jsonb_typeof(v_expected) IS DISTINCT FROM 'object'
       OR public.inventory_row_cas_snapshot(v_row) IS DISTINCT FROM v_expected THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    IF v_bucket IN ('mainHand','offHand') AND v_row.slot IS DISTINCT FROM v_bucket THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    IF v_row.category IS DISTINCT FROM v_category
       OR (v_slot IS NOT NULL AND v_row.slot IS DISTINCT FROM v_slot AND v_bucket NOT IN ('mainHand','offHand')) THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    v_plan := v_plan || jsonb_build_object('op', v_op, 'row', to_jsonb(v_row));
  END LOOP;

  -- Phase 2: apply (still same transaction; any failure aborts all).
  FOREACH v_step IN ARRAY v_plan LOOP
    v_op := v_step->'op';

    IF v_op->>'op' = 'add' THEN
      v_bucket := v_op->>'bucket';
      SELECT p_category, p_slot INTO v_category, v_slot
      FROM public.inventory_patch_bucket_category(v_bucket);
      v_item := v_op->'item';
      IF v_bucket IN ('mainHand','offHand') AND jsonb_typeof(v_item) = 'object' THEN
        v_item := v_item || jsonb_build_object('type', coalesce(v_item->>'type', 'weapon'));
      END IF;
      IF nullif(v_op->>'inventoryRowId','') IS NOT NULL AND jsonb_typeof(v_item) = 'object' THEN
        v_item := v_item || jsonb_build_object('inventoryRowId', v_op->>'inventoryRowId');
      END IF;
      IF nullif(v_op->>'position','') IS NOT NULL THEN
        v_position := (v_op->>'position')::integer;
        FOR v_inv_row IN
          SELECT inventory_row_id, position
          FROM public.character_inventory
          WHERE character_id = p_character_id AND category = v_category
            AND slot IS NOT DISTINCT FROM v_slot
            AND position >= v_position
          ORDER BY position DESC
        LOOP
          UPDATE public.character_inventory
          SET position = v_inv_row.position + 1
          WHERE inventory_row_id = v_inv_row.inventory_row_id;
        END LOOP;
      ELSE
        SELECT coalesce(max(position),0) + 1 INTO v_position
        FROM public.character_inventory
        WHERE character_id = p_character_id AND category = v_category
          AND slot IS NOT DISTINCT FROM v_slot;
      END IF;
      IF v_bucket IN ('mainHand','offHand') THEN
        DELETE FROM public.character_inventory
        WHERE character_id = p_character_id AND slot = v_bucket;
        v_position := 1;
      END IF;
      PERFORM public.insert_character_inventory_item(
        p_character_id, p_owner_id, v_category, v_position, v_item, v_slot);
      v_row_id := nullif(v_op->>'inventoryRowId','')::uuid;
      IF v_row_id IS NULL AND jsonb_typeof(v_item) = 'object' THEN
        v_row_id := nullif(v_item->>'inventoryRowId','')::uuid;
      END IF;
      IF v_row_id IS NULL THEN
        SELECT inventory_row_id INTO v_row_id
        FROM public.character_inventory
        WHERE character_id = p_character_id AND category = v_category
          AND slot IS NOT DISTINCT FROM v_slot AND position = v_position
        ORDER BY inventory_row_id LIMIT 1;
      END IF;
      IF v_row_id IS NOT NULL THEN
        v_created := v_created || jsonb_build_array(jsonb_build_object(
          'inventoryRowId', v_row_id,
          'bucket', v_bucket,
          'position', v_position
        ));
      END IF;
      CONTINUE;
    END IF;

    v_row := jsonb_populate_record(NULL::public.character_inventory, v_step->'row');
    v_row_id := v_row.inventory_row_id;
    v_item := coalesce(v_op->'item', '{}'::jsonb);

    IF v_op->>'op' = 'remove' THEN
      DELETE FROM public.character_inventory
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
      CONTINUE;
    END IF;

    IF v_op->>'op' = 'update' THEN
      v_quantity := v_row.quantity;
      v_equipped := v_row.equipped;
      v_name := v_row.name_snapshot;
      IF v_item ? 'quantity' THEN
        v_quantity := coalesce(nullif(v_item->>'quantity','')::integer, 1);
      END IF;
      IF v_item ? 'equipped' THEN
        v_equipped := coalesce(nullif(v_item->>'equipped','')::boolean, false);
      END IF;
      IF v_item ? 'name' THEN
        v_name := nullif(v_item->>'name', '');
      END IF;
      SELECT * INTO v_type FROM public.inventory_patch_field_clear(v_item, 'type');
      SELECT * INTO v_description FROM public.inventory_patch_field_clear(v_item, 'description');
      v_cost := v_row.cost_snapshot;
      IF v_item ? 'cost' THEN
        IF v_item->'cost' = 'null'::jsonb THEN
          v_cost := NULL;
        ELSE
          v_cost := nullif(v_item->>'cost','')::numeric;
        END IF;
      END IF;
      UPDATE public.character_inventory
      SET quantity = v_quantity,
          equipped = v_equipped,
          name_snapshot = v_name,
          custom_type = CASE WHEN v_type.p_clear THEN NULL
            WHEN v_type.p_value IS NOT NULL THEN v_type.p_value
            ELSE custom_type END,
          custom_description = CASE WHEN v_description.p_clear THEN NULL
            WHEN v_description.p_value IS NOT NULL THEN v_description.p_value
            ELSE custom_description END,
          cost_snapshot = v_cost
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
      CONTINUE;
    END IF;

    IF v_op->>'op' = 'reorder' THEN
      v_position := (v_op->>'position')::integer;
      IF v_position IS NULL OR v_position < 1 THEN
        RAISE EXCEPTION 'Reorder position must be >= 1' USING ERRCODE = '22023';
      END IF;

      SELECT position INTO v_current_pos
      FROM public.character_inventory
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
      END IF;
      IF v_current_pos = v_position THEN
        CONTINUE;
      END IF;

      SELECT coalesce(max(position), 0) INTO v_max
      FROM public.character_inventory
      WHERE character_id = p_character_id AND category = v_row.category
        AND slot IS NOT DISTINCT FROM v_row.slot;
      IF v_position > v_max + (CASE WHEN v_current_pos > v_position THEN 0 ELSE 1 END) THEN
        RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
      END IF;

      UPDATE public.character_inventory
      SET position = v_max + 100000
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;

      IF v_current_pos < v_position THEN
        FOR v_inv_row IN
          SELECT inventory_row_id, position
          FROM public.character_inventory
          WHERE character_id = p_character_id AND category = v_row.category
            AND slot IS NOT DISTINCT FROM v_row.slot
            AND position > v_current_pos AND position <= v_position
            AND inventory_row_id IS DISTINCT FROM v_row_id
          ORDER BY position ASC
        LOOP
          UPDATE public.character_inventory
          SET position = v_inv_row.position - 1
          WHERE inventory_row_id = v_inv_row.inventory_row_id;
        END LOOP;
      ELSIF v_current_pos > v_position THEN
        FOR v_inv_row IN
          SELECT inventory_row_id, position
          FROM public.character_inventory
          WHERE character_id = p_character_id AND category = v_row.category
            AND slot IS NOT DISTINCT FROM v_row.slot
            AND position >= v_position AND position < v_current_pos
            AND inventory_row_id IS DISTINCT FROM v_row_id
          ORDER BY position DESC
        LOOP
          UPDATE public.character_inventory
          SET position = v_inv_row.position + 1
          WHERE inventory_row_id = v_inv_row.inventory_row_id;
        END LOOP;
      END IF;

      UPDATE public.character_inventory
      SET position = v_position
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('createdRows', v_created);
END;
$$;


--
-- Name: apply_character_relational_document(text, jsonb, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_character_relational_document(p_character_id text, p_document jsonb, p_updated_at timestamp without time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_document jsonb;
  v_archetype_name text;
  v_previous_compat text;
  v_previous_relational text;
BEGIN
  -- characters.updated_at is timestamp(3); normalize before mirroring so the
  -- lock token is byte-for-byte identical in the row and compatibility JSON.
  p_updated_at := p_updated_at::timestamp(3);
  SELECT * INTO STRICT v_row FROM public.characters WHERE id = p_character_id;
  PERFORM public.assert_character_document_mapped(p_document);

  SELECT a.name INTO v_archetype_name
  FROM public.codex_archetypes a
  WHERE a.id = coalesce(
    nullif(p_document->>'archetypePathId',''),
    nullif(p_document#>>'{archetype,id}','')
  );
  v_archetype_name := coalesce(
    v_archetype_name,
    nullif(p_document#>>'{archetype,name}',''),
    initcap(replace(nullif(p_document#>>'{archetype,type}',''), '-', ' '))
  );

  v_document := p_document || jsonb_build_object(
    'id', v_row.id,
    'userId', v_row.user_id,
    'createdAt', coalesce(p_document->'createdAt', to_jsonb(v_row.created_at)),
    'updatedAt', to_jsonb(p_updated_at)
  );

  v_previous_compat := current_setting('app.character_compat_sync', true);
  v_previous_relational := current_setting('app.character_relational_write', true);
  PERFORM set_config('app.character_compat_sync','on',true);
  PERFORM set_config('app.character_relational_write','on',true);

  PERFORM public.sync_character_scalar_columns(p_character_id, v_document);
  PERFORM public.sync_character_cutover_scalars(p_character_id, v_document);
  PERFORM public.sync_character_child_tables(p_character_id, v_document);

  UPDATE public.characters SET
    updated_at = p_updated_at,
    name = coalesce(nullif(v_document->>'name',''), 'Unnamed'),
    level = coalesce(nullif(v_document->>'level','')::integer, 1),
    archetype_name = v_archetype_name,
    ancestry_name = coalesce(
      nullif(v_document#>>'{ancestry,name}',''),
      nullif(v_document->>'species','')
    ),
    status = nullif(v_document->>'status',''),
    visibility = coalesce(nullif(v_document->>'visibility',''), 'private')
  WHERE id = p_character_id;

  -- Rebuild the rollback mirror from the rows that were actually persisted.
  -- The projector can normalize aliases/defaults and deduplicate collections,
  -- so retaining the incoming document would immediately allow data to drift.
  v_document := public.get_character_relational_document(p_character_id);
  IF v_document IS NULL THEN
    RAISE EXCEPTION 'Character % not found after relational projection', p_character_id
      USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.characters SET data = v_document WHERE id = p_character_id;

  PERFORM set_config('app.character_compat_sync',coalesce(v_previous_compat,''),true);
  PERFORM set_config('app.character_relational_write',coalesce(v_previous_relational,''),true);
  RETURN v_document;
END;
$$;


--
-- Name: assert_account_create_quota(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assert_account_create_quota(p_user_id text, p_resource text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_role public."UserRole";
  v_limits record;
  v_count integer;
  v_max integer;
BEGIN
  IF nullif(p_user_id, '') IS NULL THEN
    RAISE EXCEPTION 'User id is required' USING ERRCODE = '22023';
  END IF;

  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_limits FROM public.role_policy_limits_for_role(v_role) LIMIT 1;

  CASE p_resource
    WHEN 'characters' THEN
      v_max := v_limits.max_characters;
      SELECT count(*)::integer INTO v_count
      FROM public.characters
      WHERE user_id = p_user_id;
    WHEN 'custom_powers' THEN
      v_max := v_limits.max_custom_powers;
      SELECT count(*)::integer INTO v_count
      FROM public.user_powers
      WHERE user_id = p_user_id;
    WHEN 'custom_techniques' THEN
      v_max := v_limits.max_custom_techniques;
      SELECT count(*)::integer INTO v_count
      FROM (
        SELECT 1 FROM public.user_techniques WHERE user_id = p_user_id
        UNION ALL
        SELECT 1 FROM public.user_empowered_techniques WHERE user_id = p_user_id
      ) AS technique_rows;
    WHEN 'custom_armaments' THEN
      v_max := v_limits.max_custom_armaments;
      SELECT count(*)::integer INTO v_count
      FROM public.user_items
      WHERE user_id = p_user_id;
    WHEN 'custom_creatures' THEN
      v_max := v_limits.max_custom_creatures;
      SELECT count(*)::integer INTO v_count
      FROM public.user_creatures
      WHERE user_id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Unknown quota resource %', p_resource USING ERRCODE = '22023';
  END CASE;

  IF v_count >= v_max THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ROLE_QUOTA_EXCEEDED',
      DETAIL = json_build_object(
        'resource', p_resource,
        'role', v_role::text,
        'currentCount', v_count,
        'maxAllowed', v_max
      )::text;
  END IF;
END;
$$;


--
-- Name: assert_character_document_mapped(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assert_character_document_mapped(p_document jsonb) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_bad text;
  v_shape record;
BEGIN
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character document must be an object' USING ERRCODE = '22023';
  END IF;
  SELECT key INTO v_bad FROM jsonb_object_keys(p_document) key
  WHERE key <> ALL (ARRAY[
    'id','userId','name','level','status','visibility','createdAt','updatedAt',
    'lastPlayedAt','portrait','portraitUrl','portrait_url','gender','xp',
    'experience','description','notes','namedNotes','backstory','appearance',
    'archetypeDesc','weight','height','age','abilities','baseAbilities',
    'ancestryAbilities','defenseVals','defenseSkills','healthPoints',
    'energyPoints','currentHealth','currentEnergy','actionPoints','health',
    'energy','speedBase','evasionBase','innateEnergy','skills','archetype',
    'archetypePathId','mart_prof','pow_prof','martialProficiency',
    'powerProficiency','mart_abil','pow_abil','archetypeChoices','feats',
    'archetypeFeats','techniques','powers','traits','traitUses',
    'traitCustomizations','stateUsesCurrent','unarmedProwess','equipment',
    'currency','trainingPointsSpent','proficiencies','allies',
    'organizations','speedDisplayUnit','libraryTabVisibility',
    'librarySectionVisibility','notesSectionOrder','notesSectionVisibility',
    'tempModifiers',
    'ancestry','species','conditions','health_energy_points','creationMode',
    'allTraits','_displayFeats','speciesTraits','defenses','defenseBonuses',
    'speed','evasion','armor'
  ]) LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Unmapped character key: %', v_bad USING ERRCODE = '22023';
  END IF;

  FOR v_shape IN SELECT * FROM (VALUES
    ('archetype', ARRAY['id','type']::text[]),
    ('ancestry', ARRAY['id','name','size','speed','selectedTraits','selectedFlaw',
      'selectedCharacteristic','mixed','speciesIds','speciesNames',
      'selectedSize','selectedSpeciesTraits','selectedFlawSpeciesId',
      'mixedPhysical','selectedSpeciesSkillIds','selectedSpeciesTraitChoices']::text[]),
    ('abilities', ARRAY['strength','vitality','agility','acuity','intelligence','charisma']::text[]),
    ('defenseVals', ARRAY['might','fortitude','reflex','discernment','mentalFortitude','resolve']::text[]),
    ('defenseSkills', ARRAY['might','fortitude','reflex','discernment','mentalFortitude','resolve']::text[]),
    ('libraryTabVisibility', ARRAY['powers','techniques','inventory','feats',
      'proficiencies','notes']::text[]),
    ('librarySectionVisibility', ARRAY['stateFeats','weapons','shields','armor']::text[]),
    ('notesSectionVisibility', ARRAY['physical','appearance','backstory',
      'archetypeDesc','generalNotes','customNotes']::text[]),
    ('tempModifiers', ARRAY['speed','evasion','damageReduction','criticalRange',
      'terminal','abilities','defenses','skills','applyAbilityToResourceMaxima']::text[]),
    ('equipment', ARRAY['mainHand','offHand','armor','weapons','shields','items',
      'accessories','inventory']::text[]),
    ('health', ARRAY['current','max']::text[]),
    ('energy', ARRAY['current','max']::text[]),
    ('health_energy_points', ARRAY['health','energy']::text[]),
    ('baseAbilities', ARRAY['strength','vitality','agility','acuity','intelligence','charisma']::text[]),
    ('ancestryAbilities', ARRAY['strength','vitality','agility','acuity','intelligence','charisma']::text[])
  ) s(collection, allowed_keys) LOOP
    IF p_document ? v_shape.collection AND p_document->v_shape.collection <> 'null'::jsonb
       AND jsonb_typeof(p_document->v_shape.collection) <> 'object' THEN
      RAISE EXCEPTION 'Character % must be an object', v_shape.collection
        USING ERRCODE = '22023';
    END IF;
    SELECT e.key INTO v_bad FROM jsonb_each(
      CASE WHEN jsonb_typeof(p_document->v_shape.collection) = 'object'
        THEN p_document->v_shape.collection ELSE '{}'::jsonb END
    ) e WHERE NOT e.key = ANY(v_shape.allowed_keys) LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'Unmapped character %.%', v_shape.collection, v_bad
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  FOR v_shape IN SELECT * FROM (VALUES
    ('feats', ARRAY['id','name','description','currentUses','customName','note']::text[]),
    ('archetypeFeats', ARRAY['id','name','description','currentUses','customName','note']::text[]),
    ('powers', ARRAY['id','name','innate','selectedVariantId']::text[]),
    ('techniques', ARRAY['id','name']::text[]),
    ('skills', ARRAY['id','name','skill_val','prof','selectedBaseSkillId',
      'ability','baseSkill','category']::text[]),
    ('traits', ARRAY['id','name']::text[]),
    ('conditions', ARRAY['name','level','decaying','description']::text[]),
    ('namedNotes', ARRAY['id','name','content','hidden']::text[]),
    ('proficiencies', ARRAY['kind','id','refId','name','damageType',
      'op1Level','op2Level','op3Level','baseTP','op1TP','op2TP','op3TP','custom']::text[])
  ) s(collection, allowed_keys) LOOP
    SELECT e.key INTO v_bad
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p_document->v_shape.collection) = 'array'
        THEN p_document->v_shape.collection ELSE '[]'::jsonb END
    ) item
    CROSS JOIN LATERAL jsonb_each(
      CASE WHEN jsonb_typeof(item.value) = 'object'
        THEN item.value ELSE '{}'::jsonb END
    ) e WHERE NOT e.key = ANY(v_shape.allowed_keys) LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'Unmapped character % entry key %', v_shape.collection, v_bad
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  SELECT e.key INTO v_bad FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document#>'{ancestry,mixedPhysical}') = 'object'
      THEN p_document#>'{ancestry,mixedPhysical}' ELSE '{}'::jsonb END
  ) e WHERE e.key <> ALL (ARRAY['aveHeight','aveWeight','adulthood','maxAge']) LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Unmapped mixedPhysical key %', v_bad
    USING ERRCODE = '22023'; END IF;
  SELECT e.key INTO v_bad FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document#>'{tempModifiers,abilities}') = 'object'
      THEN p_document#>'{tempModifiers,abilities}' ELSE '{}'::jsonb END
  ) e WHERE e.key <> ALL (ARRAY['strength','vitality','agility','acuity',
      'intelligence','charisma']) LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Unmapped temp ability %', v_bad
    USING ERRCODE = '22023'; END IF;
  SELECT e.key INTO v_bad FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document#>'{tempModifiers,defenses}') = 'object'
      THEN p_document#>'{tempModifiers,defenses}' ELSE '{}'::jsonb END
  ) e WHERE e.key <> ALL (ARRAY['might','fortitude','reflex','discernment',
      'mentalFortitude','resolve']) LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Unmapped temp defense %', v_bad
    USING ERRCODE = '22023'; END IF;

  IF p_document ? 'notesSectionOrder'
     AND p_document->'notesSectionOrder' <> 'null'::jsonb
     AND jsonb_typeof(p_document->'notesSectionOrder') <> 'array' THEN
    RAISE EXCEPTION 'Character notesSectionOrder must be an array'
      USING ERRCODE = '22023';
  END IF;
  SELECT value #>> '{}' INTO v_bad
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'notesSectionOrder') = 'array'
      THEN p_document->'notesSectionOrder' ELSE '[]'::jsonb END
  ) entry(value)
  WHERE jsonb_typeof(value) <> 'string'
     OR value #>> '{}' <> ALL (ARRAY[
       'physical','appearance','backstory','archetypeDesc','generalNotes','customNotes'
     ])
  LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Unmapped notes section order entry %', v_bad
    USING ERRCODE = '22023'; END IF;
END;
$$;


--
-- Name: assert_character_library_owner(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assert_character_library_owner() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE owner_id text;
BEGIN
  SELECT user_id INTO owner_id FROM public.characters WHERE id = NEW.character_id;
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Character not found' USING ERRCODE = '23503'; END IF;
  IF TG_TABLE_NAME = 'character_powers' THEN
    IF NEW.user_power_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_powers WHERE id = NEW.user_power_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Power belongs to another user' USING ERRCODE = '23514'; END IF;
  ELSIF TG_TABLE_NAME = 'character_techniques' THEN
    IF NEW.user_technique_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_techniques WHERE id = NEW.user_technique_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Technique belongs to another user' USING ERRCODE = '23514'; END IF;
    IF NEW.user_empowered_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_empowered_techniques WHERE id = NEW.user_empowered_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Empowered technique belongs to another user' USING ERRCODE = '23514'; END IF;
  ELSIF TG_TABLE_NAME = 'character_inventory' THEN
    IF NEW.user_item_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_items WHERE id = NEW.user_item_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Item belongs to another user' USING ERRCODE = '23514'; END IF;
  ELSIF TG_TABLE_NAME = 'character_species' THEN
    IF NEW.user_species_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_species WHERE id = NEW.user_species_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Species belongs to another user' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: auth_can_upload_profile_picture(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_can_upload_profile_picture() RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_profiles up
    join public.role_policies rp on rp.role = up.role
    where up.id = (select auth.uid())::text
      and coalesce((rp.permissions ->> 'can_upload_profile_picture')::boolean, false)
  );
$$;


--
-- Name: collapse_codex_source_name(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.collapse_codex_source_name(raw text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    SET search_path TO 'public'
    AS $$
  SELECT btrim(
    regexp_replace(
      coalesce(raw, ''),
      -- Same code points as CODEX_SOURCE_WHITESPACE_CODE_POINTS.
      -- Replace every run with one space, then btrim that space. That is
      -- trim-then-collapse for this set, including NBSP and line separators.
      -- btrim alone would remove only U+0020.
      '['
        || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32)
        || chr(160) || chr(5760)
        || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196)
        || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202)
        || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279)
        || ']+',
      ' ',
      'g'
    )
  );
$$;


--
-- Name: create_character_relational(text, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_character_relational(p_character_id text, p_document jsonb, p_client_request_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'auth'
    AS $$
DECLARE
  v_owner_id text := auth.uid()::text;
  v_existing_id text;
  v_now timestamp without time zone := clock_timestamp() AT TIME ZONE 'UTC';
  v_previous_relational text;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);

  PERFORM public.lock_user_profile_for_writes(v_owner_id);

  IF p_client_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.characters
    WHERE user_id = v_owner_id AND client_request_id = p_client_request_id;
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('status','replayed','id',v_existing_id);
    END IF;
  END IF;

  PERFORM public.assert_account_create_quota(v_owner_id, 'characters');

  v_previous_relational := current_setting('app.character_relational_write', true);
  PERFORM set_config('app.character_relational_write','on',true);
  INSERT INTO public.characters (
    id, user_id, data, created_at, updated_at, client_request_id,
    name, level, status, visibility
  ) VALUES (
    p_character_id, v_owner_id,
    p_document || jsonb_build_object(
      'id',p_character_id,'userId',v_owner_id,
      'createdAt',to_jsonb(v_now),'updatedAt',to_jsonb(v_now)
    ),
    v_now, v_now, p_client_request_id,
    coalesce(nullif(p_document->>'name',''),'Unnamed'),
    coalesce(nullif(p_document->>'level','')::integer,1),
    nullif(p_document->>'status',''),
    coalesce(nullif(p_document->>'visibility',''),'private')
  );
  PERFORM set_config('app.character_relational_write',coalesce(v_previous_relational,''),true);

  PERFORM public.apply_character_relational_document(p_character_id, p_document, v_now);
  RETURN jsonb_build_object('status','created','id',p_character_id);
EXCEPTION WHEN unique_violation THEN
  IF p_client_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.characters
    WHERE user_id = v_owner_id AND client_request_id = p_client_request_id;
  END IF;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('status','replayed','id',v_existing_id);
  END IF;
  RAISE;
END;
$$;


--
-- Name: get_campaign_character_relational_document(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_campaign_character_relational_document(p_campaign_id text, p_character_owner_id text, p_character_id text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'auth'
    AS $$
DECLARE
  v_viewer_id text := auth.uid()::text;
  v_campaign public.campaigns%ROWTYPE;
  v_character public.characters%ROWTYPE;
  v_document jsonb;
  v_visibility text;
BEGIN
  IF v_viewer_id IS NULL THEN
    RETURN jsonb_build_object('status','unauthorized');
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;

  IF v_campaign.owner_id IS DISTINCT FROM v_viewer_id THEN
    PERFORM 1
    FROM public.campaign_members
    WHERE campaign_id = p_campaign_id AND user_id = v_viewer_id
    FOR SHARE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('status','not_member');
    END IF;
  END IF;

  -- A stale roster entry must not expose a character after its owner leaves.
  -- The campaign owner is always a participant; every other owner needs a
  -- current membership row from the same locked campaign snapshot.
  IF v_campaign.owner_id IS DISTINCT FROM p_character_owner_id THEN
    PERFORM 1
    FROM public.campaign_members
    WHERE campaign_id = p_campaign_id AND user_id = p_character_owner_id
    FOR SHARE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('status','character_not_rostered');
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
        THEN v_campaign.characters ELSE '[]'::jsonb END
    ) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','character_not_rostered');
  END IF;

  SELECT * INTO v_character
  FROM public.characters
  WHERE id = p_character_id AND user_id = p_character_owner_id
  FOR SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  v_visibility := coalesce(v_character.visibility, 'private');
  IF v_visibility = 'private'
     AND v_viewer_id IS DISTINCT FROM p_character_owner_id
     AND v_viewer_id IS DISTINCT FROM v_campaign.owner_id THEN
    RETURN jsonb_build_object('status','private');
  END IF;

  v_document := public.get_character_relational_document(p_character_id);
  IF v_document IS NULL THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  RETURN jsonb_build_object('status','ok','character',v_document);
END;
$$;


--
-- Name: get_character_relational_document(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_character_relational_document(p_character_id text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
SELECT jsonb_strip_nulls(jsonb_build_object(
  'id', c.id,
  'userId', c.user_id,
  'name', c.name,
  'level', c.level,
  'status', c.status,
  'visibility', c.visibility,
  'createdAt', c.created_at,
  'updatedAt', c.updated_at,
  'lastPlayedAt', c.last_played_at,
  'experience', c.experience,
  'portrait', c.portrait,
  'gender', c.gender,
  'description', c.description,
  'notes', c.notes,
  'backstory', c.backstory,
  'appearance', c.appearance,
  'archetypeDesc', c.archetype_desc,
  'age', c.age,
  'height', c.height,
  'weight', c.weight,
  'currency', c.currency,
  'healthPoints', c.health_points,
  'energyPoints', c.energy_points,
  'innateEnergy', c.innate_energy,
  'trainingPointsSpent', c.training_points_spent,
  'currentHealth', c.current_health,
  'currentEnergy', c.current_energy,
  'actionPoints', c.action_points,
  'stateUsesCurrent', c.state_uses_current,
  'unarmedProwess', c.unarmed_prowess,
  'speedBase', c.speed_base,
  'evasionBase', c.evasion_base,
  'pow_prof', c.pow_prof,
  'mart_prof', c.mart_prof,
  'pow_abil', c.pow_abil,
  'mart_abil', c.mart_abil,
  'archetypePathId', coalesce(c.archetype_path_id_snapshot,c.archetype_path_id),
  'archetype', CASE WHEN c.archetype_source_id IS NOT NULL
                         OR c.archetype_category IS NOT NULL
    THEN jsonb_strip_nulls(jsonb_build_object(
      'id', c.archetype_source_id, 'type', c.archetype_category)) END,
  'abilities', jsonb_strip_nulls(jsonb_build_object(
    'strength', c.ability_strength, 'vitality', c.ability_vitality,
    'agility', c.ability_agility, 'acuity', c.ability_acuity,
    'intelligence', c.ability_intelligence, 'charisma', c.ability_charisma)),
  'defenseVals', jsonb_strip_nulls(jsonb_build_object(
    'might', c.defense_might, 'fortitude', c.defense_fortitude,
    'reflex', c.defense_reflex, 'discernment', c.defense_discernment,
    'mentalFortitude', c.defense_mental_fortitude, 'resolve', c.defense_resolve)),
  'ancestry', CASE WHEN c.ancestry_id_snapshot IS NOT NULL
                         OR c.ancestry_name_snapshot IS NOT NULL
    THEN jsonb_strip_nulls(jsonb_build_object(
      'id', c.ancestry_id_snapshot,
      'name', c.ancestry_name_snapshot,
      'size', c.ancestry_size,
      'speed', c.ancestry_speed,
      'mixed', CASE WHEN c.ancestry_mixed THEN true END,
      'selectedSize', c.ancestry_selected_size,
      'selectedFlawSpeciesId', c.ancestry_flaw_species_source_id,
      'mixedPhysical', CASE WHEN num_nonnulls(c.ancestry_mixed_height,
        c.ancestry_mixed_weight,c.ancestry_mixed_adulthood,
        c.ancestry_mixed_max_age) > 0 THEN jsonb_strip_nulls(jsonb_build_object(
          'aveHeight',c.ancestry_mixed_height,
          'aveWeight',c.ancestry_mixed_weight,
          'adulthood',c.ancestry_mixed_adulthood,
          'maxAge',c.ancestry_mixed_max_age)) END,
      'speciesIds', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(s.source_id ORDER BY s.position),'[]'::jsonb)
         FROM public.character_species s WHERE s.character_id=c.id) END,
      'speciesNames', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(s.name_snapshot ORDER BY s.position),'[]'::jsonb)
         FROM public.character_species s WHERE s.character_id=c.id) END,
      'selectedTraits', (SELECT coalesce(jsonb_agg(t.source_id ORDER BY t.position),'[]'::jsonb)
        FROM public.character_traits t WHERE t.character_id=c.id
          AND t.selection_role='ancestry'),
      'selectedFlaw', (SELECT t.source_id FROM public.character_traits t
        WHERE t.character_id=c.id AND t.selection_role='flaw'
        ORDER BY t.position LIMIT 1),
      'selectedCharacteristic', (SELECT t.source_id FROM public.character_traits t
        WHERE t.character_id=c.id AND t.selection_role='characteristic'
        ORDER BY t.position LIMIT 1),
      'selectedSpeciesTraits', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(t.source_id ORDER BY t.species_position),'[]'::jsonb)
         FROM public.character_traits t WHERE t.character_id=c.id
           AND t.selection_role='species') END,
      'selectedSpeciesSkillIds', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(s.source_id ORDER BY s.species_selection_position),'[]'::jsonb)
         FROM public.character_skills s WHERE s.character_id=c.id
           AND s.species_selected) END,
      'selectedSpeciesTraitChoices',
        (SELECT jsonb_object_agg(t.option_parent_source_id,t.source_id)
         FROM public.character_traits t WHERE t.character_id=c.id
           AND t.selection_role='choice')
    )) END
) || jsonb_build_object(
  'feats', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',f.source_id,'name',f.name_snapshot,
      'description',f.description_snapshot,'currentUses',f.current_uses,
      'customName',f.custom_name,'note',f.note)) ORDER BY f.position),'[]'::jsonb)
    FROM public.character_feats f WHERE f.character_id=c.id AND f.feat_kind='character'),
  'archetypeFeats', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',f.source_id,'name',f.name_snapshot,
      'description',f.description_snapshot,'currentUses',f.current_uses,
      'customName',f.custom_name,'note',f.note)) ORDER BY f.position),'[]'::jsonb)
    FROM public.character_feats f WHERE f.character_id=c.id AND f.feat_kind='archetype'),
  'skills', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',s.source_id,'name',s.name_snapshot,'skill_val',s.skill_val,
      'prof',s.proficient,'ability',s.selected_ability,
      'selectedBaseSkillId',s.selected_base_skill_source_id,
      'category',s.category_snapshot,'baseSkill',s.base_skill_snapshot))
      ORDER BY s.position),'[]'::jsonb)
    FROM public.character_skills s WHERE s.character_id=c.id AND s.selection_present),
  'powers', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',p.source_id,'name',p.name_snapshot,'innate',p.innate,
      'selectedVariantId',p.selected_variant_id)) ORDER BY p.position),'[]'::jsonb)
    FROM public.character_powers p WHERE p.character_id=c.id),
  'techniques', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',t.source_id,'name',t.name_snapshot)) ORDER BY t.position),'[]'::jsonb)
    FROM public.character_techniques t WHERE t.character_id=c.id),
  'traits', (SELECT jsonb_agg(coalesce(t.name_snapshot,t.source_id) ORDER BY t.position)
    FROM public.character_traits t WHERE t.character_id=c.id AND t.selection_role='owned'),
  'traitUses', (SELECT jsonb_object_agg(t.name_snapshot,t.current_uses)
    FROM public.character_traits t WHERE t.character_id=c.id AND t.selection_role='uses'),
  'traitCustomizations', (SELECT jsonb_object_agg(t.source_id,
      jsonb_strip_nulls(jsonb_build_object('customName',t.custom_name,'note',t.note)))
    FROM public.character_traits t WHERE t.character_id=c.id
      AND t.selection_role='customization'),
  'conditions', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'name',x.name,'level',x.level,'decaying',x.decaying,
      'description',x.description)) ORDER BY x.position),'[]'::jsonb)
    FROM public.character_conditions x WHERE x.character_id=c.id),
  'namedNotes', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',n.note_id,'name',n.name,'content',n.content,
      'hidden',n.hidden)) ORDER BY n.position),'[]'::jsonb)
    FROM public.character_named_notes n WHERE n.character_id=c.id),
  'archetypeChoices', (SELECT jsonb_object_agg(a.milestone_level::text,a.choice)
    FROM public.character_archetype_choices a WHERE a.character_id=c.id),
  'proficiencies', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'kind',p.kind,'id',p.source_id,'refId',p.ref_id,'name',p.name,
      'damageType',p.damage_type,'op1Level',p.op_1_level,
      'op2Level',p.op_2_level,'op3Level',p.op_3_level,
      'baseTP',p.base_tp,'op1TP',p.op_1_tp,'op2TP',p.op_2_tp,
      'op3TP',p.op_3_tp,'custom',CASE WHEN p.custom THEN true END))
      ORDER BY p.position),'[]'::jsonb)
    FROM public.character_proficiencies p WHERE p.character_id=c.id),
  'equipment', jsonb_build_object(
    'mainHand', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot))
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.slot='mainHand' ORDER BY i.position LIMIT 1),
    'offHand', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot))
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.slot='offHand' ORDER BY i.position LIMIT 1),
    'weapons', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='weapon' AND i.slot IS NULL),
    'shields', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='shield' AND i.slot IS NULL),
    'armor', coalesce(
      (SELECT jsonb_strip_nulls(jsonb_build_object(
        'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
        'equipped',CASE WHEN i.equipped THEN true END,
        'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
        'type',i.custom_type,'description',i.custom_description,
        'cost',i.cost_snapshot))
       FROM public.character_inventory i WHERE i.character_id=c.id
         AND i.category='armor' AND i.slot='armor'
       ORDER BY i.position LIMIT 1),
      (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
        'equipped',CASE WHEN i.equipped THEN true END,
        'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
        'type',i.custom_type,'description',i.custom_description,
        'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
       FROM public.character_inventory i WHERE i.character_id=c.id
         AND i.category='armor' AND i.slot IS NULL)
    ),
    'items', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='equipment' AND i.slot IS NULL),
    'accessories', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'inventoryRowId',i.inventory_row_id,'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='accessory' AND i.slot IS NULL)
  ),
  'baseAbilities', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'strength',a.strength,'vitality',a.vitality,'agility',a.agility,
      'acuity',a.acuity,'intelligence',a.intelligence,'charisma',a.charisma))
    FROM public.character_ability_components a WHERE a.character_id=c.id
      AND a.component_kind='base'),
  'ancestryAbilities', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'strength',a.strength,'vitality',a.vitality,'agility',a.agility,
      'acuity',a.acuity,'intelligence',a.intelligence,'charisma',a.charisma))
    FROM public.character_ability_components a WHERE a.character_id=c.id
      AND a.component_kind='ancestry'),
  'allies', (SELECT jsonb_agg(a.name ORDER BY a.position)
    FROM public.character_affiliations a WHERE a.character_id=c.id
      AND a.affiliation_kind='ally'),
  'organizations', (SELECT jsonb_agg(a.name ORDER BY a.position)
    FROM public.character_affiliations a WHERE a.character_id=c.id
      AND a.affiliation_kind='organization'),
  'speedDisplayUnit', c.speed_display_unit,
  'libraryTabVisibility', CASE WHEN num_nonnulls(
    c.library_powers_visible,c.library_techniques_visible,
    c.library_inventory_visible,c.library_feats_visible,
    c.library_proficiencies_visible,c.library_notes_visible) > 0
    THEN jsonb_strip_nulls(jsonb_build_object(
      'powers',c.library_powers_visible,
      'techniques',c.library_techniques_visible,
      'inventory',c.library_inventory_visible,
      'feats',c.library_feats_visible,
      'proficiencies',c.library_proficiencies_visible,
      'notes',c.library_notes_visible)) END,
  'librarySectionVisibility', (SELECT jsonb_object_agg(p.section_id,p.visible)
    FROM public.character_library_section_preferences p WHERE p.character_id=c.id),
  'notesSectionOrder', (SELECT jsonb_agg(p.section_id ORDER BY p.position)
    FROM public.character_note_section_preferences p
    WHERE p.character_id=c.id AND p.position IS NOT NULL),
  'notesSectionVisibility', (SELECT jsonb_object_agg(p.section_id,p.visible)
    FROM public.character_note_section_preferences p
    WHERE p.character_id=c.id AND p.visible IS NOT NULL),
  'tempModifiers', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'speed',t.speed,'evasion',t.evasion,
      'damageReduction',t.damage_reduction,
      'criticalRange',t.critical_range,'terminal',t.terminal,
      'applyAbilityToResourceMaxima',t.apply_ability_to_resource_maxima,
      'abilities',CASE WHEN num_nonnulls(t.ability_strength,t.ability_vitality,
        t.ability_agility,t.ability_acuity,t.ability_intelligence,
        t.ability_charisma)>0 THEN jsonb_strip_nulls(jsonb_build_object(
          'strength',t.ability_strength,'vitality',t.ability_vitality,
          'agility',t.ability_agility,'acuity',t.ability_acuity,
          'intelligence',t.ability_intelligence,'charisma',t.ability_charisma)) END,
      'defenses',CASE WHEN num_nonnulls(t.defense_might,t.defense_fortitude,
        t.defense_reflex,t.defense_discernment,t.defense_mental_fortitude,
        t.defense_resolve)>0 THEN jsonb_strip_nulls(jsonb_build_object(
          'might',t.defense_might,'fortitude',t.defense_fortitude,
          'reflex',t.defense_reflex,'discernment',t.defense_discernment,
          'mentalFortitude',t.defense_mental_fortitude,
          'resolve',t.defense_resolve)) END,
      'skills',(SELECT jsonb_object_agg(coalesce(s.source_id,s.name_snapshot),s.temp_delta)
        FROM public.character_skills s WHERE s.character_id=c.id
          AND s.temp_delta IS NOT NULL)
    )) FROM public.character_temp_modifiers t WHERE t.character_id=c.id)
))
FROM public.characters c WHERE c.id = p_character_id;
$$;


--
-- Name: insert_character_inventory_item(text, text, text, integer, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_character_inventory_item(p_character_id text, p_owner_id text, p_category text, p_position integer, p_item jsonb, p_slot text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_source_id text;
  v_name text;
  v_source_kind text;
  v_reference_id text;
BEGIN
  IF jsonb_typeof(p_item) NOT IN ('object','string') THEN
    RAISE EXCEPTION 'Malformed character inventory item at %/%', p_category, p_position
      USING ERRCODE = '22023';
  END IF;
  IF p_item ? 'properties' AND p_item->'properties' <> '[]'::jsonb THEN
    RAISE EXCEPTION 'Non-empty inventory properties need a typed destination'
      USING ERRCODE = '22023';
  END IF;
  v_source_id := nullif(p_item->>'id','');
  v_name := coalesce(nullif(p_item->>'name',''),
    CASE WHEN jsonb_typeof(p_item) = 'string' THEN p_item #>> '{}' END);
  IF v_source_id LIKE 'custom-%' THEN
    v_source_kind := 'custom';
    v_reference_id := NULL;
  ELSE
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('item', v_source_id, v_name, p_owner_id);
  END IF;

  INSERT INTO public.character_inventory (
    character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot,
    slot, official_item_id, user_item_id, codex_equipment_id, quantity,
    equipped, custom_type, custom_description, cost_snapshot
  ) VALUES (
    p_character_id, coalesce(nullif(p_item->>'inventoryRowId','')::uuid, gen_random_uuid()),
    p_category, p_position, v_source_kind, v_source_id, v_name,
    p_slot,
    CASE WHEN v_source_kind = 'official' THEN v_reference_id END,
    CASE WHEN v_source_kind = 'user' THEN v_reference_id END,
    CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
    coalesce(nullif(p_item->>'quantity','')::integer, 1),
    coalesce(nullif(p_item->>'equipped','')::boolean, false),
    p_item->>'type', p_item->>'description',
    nullif(p_item->>'cost','')::numeric
  );
END;
$$;


--
-- Name: insert_character_trait_selection(text, integer, text, text, text, smallint, text, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_character_trait_selection(p_character_id text, p_position integer, p_role text, p_source_id text, p_name text DEFAULT NULL::text, p_species_position smallint DEFAULT NULL::smallint, p_parent_source_id text DEFAULT NULL::text, p_current_uses integer DEFAULT NULL::integer, p_custom_name text DEFAULT NULL::text, p_note text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_trait_id text;
  v_name text;
  v_matches integer;
BEGIN
  IF p_source_id IS NOT NULL THEN
    SELECT id, name INTO v_trait_id, v_name
    FROM public.codex_traits WHERE id = p_source_id;
  ELSIF p_name IS NOT NULL THEN
    SELECT count(*)::integer, min(id), min(name)
    INTO v_matches, v_trait_id, v_name
    FROM public.codex_traits WHERE lower(name) = lower(p_name);
    IF v_matches <> 1 THEN v_trait_id := NULL; END IF;
  END IF;
  INSERT INTO public.character_traits (
    character_id, position, selection_role, species_position, trait_id,
    source_id, name_snapshot, option_parent_trait_id,
    option_parent_source_id, current_uses, custom_name, note
  ) VALUES (
    p_character_id, p_position, p_role, p_species_position, v_trait_id,
    p_source_id, coalesce(p_name,v_name),
    (SELECT id FROM public.codex_traits WHERE id = p_parent_source_id),
    p_parent_source_id, p_current_uses, p_custom_name, p_note
  );
END;
$$;


--
-- Name: insert_table_row_from_jsonb_keys(regclass, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_table_row_from_jsonb_keys(p_target regclass, p_row jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $_$
DECLARE
  v_cols text[] := '{}';
  v_selects text[] := '{}';
  v_col record;
  v_sql text;
BEGIN
  IF jsonb_typeof(p_row) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Row payload must be a JSON object' USING ERRCODE = '22023';
  END IF;

  FOR v_col IN
    SELECT a.attname AS column_name
    FROM pg_attribute a
    WHERE a.attrelid = p_target
      AND a.attnum > 0
      AND NOT a.attisdropped
  LOOP
    IF p_row ? v_col.column_name THEN
      v_cols := array_append(v_cols, quote_ident(v_col.column_name));
      v_selects := array_append(
        v_selects,
        format('(_src.v_populated).%I', v_col.column_name)
      );
    END IF;
  END LOOP;

  IF coalesce(array_length(v_cols, 1), 0) < 1 THEN
    RAISE EXCEPTION 'Row payload has no insertable columns' USING ERRCODE = '22023';
  END IF;

  v_sql := format(
    'INSERT INTO %s (%s) SELECT %s FROM (SELECT jsonb_populate_record(null::%s, $1) AS v_populated) AS _src',
    p_target,
    array_to_string(v_cols, ', '),
    array_to_string(v_selects, ', '),
    p_target
  );
  EXECUTE v_sql USING p_row;
END;
$_$;


--
-- Name: insert_user_library_row_with_quota(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_user_library_row_with_quota(p_library_kind text, p_row jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'auth'
    AS $$
DECLARE
  v_owner_id text := auth.uid()::text;
  v_row_user_id text := coalesce(nullif(p_row->>'user_id',''), nullif(p_row->>'userId',''));
  v_id text := coalesce(nullif(p_row->>'id',''), nullif(p_row->>'docId',''));
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF v_row_user_id IS DISTINCT FROM v_owner_id THEN
    RAISE EXCEPTION 'Row user_id must match caller' USING ERRCODE = '42501';
  END IF;
  IF nullif(v_id,'') IS NULL THEN
    RAISE EXCEPTION 'Row id is required' USING ERRCODE = '22023';
  END IF;

  PERFORM public.lock_user_profile_for_writes(v_owner_id);

  CASE p_library_kind
    WHEN 'powers' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_powers');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_powers'::regclass, p_row);
    WHEN 'techniques' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_techniques');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_techniques'::regclass, p_row);
    WHEN 'empowered-techniques' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_techniques');
      PERFORM public.insert_table_row_from_jsonb_keys(
        'public.user_empowered_techniques'::regclass, p_row
      );
    WHEN 'items' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_armaments');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_items'::regclass, p_row);
    WHEN 'creatures' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_creatures');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_creatures'::regclass, p_row);
    WHEN 'species' THEN
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_species'::regclass, p_row);
    ELSE
      RAISE EXCEPTION 'Unknown library kind %', p_library_kind USING ERRCODE = '22023';
  END CASE;

  RETURN jsonb_build_object('id', v_id);
END;
$$;


--
-- Name: inventory_patch_bucket_category(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_patch_bucket_category(p_bucket text, OUT p_category text, OUT p_slot text) RETURNS record
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT
    CASE p_bucket
      WHEN 'weapons' THEN 'weapon'
      WHEN 'shields' THEN 'shield'
      WHEN 'armor' THEN 'armor'
      WHEN 'items' THEN 'equipment'
      WHEN 'accessories' THEN 'accessory'
      WHEN 'mainHand' THEN NULL
      WHEN 'offHand' THEN NULL
      ELSE NULL
    END,
    CASE
      WHEN p_bucket IN ('mainHand', 'offHand') THEN p_bucket
      ELSE NULL
    END;
$$;


--
-- Name: inventory_patch_field_clear(jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_patch_field_clear(p_item jsonb, p_key text, OUT p_clear boolean, OUT p_value text) RETURNS record
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT
    (p_item ? p_key AND (p_item->p_key = 'null'::jsonb OR p_item->>p_key = '')),
    CASE
      WHEN NOT (p_item ? p_key) THEN NULL
      WHEN p_item->p_key = 'null'::jsonb OR p_item->>p_key = '' THEN NULL
      ELSE p_item->>p_key
    END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: character_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_inventory (
    character_id text NOT NULL,
    category text NOT NULL,
    "position" integer NOT NULL,
    source_kind text NOT NULL,
    source_id text,
    name_snapshot text,
    slot text,
    official_item_id text,
    user_item_id text,
    codex_equipment_id text,
    quantity integer DEFAULT 1 NOT NULL,
    equipped boolean DEFAULT false NOT NULL,
    custom_type text,
    custom_description text,
    cost_snapshot numeric,
    inventory_row_id uuid DEFAULT gen_random_uuid() NOT NULL,
    CONSTRAINT character_inventory_category_check CHECK ((category = ANY (ARRAY['weapon'::text, 'shield'::text, 'armor'::text, 'equipment'::text, 'accessory'::text]))),
    CONSTRAINT character_inventory_check CHECK ((num_nonnulls(official_item_id, user_item_id, codex_equipment_id) <= 1)),
    CONSTRAINT character_inventory_position_check CHECK (("position" > 0)),
    CONSTRAINT character_inventory_quantity_check CHECK ((quantity >= 0)),
    CONSTRAINT character_inventory_source_kind_check CHECK ((source_kind = ANY (ARRAY['official'::text, 'user'::text, 'codex'::text, 'custom'::text, 'unresolved'::text])))
);


--
-- Name: inventory_row_cas_snapshot(public.character_inventory); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_row_cas_snapshot(p_row public.character_inventory) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT jsonb_build_object(
    'quantity', p_row.quantity,
    'equipped', p_row.equipped,
    'name', coalesce(p_row.name_snapshot, ''),
    'type', coalesce(p_row.custom_type, ''),
    'description', coalesce(p_row.custom_description, ''),
    'cost', p_row.cost_snapshot
  );
$$;


--
-- Name: join_campaign_character_relational(text, text, text, jsonb, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.join_campaign_character_relational(p_actor_id text, p_invite_code text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_max_players_per_campaign integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_campaign public.campaigns%ROWTYPE;
  v_character public.characters%ROWTYPE;
  v_roster jsonb;
  v_entry jsonb;
  v_document jsonb;
  v_now timestamp without time zone;
  v_non_owner_members integer;
  v_already_member boolean;
  v_visibility_updated boolean := false;
BEGIN
  IF nullif(p_actor_id,'') IS NULL OR nullif(p_invite_code,'') IS NULL
     OR nullif(p_character_id,'') IS NULL
     OR jsonb_typeof(p_roster_entry) IS DISTINCT FROM 'object'
     OR p_max_campaign_characters < 1 OR p_max_players_per_campaign < 0 THEN
    RAISE EXCEPTION 'Invalid campaign join input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE invite_code = p_invite_code
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;

  SELECT * INTO v_character
  FROM public.characters
  WHERE id = p_character_id AND user_id = p_actor_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  IF p_expected_updated_at IS NOT NULL
     AND v_character.updated_at IS DISTINCT FROM
       (p_expected_updated_at::timestamptz AT TIME ZONE 'UTC') THEN
    RETURN jsonb_build_object('status','conflict');
  END IF;

  v_roster := CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
    THEN v_campaign.characters ELSE '[]'::jsonb END;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','already_in_campaign');
  END IF;
  IF jsonb_array_length(v_roster) >= p_max_campaign_characters THEN
    RETURN jsonb_build_object('status','campaign_full');
  END IF;

  IF p_actor_id IS DISTINCT FROM v_campaign.owner_id
     AND EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
       WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
     ) THEN
    RETURN jsonb_build_object('status','character_limit');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = v_campaign.id AND user_id = p_actor_id
  ) INTO v_already_member;

  SELECT count(*) INTO v_non_owner_members
  FROM (
    SELECT user_id
    FROM public.campaign_members
    WHERE campaign_id = v_campaign.id
    UNION
    SELECT coalesce(entry->>'userId', entry->>'user_id')
    FROM jsonb_array_elements(v_roster) AS roster(entry)
  ) AS members(user_id)
  WHERE user_id IS NOT NULL AND user_id <> v_campaign.owner_id;

  IF p_actor_id IS DISTINCT FROM v_campaign.owner_id
     AND NOT v_already_member
     AND v_non_owner_members >= p_max_players_per_campaign THEN
    RETURN jsonb_build_object('status','player_limit');
  END IF;

  v_entry := p_roster_entry || jsonb_build_object(
    'userId', p_actor_id,
    'characterId', p_character_id
  );
  INSERT INTO public.campaign_members (campaign_id, user_id)
  VALUES (v_campaign.id, p_actor_id)
  ON CONFLICT (campaign_id, user_id) DO NOTHING;
  UPDATE public.campaigns
  SET characters = v_roster || jsonb_build_array(v_entry)
  WHERE id = v_campaign.id;

  IF coalesce(v_character.visibility,'private') NOT IN ('campaign','public') THEN
    v_document := public.get_character_relational_document(p_character_id);
    v_document := jsonb_set(v_document, '{visibility}', '"campaign"'::jsonb, true);
    v_now := greatest(
      clock_timestamp() AT TIME ZONE 'UTC',
      coalesce(v_character.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
        + interval '1 millisecond'
    )::timestamp(3);
    PERFORM public.apply_character_relational_document(p_character_id, v_document, v_now);
    v_visibility_updated := true;
  END IF;

  RETURN jsonb_build_object(
    'status','updated',
    'campaignId',v_campaign.id,
    'visibilityUpdated',v_visibility_updated
  );
END;
$$;


--
-- Name: lock_user_profile_for_writes(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lock_user_profile_for_writes(p_user_id text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
BEGIN
  IF nullif(p_user_id, '') IS NULL THEN
    RAISE EXCEPTION 'User id is required' USING ERRCODE = '22023';
  END IF;
  PERFORM id
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;


--
-- Name: map_feat_tag_phase1(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.map_feat_tag_phase1(raw text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  tag text := TRIM(raw);
BEGIN
  IF tag = '' THEN
    RETURN NULL;
  END IF;

  RETURN CASE tag
    WHEN 'State' THEN NULL
    WHEN 'Defensive' THEN NULL
    WHEN 'Combat' THEN NULL
    WHEN 'Buff' THEN NULL
    WHEN 'Debuff' THEN NULL
    WHEN 'Situational' THEN NULL
    WHEN 'Aggressive' THEN NULL
    WHEN 'Energy' THEN NULL
    WHEN 'Damage' THEN NULL
    WHEN 'Defense' THEN NULL
    WHEN 'Attack' THEN NULL
    WHEN 'Control' THEN NULL
    WHEN 'Re-Roll' THEN 'Re-roll'
    WHEN 'Reroll' THEN 'Re-roll'
    WHEN 'skill' THEN 'Skill'
    WHEN 'Movie Action' THEN 'Move Action'
    WHEN 'Crafting' THEN 'Craft'
    WHEN 'Brew' THEN 'Craft'
    WHEN 'Brews' THEN 'Craft'
    WHEN 'Grappling' THEN 'Grapple'
    WHEN 'Stunned' THEN 'Stun'
    WHEN 'Frightened' THEN 'Frighten'
    WHEN 'Innate Power' THEN 'Innate'
    WHEN 'Attack Roll Increase' THEN 'Attack Bonus'
    WHEN 'Attack/Potency Increase' THEN 'Attack Bonus'
    WHEN 'Attack Increase' THEN 'Attack Bonus'
    WHEN 'Defense Bonus' THEN 'Defense Increase'
    WHEN 'Damage Bonus' THEN 'Damage Increase'
    WHEN 'Potency Increase' THEN 'Potency Bonus'
    WHEN 'Powered Martial' THEN 'Hybrid'
    WHEN 'Empowered Martial' THEN 'Hybrid'
    WHEN 'Extra Attack' THEN 'Multi-Attack'
    WHEN 'Melee Attack' THEN 'Melee'
    WHEN 'Ranged Attack' THEN 'Ranged'
    WHEN 'Weapon Attack' THEN 'Weapon'
    WHEN 'Sense' THEN 'Perception'
    WHEN 'Senses' THEN 'Perception'
    WHEN 'Perceive' THEN 'Perception'
    WHEN 'Detect' THEN 'Perception'
    WHEN 'Hide' THEN 'Stealth'
    WHEN 'Obscurement' THEN 'Obscured'
    WHEN 'Element' THEN 'Elemental Damage'
    WHEN 'Charisma Bonus' THEN 'Ability Bonus'
    WHEN 'Strength Bonus' THEN 'Ability Bonus'
    WHEN 'Might Bonus' THEN 'Ability Bonus'
    WHEN 'Acuity Bonus' THEN 'Ability Bonus'
    WHEN 'Vitality Bonus' THEN 'Ability Bonus'
    WHEN 'Agility' THEN 'Ability Bonus'
    WHEN 'Strength' THEN 'Ability Bonus'
    WHEN 'Charisma Skill' THEN 'Skill Bonus'
    WHEN 'Intelligence Skill' THEN 'Skill Bonus'
    WHEN 'Strength Skill' THEN 'Skill Bonus'
    WHEN 'Mental Skill' THEN 'Skill Bonus'
    WHEN 'Skill Check' THEN 'Skill Roll'
  ELSE tag
  END;
END;
$$;


--
-- Name: map_feat_tag_phase2(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.map_feat_tag_phase2(raw text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  tag text := map_feat_tag_phase1(raw);
BEGIN
  IF tag IS NULL THEN RETURN NULL; END IF;
  RETURN CASE tag
    WHEN 'Critical' THEN 'Critical Hit'
    WHEN 'Major Critical Hit' THEN 'Critical Hit'
    WHEN 'Critical Range Reduction' THEN 'Critical Range'
    WHEN 'Bludgeoning Damage' THEN 'Physical Damage'
    WHEN 'Piercing Damage' THEN 'Physical Damage'
    WHEN 'Slashing Damage' THEN 'Physical Damage'
    WHEN 'Fire Damage' THEN 'Elemental Damage'
    WHEN 'Recovery Time' THEN 'Recovery'
    WHEN 'Full Recovery' THEN 'Recovery'
    WHEN 'Partial Recovery' THEN 'Recovery'
    WHEN 'Convince' THEN 'Social'
    WHEN 'Negotiate' THEN 'Social'
    WHEN 'Skill' THEN 'Skill Bonus'
    WHEN 'Familiar' THEN 'Companion'
    WHEN 'Free Summon' THEN 'Summon'
    WHEN 'Support' THEN NULL
    WHEN 'Reliability' THEN NULL
    WHEN 'Versatile' THEN NULL
  ELSE tag
  END;
END;
$$;


--
-- Name: map_feat_tag_phase3(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.map_feat_tag_phase3(raw text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  tag text := map_feat_tag_phase2(raw);
BEGIN
  IF tag IS NULL THEN RETURN NULL; END IF;
  RETURN CASE tag
    WHEN 'Attack Roll' THEN 'Attack Bonus'
    WHEN 'Attack Roll Decrease' THEN 'Attack Debuff'
    WHEN 'Attack Penalty' THEN 'Attack Debuff'
    WHEN 'Martial Bonus Increase' THEN 'Martial Bonus'
    WHEN 'Line Attack' THEN 'Area of Effect'
    WHEN 'Intimidate' THEN 'Intimidation'
    WHEN 'Taunt' THEN 'Intimidation'
    WHEN 'Deception' THEN 'Deceive'
    WHEN 'Audience' THEN 'Social'
    WHEN 'Performance' THEN 'Act'
    WHEN 'Mimicry' THEN 'Deceive'
    WHEN 'Hidden Message' THEN 'Deceive'
    WHEN 'Speed' THEN 'Speed Increase'
    WHEN 'Speed Reduction' THEN 'Slow'
    WHEN 'Melee Range Increase' THEN 'Range Increase'
    WHEN 'Terminal Range' THEN 'Terminal'
    WHEN 'Terminal Increase' THEN 'Terminal'
    WHEN 'Swim' THEN 'Movement'
    WHEN 'Jump' THEN 'Movement'
    WHEN 'Evasion Debuff' THEN 'Evasion Decrease'
    WHEN 'Mental Defense' THEN 'Defense Increase'
    WHEN 'Psychic Damage Resistance' THEN 'Damage Resistance'
    WHEN 'Resistance Reduction' THEN 'Damage Reduction'
    WHEN 'Attack Avoidance' THEN 'Dodge'
    WHEN 'Damage Avoidance' THEN 'Dodge'
    WHEN 'Defense Debuff' THEN 'Defense Reduction'
    WHEN 'Feat Uses' THEN 'Feat Use'
    WHEN 'Feat Acquisition' THEN 'Feat Bonus'
    WHEN 'Training Point Cost' THEN 'Training Points'
    WHEN 'Power Use' THEN 'Power'
    WHEN 'Power Acquisition' THEN 'Power'
    WHEN 'Power Part Modification' THEN 'Power'
    WHEN 'Power Improvisation' THEN 'Power'
    WHEN 'Cast Time' THEN 'Energy Cost'
    WHEN 'Weapon Properties' THEN 'Weapon Property'
    WHEN 'Add Weapon' THEN 'Weapon'
    WHEN 'Unarmed' THEN 'Unarmed Prowess'
    WHEN 'Ammunition' THEN 'Ranged Weapon'
    WHEN 'Monk Weapon' THEN 'Weapon'
    WHEN 'Two-Handed' THEN 'Weapon Property'
    WHEN 'Armor Properties' THEN 'Armor'
    WHEN 'Armor Penetration' THEN 'Armor'
    WHEN 'Unseen' THEN 'Hidden'
    WHEN 'Beast Sense' THEN 'Perception'
    WHEN 'Darkvision' THEN 'Perception'
    WHEN 'Hearing' THEN 'Perception'
    WHEN 'Divine Sense' THEN 'Perception'
    WHEN 'Shadow' THEN 'Darkness'
    WHEN 'Recall History' THEN 'Recall'
    WHEN 'Information Gathering' THEN 'Search'
    WHEN 'Learn' THEN 'Knowledge'
    WHEN 'Commune with Nature' THEN 'Survival'
    WHEN 'Navigate' THEN 'Survival'
    WHEN 'Rest' THEN 'Recovery'
    WHEN 'Downtime' THEN 'Recovery'
    WHEN 'Dazed' THEN 'Stun'
    WHEN 'Stagger' THEN 'Stun'
    WHEN 'Immobile' THEN 'Slow'
    WHEN 'Blind' THEN 'Blinded'
    WHEN 'Arcane' THEN 'Magic Damage'
    WHEN 'Ability Cap' THEN 'Ability Bonus'
    WHEN 'Skill Cap' THEN 'Skill Bonus'
    WHEN 'Stat Bonus' THEN 'Ability Bonus'
    WHEN 'Ability Roll' THEN 'Skill Roll'
    WHEN 'Skill Points' THEN 'Skill Bonus'
    WHEN 'Overcome Rolls' THEN 'Skill Roll'
    WHEN 'Attacked Triggered' THEN 'Reaction'
    WHEN 'Attacking Triggered' THEN 'Reaction'
    WHEN 'Basic Action Reaction' THEN 'Basic Action'
    WHEN 'Combat Start' THEN 'First Strike'
    WHEN 'Moving Target' THEN 'Attack Debuff'
    WHEN 'Stationary Target' THEN 'Attack Bonus'
    WHEN 'Repair' THEN 'Craft'
    WHEN 'Tinker' THEN 'Craft'
    WHEN 'Consumable' THEN 'Craft'
    WHEN 'Harvest' THEN 'Craft'
    WHEN 'Cooking' THEN 'Craft'
    WHEN 'Speak with Animals' THEN 'Beastcraft'
    WHEN 'Bond' THEN 'Companion'
    WHEN 'Automaton' THEN 'Companion'
    WHEN 'Astral Form' THEN 'Shapeshift'
    WHEN 'Astral Sight' THEN 'Perception'
    WHEN 'Incorporeal' THEN 'Shapeshift'
    WHEN 'Size Change' THEN 'Shapeshift'
    WHEN 'Size Increase' THEN 'Shapeshift'
    WHEN 'Water Breathing' THEN 'Survival'
    WHEN 'Telekinesis' THEN 'Power'
    WHEN 'Help' THEN 'Ally'
    WHEN 'Solo' THEN 'Ability Bonus'
    WHEN 'Luck' THEN 'Re-roll'
    WHEN 'Environment' THEN 'Survival'
    WHEN 'Code' THEN NULL
    WHEN 'Currency' THEN NULL
    WHEN 'Device' THEN NULL
    WHEN 'Carry' THEN 'Athletics'
    WHEN 'Lifting' THEN 'Athletics'
    WHEN 'Wall' THEN 'Movement'
    WHEN 'Water' THEN 'Movement'
    WHEN 'Light' THEN 'Light Damage'
    WHEN 'Dance' THEN 'Act'
    WHEN 'Rite' THEN 'Innate'
    WHEN 'Riddle' THEN 'Social'
    WHEN 'Pickpocket' THEN 'Sleight of Hand'
    WHEN 'Apply Condition' THEN NULL
    WHEN 'Add Element' THEN 'Elemental Damage'
    WHEN 'Change Damage Type' THEN 'Elemental Damage'
    WHEN 'Heroic Determination' THEN 'Inspiration'
    WHEN 'Resilience' THEN 'Defense Increase'
    WHEN 'Initiative Increase' THEN 'Speed Increase'
    WHEN 'Energy Drain' THEN 'Energy Cost'
    WHEN 'Energy Share' THEN 'Energy Cost'
    WHEN 'Critical Multiplier' THEN 'Critical Hit'
    WHEN 'Action Point Gain' THEN 'Action Point'
    WHEN 'Surprise Immunity' THEN 'Frighten Immunity'
    WHEN 'Surprised' THEN 'Frighten'
    WHEN 'Timeless' THEN 'Duration Increase'
    WHEN 'Triage' THEN 'Heal'
    WHEN 'Medicine' THEN 'Heal'
    WHEN 'Resurrection' THEN 'Heal'
    WHEN 'Ingest' THEN 'Craft'
  ELSE tag
  END;
END;
$$;


--
-- Name: normalize_feat_tags(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.normalize_feat_tags(tag_string text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN mapped IS NULL OR mapped = '' THEN NULL
    ELSE mapped || ','
  END
  FROM (
    SELECT string_agg(DISTINCT t, ',' ORDER BY t) AS mapped
    FROM (
      SELECT map_feat_tag_phase3(unnest(string_to_array(COALESCE(tag_string, ''), ','))) AS t
    ) sub
    WHERE t IS NOT NULL AND t <> ''
  ) agg;
$$;


--
-- Name: patch_character_relational(text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.patch_character_relational(p_character_id text, p_patch jsonb, p_expected_updated_at text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'auth'
    AS $$
DECLARE
  v_owner_id text := auth.uid()::text;
  v_row public.characters%ROWTYPE;
  v_document jsonb;
  v_entry record;
  v_now timestamp without time zone;
  v_inventory_patch jsonb;
  v_skip_sync text;
  v_patch_body jsonb;
  v_legacy_equipment_rejected boolean := false;
  v_inventory_result jsonb;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character patch must be an object' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row FROM public.characters
  WHERE id = p_character_id AND user_id = v_owner_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','not_found');
  END IF;

  IF p_expected_updated_at IS NOT NULL
     AND v_row.updated_at IS DISTINCT FROM
       (p_expected_updated_at::timestamptz AT TIME ZONE 'UTC') THEN
    RETURN jsonb_build_object(
      'status','conflict','updatedAt',to_jsonb(v_row.updated_at)
    );
  END IF;

  v_patch_body := p_patch;
  IF v_patch_body ? 'equipment' THEN
    v_legacy_equipment_rejected := true;
    v_patch_body := v_patch_body - 'equipment';
  END IF;

  v_inventory_patch := v_patch_body->'inventoryPatch';
  IF v_inventory_patch IS NOT NULL AND v_inventory_patch <> 'null'::jsonb THEN
    BEGIN
      v_inventory_result := public.apply_character_inventory_patch(
        p_character_id, v_owner_id, v_inventory_patch);
    EXCEPTION
      WHEN SQLSTATE '40001' THEN
        RETURN jsonb_build_object(
          'status','conflict','code','inventory_cas_conflict',
          'updatedAt',to_jsonb(v_row.updated_at)
        );
    END;
  END IF;

  v_document := public.get_character_relational_document(p_character_id);
  FOR v_entry IN SELECT key, value FROM jsonb_each(v_patch_body) LOOP
    IF v_entry.key IN ('id','userId','createdAt','updatedAt','lastPlayedAt','inventoryPatch') THEN
      CONTINUE;
    ELSIF v_entry.value = 'null'::jsonb THEN
      v_document := v_document - v_entry.key;
    ELSE
      v_document := jsonb_set(v_document, ARRAY[v_entry.key], v_entry.value, true);
    END IF;
  END LOOP;

  v_now := greatest(
    clock_timestamp() AT TIME ZONE 'UTC',
    coalesce(v_row.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
      + interval '1 millisecond'
  )::timestamp(3);

  v_skip_sync := current_setting('app.skip_inventory_full_sync', true);
  PERFORM set_config('app.skip_inventory_full_sync','on',true);
  PERFORM public.apply_character_relational_document(p_character_id, v_document, v_now);
  PERFORM set_config('app.skip_inventory_full_sync',coalesce(v_skip_sync,''),true);

  IF v_legacy_equipment_rejected THEN
    RETURN jsonb_build_object(
      'status','conflict',
      'code','legacy_equipment_rejected',
      'updatedAt',to_jsonb(v_now),
      'inventoryPatchResult',coalesce(v_inventory_result, 'null'::jsonb)
    );
  END IF;

  RETURN jsonb_build_object(
    'status','updated',
    'updatedAt',to_jsonb(v_now),
    'inventoryPatchResult',coalesce(v_inventory_result, 'null'::jsonb)
  );
END;
$$;


--
-- Name: prevent_client_profile_field_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_client_profile_field_change() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: prevent_unauthorized_role_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_unauthorized_role_change() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.role := 'new_player';
    elsif new.role is distinct from old.role then
      raise exception 'Changing user role is not permitted' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;


--
-- Name: provision_character_relational(text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.provision_character_relational(p_character_id text, p_owner_id text, p_document jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_row public.characters%ROWTYPE;
  v_now timestamp without time zone := clock_timestamp() AT TIME ZONE 'UTC';
  v_previous_relational text;
BEGIN
  IF nullif(p_owner_id,'') IS NULL THEN
    RAISE EXCEPTION 'Owner id is required' USING ERRCODE = '22023';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;

  IF NOT FOUND THEN
    v_previous_relational := current_setting('app.character_relational_write', true);
    PERFORM set_config('app.character_relational_write','on',true);
    INSERT INTO public.characters (
      id, user_id, data, created_at, updated_at, name, level, status, visibility
    ) VALUES (
      p_character_id, p_owner_id, p_document, v_now, v_now,
      coalesce(nullif(p_document->>'name',''),'Unnamed'),
      coalesce(nullif(p_document->>'level','')::integer,1),
      nullif(p_document->>'status',''),
      coalesce(nullif(p_document->>'visibility',''),'private')
    );
    PERFORM set_config('app.character_relational_write',coalesce(v_previous_relational,''),true);
  ELSIF v_row.user_id IS DISTINCT FROM p_owner_id THEN
    RAISE EXCEPTION 'Provisioning cannot change character owner' USING ERRCODE = '42501';
  END IF;

  PERFORM public.apply_character_relational_document(p_character_id, p_document, v_now);
  RETURN jsonb_build_object('status','upserted','id',p_character_id);
END;
$$;


--
-- Name: prune_codex_change_logs_to_latest_ten(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prune_codex_change_logs_to_latest_ten() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM public.codex_change_logs c
  WHERE c.entity_type = NEW.entity_type
    AND c.entity_id = NEW.entity_id
    AND c.id NOT IN (
      SELECT id
      FROM public.codex_change_logs
      WHERE entity_type = NEW.entity_type
        AND entity_id = NEW.entity_id
      ORDER BY changed_at DESC, id DESC
      LIMIT 10
    );
  RETURN NEW;
END;
$$;


--
-- Name: remove_campaign_character_relational(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_owner_id text, p_character_id text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_campaign public.campaigns%ROWTYPE;
  v_roster jsonb;
  v_remaining jsonb;
BEGIN
  IF nullif(p_actor_id,'') IS NULL OR nullif(p_campaign_id,'') IS NULL
     OR nullif(p_character_owner_id,'') IS NULL OR nullif(p_character_id,'') IS NULL THEN
    RAISE EXCEPTION 'Invalid campaign removal input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;
  IF v_campaign.owner_id IS DISTINCT FROM p_actor_id
     AND p_character_owner_id IS DISTINCT FROM p_actor_id THEN
    RETURN jsonb_build_object('status','forbidden');
  END IF;

  v_roster := CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
    THEN v_campaign.characters ELSE '[]'::jsonb END;
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  SELECT coalesce(jsonb_agg(entry ORDER BY position), '[]'::jsonb)
  INTO v_remaining
  FROM jsonb_array_elements(v_roster) WITH ORDINALITY AS roster(entry, position)
  WHERE NOT (
    coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
    AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  );

  UPDATE public.campaigns SET characters = v_remaining WHERE id = v_campaign.id;
  IF p_character_owner_id IS DISTINCT FROM v_campaign.owner_id
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_remaining) AS roster(entry)
       WHERE coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
     ) THEN
    DELETE FROM public.campaign_members
    WHERE campaign_id = v_campaign.id AND user_id = p_character_owner_id;
  END IF;

  RETURN jsonb_build_object('status','updated');
END;
$$;


--
-- Name: rename_codex_source(text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rename_codex_source(from_name text, to_name text, actor uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  from_collapsed text;
  to_collapsed text;
  from_key text;
  to_key text;
  candidate text;
  tables text[] := ARRAY[
    'codex_feats',
    'codex_skills',
    'codex_species',
    'codex_traits',
    'codex_parts',
    'codex_properties',
    'codex_equipment',
    'codex_archetypes',
    'codex_creature_feats'
  ];
  tbl text;
  updated_count integer;
  logged_count integer;
  counts jsonb := '{}'::jsonb;
  total integer := 0;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  from_collapsed := public.collapse_codex_source_name(from_name);
  to_collapsed := public.collapse_codex_source_name(to_name);

  FOREACH candidate IN ARRAY ARRAY[from_collapsed, to_collapsed]
  LOOP
    IF candidate IS NULL OR candidate = '' THEN
      RAISE EXCEPTION 'Source name is required.';
    END IF;
    IF char_length(candidate) > 100 THEN
      RAISE EXCEPTION 'Source name must be 100 characters or fewer.';
    END IF;
    IF position('<' IN candidate) > 0 OR position('>' IN candidate) > 0 THEN
      RAISE EXCEPTION 'Source name cannot include HTML.';
    END IF;
    IF candidate ~ ('[' || chr(1) || '-' || chr(31) || chr(127) || ']') THEN
      RAISE EXCEPTION 'Source name cannot include control characters.';
    END IF;
    IF lower(candidate COLLATE "C") = 'all' THEN
      RAISE EXCEPTION 'All is reserved and cannot be a source name.';
    END IF;
  END LOOP;

  from_key := lower(from_collapsed COLLATE "C");
  to_key := lower(to_collapsed COLLATE "C");

  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format($q$
      WITH candidates AS (
        SELECT id::text AS entity_id, sources AS old_sources
        FROM public.%I
        WHERE EXISTS (
          SELECT 1
          FROM unnest(sources) AS elem(value)
          WHERE public.collapse_codex_source_name(value) <> ''
            AND lower(public.collapse_codex_source_name(value) COLLATE "C") = ANY ($1::text[])
        )
      ),
      rewritten AS (
        SELECT
          c.entity_id,
          c.old_sources,
          COALESCE(
            (
              SELECT array_agg(
                deduped.spelling
                ORDER BY lower(deduped.spelling) COLLATE "C", deduped.spelling COLLATE "C"
              )
              FROM (
                SELECT DISTINCT ON (lower(mapped.spelling) COLLATE "C") mapped.spelling
                FROM (
                  SELECT
                    CASE
                      WHEN lower(tokens.collapsed COLLATE "C") = ANY ($1::text[]) THEN $2
                      ELSE tokens.collapsed
                    END AS spelling,
                    tokens.ord
                  FROM (
                    SELECT
                      public.collapse_codex_source_name(u.elem) AS collapsed,
                      u.ord
                    FROM unnest(c.old_sources) WITH ORDINALITY AS u(elem, ord)
                  ) AS tokens
                  WHERE tokens.collapsed <> ''
                ) AS mapped
                WHERE mapped.spelling <> ''
                ORDER BY lower(mapped.spelling) COLLATE "C", mapped.ord
              ) AS deduped
            ),
            ARRAY['Core']::text[]
          ) AS new_sources
        FROM candidates AS c
      ),
      changed AS (
        SELECT entity_id, old_sources, new_sources
        FROM rewritten
        WHERE old_sources IS DISTINCT FROM new_sources
      ),
      updated AS (
        UPDATE public.%I AS t
        SET sources = ch.new_sources,
            updated_at = now()
        FROM changed AS ch
        WHERE t.id::text = ch.entity_id
        RETURNING t.id::text AS entity_id, ch.old_sources, ch.new_sources
      ),
      logged AS (
        INSERT INTO public.codex_change_logs (
          entity_type,
          entity_id,
          operation,
          changed_by_user_id,
          before_data,
          after_data,
          changed_fields
        )
        SELECT
          $3,
          u.entity_id,
          'update',
          $4,
          jsonb_build_object('sources', to_jsonb(u.old_sources)),
          jsonb_build_object('sources', to_jsonb(u.new_sources)),
          jsonb_build_array(
            jsonb_build_object(
              'field', 'sources',
              'before', to_jsonb(u.old_sources),
              'after', to_jsonb(u.new_sources)
            )
          )
        FROM updated AS u
        RETURNING entity_id
      )
      SELECT
        (SELECT count(*)::int FROM updated),
        (SELECT count(*)::int FROM logged)
    $q$, tbl, tbl)
    INTO updated_count, logged_count
    USING ARRAY[from_key, to_key], to_collapsed, tbl, actor;

    IF updated_count IS NULL
       OR logged_count IS NULL
       OR updated_count <> logged_count THEN
      RAISE EXCEPTION 'rename changelog count did not match updated rows for %', tbl;
    END IF;

    counts := counts || jsonb_build_object(tbl, updated_count);
    total := total + COALESCE(updated_count, 0);
  END LOOP;

  RETURN counts || jsonb_build_object('total', total);
END;
$_$;


--
-- Name: FUNCTION rename_codex_source(from_name text, to_name text, actor uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rename_codex_source(from_name text, to_name text, actor uuid) IS 'Rename or merge one codex source on the nine sources arrays in one transaction, including changelog rows. Does not change the column default {Core} or CORE_CODEX_SOURCE. Items with no source are still saved as Core until a developer changes that default.';


--
-- Name: replace_archetype_levels(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.replace_archetype_levels(p_archetype_id text, p_levels jsonb) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: resolve_character_reference(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.resolve_character_reference(p_kind text, p_source_id text, p_name text, p_owner_id text) RETURNS TABLE(source_kind text, reference_id text)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE match_count integer;
BEGIN
  IF nullif(p_source_id, '') IS NULL AND nullif(p_name, '') IS NULL THEN
    RAISE EXCEPTION 'Character % reference has neither ID nor name', p_kind
      USING ERRCODE = '22023';
  END IF;

  SELECT count(*)::integer, min(c.source_kind), min(c.id)
  INTO match_count, source_kind, reference_id
  FROM (
    SELECT 'codex'::text AS source_kind, id, name FROM public.codex_species
      WHERE p_kind = 'species'
    UNION ALL SELECT 'user', id, name FROM public.user_species
      WHERE p_kind = 'species' AND user_id = p_owner_id
    UNION ALL SELECT 'codex', id, name FROM public.codex_feats
      WHERE p_kind = 'feat'
    UNION ALL SELECT 'codex', id, name FROM public.codex_skills
      WHERE p_kind = 'skill'
    UNION ALL SELECT 'codex', id, name FROM public.codex_traits
      WHERE p_kind = 'trait'
    UNION ALL SELECT 'codex', id, name FROM public.codex_archetypes
      WHERE p_kind = 'archetype'
    UNION ALL SELECT 'official', id, name FROM public.official_powers
      WHERE p_kind = 'power'
    UNION ALL SELECT 'user', id, name FROM public.user_powers
      WHERE p_kind = 'power' AND user_id = p_owner_id
    UNION ALL SELECT 'official', id, name FROM public.official_techniques
      WHERE p_kind = 'technique'
    UNION ALL SELECT 'user', id, name FROM public.user_techniques
      WHERE p_kind = 'technique' AND user_id = p_owner_id
    UNION ALL SELECT 'official_empowered', id, name
      FROM public.official_empowered_techniques
      WHERE p_kind = 'technique'
    UNION ALL SELECT 'user_empowered', id, name
      FROM public.user_empowered_techniques
      WHERE p_kind = 'technique' AND user_id = p_owner_id
    UNION ALL SELECT 'official', id, name FROM public.official_items
      WHERE p_kind = 'item'
    UNION ALL SELECT 'user', id, name FROM public.user_items
      WHERE p_kind = 'item' AND user_id = p_owner_id
    UNION ALL SELECT 'codex', id, name FROM public.codex_equipment
      WHERE p_kind = 'item'
    UNION ALL SELECT 'codex', id, name FROM public.codex_parts
      WHERE p_kind = 'part'
    UNION ALL SELECT 'codex', id, name FROM public.codex_properties
      WHERE p_kind = 'property'
  ) c
  WHERE (nullif(p_source_id, '') IS NOT NULL AND c.id = p_source_id)
     OR (nullif(p_source_id, '') IS NULL AND p_name IS NOT NULL
         AND lower(c.name) = lower(p_name));

  IF match_count > 1 THEN
    RAISE EXCEPTION 'Ambiguous character % reference (id %, name %)',
      p_kind, p_source_id, p_name USING ERRCODE = '23514';
  END IF;
  IF match_count = 0 THEN
    source_kind := 'unresolved';
    reference_id := NULL;
  END IF;
  RETURN NEXT;
END;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: role_policy_limits_for_role(public."UserRole"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.role_policy_limits_for_role(p_role public."UserRole") RETURNS TABLE(max_characters integer, max_custom_powers integer, max_custom_techniques integer, max_custom_armaments integer, max_custom_creatures integer)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_row public.role_policies%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.role_policies WHERE role = p_role;
  IF FOUND THEN
    max_characters := v_row.max_characters;
    max_custom_powers := v_row.max_custom_powers;
    max_custom_techniques := v_row.max_custom_techniques;
    max_custom_armaments := v_row.max_custom_armaments;
    max_custom_creatures := v_row.max_custom_creatures;
    RETURN NEXT;
    RETURN;
  END IF;

  CASE p_role
    WHEN 'new_player' THEN
      max_characters := 3;
      max_custom_powers := 20;
      max_custom_techniques := 20;
      max_custom_armaments := 15;
      max_custom_creatures := 10;
    WHEN 'playtester' THEN
      max_characters := 6;
      max_custom_powers := 35;
      max_custom_techniques := 35;
      max_custom_armaments := 25;
      max_custom_creatures := 25;
    WHEN 'developer' THEN
      max_characters := 15;
      max_custom_powers := 100;
      max_custom_techniques := 100;
      max_custom_armaments := 80;
      max_custom_creatures := 100;
    WHEN 'admin' THEN
      max_characters := 9999;
      max_custom_powers := 9999;
      max_custom_techniques := 9999;
      max_custom_armaments := 9999;
      max_custom_creatures := 9999;
    ELSE
      max_characters := 3;
      max_custom_powers := 20;
      max_custom_techniques := 20;
      max_custom_armaments := 15;
      max_custom_creatures := 10;
  END CASE;
  RETURN NEXT;
END;
$$;


--
-- Name: set_updated_at_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: sync_character_child_tables(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_character_child_tables(p_character_id text, p_document jsonb) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_owner_id text;
  v_collection text;
  v_duplicate text;
  v_entry record;
  v_source_id text;
  v_name text;
  v_source_kind text;
  v_reference_id text;
  v_species_ids jsonb;
  v_species_names jsonb;
  v_ancestry jsonb;
  v_equipment jsonb;
  v_position integer;
  v_trait_position integer;
  v_seen text[];
  v_key text;
  v_skip_inventory boolean;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.characters WHERE id = p_character_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character % not found', p_character_id USING ERRCODE = 'P0002';
  END IF;
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character data must be an object' USING ERRCODE = '22023';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);

  v_skip_inventory := current_setting('app.skip_inventory_full_sync', true) = 'on';

  FOREACH v_collection IN ARRAY ARRAY[
    'feats','archetypeFeats','skills','powers','techniques','traits',
    'conditions','namedNotes','proficiencies'
  ] LOOP
    IF p_document ? v_collection AND p_document->v_collection <> 'null'::jsonb
       AND jsonb_typeof(p_document->v_collection) <> 'array'
       AND NOT (v_collection = 'skills'
                AND jsonb_typeof(p_document->v_collection) = 'object') THEN
      RAISE EXCEPTION 'Character % must be an array', v_collection
        USING ERRCODE = '22023';
    END IF;
    SELECT q.ref INTO v_duplicate FROM (
      SELECT coalesce(nullif(x.value->>'id',''), nullif(x.value->>'name',''),
        CASE WHEN jsonb_typeof(x.value) = 'string' THEN x.value #>> '{}' END) AS ref,
        count(DISTINCT x.value) AS versions
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(p_document->v_collection) = 'array'
          THEN p_document->v_collection ELSE '[]'::jsonb END
      ) x GROUP BY 1
    ) q WHERE q.ref IS NOT NULL AND q.versions > 1 LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'Conflicting duplicate % reference %', v_collection, v_duplicate
        USING ERRCODE = '23514';
    END IF;
  END LOOP;

  DELETE FROM public.character_species WHERE character_id = p_character_id;
  DELETE FROM public.character_feats WHERE character_id = p_character_id;
  DELETE FROM public.character_skills WHERE character_id = p_character_id;
  DELETE FROM public.character_traits WHERE character_id = p_character_id;
  DELETE FROM public.character_powers WHERE character_id = p_character_id;
  DELETE FROM public.character_techniques WHERE character_id = p_character_id;
  IF NOT v_skip_inventory THEN
    DELETE FROM public.character_inventory WHERE character_id = p_character_id;
  END IF;
  DELETE FROM public.character_conditions WHERE character_id = p_character_id;
  DELETE FROM public.character_named_notes WHERE character_id = p_character_id;
  DELETE FROM public.character_library_section_preferences WHERE character_id = p_character_id;
  DELETE FROM public.character_note_section_preferences WHERE character_id = p_character_id;
  DELETE FROM public.character_archetype_choices WHERE character_id = p_character_id;
  DELETE FROM public.character_proficiencies WHERE character_id = p_character_id;
  DELETE FROM public.character_temp_modifiers WHERE character_id = p_character_id;
  DELETE FROM public.character_affiliations WHERE character_id = p_character_id;
  DELETE FROM public.character_ability_components WHERE character_id = p_character_id;

  -- Single species, explicit mixed pair, or the pre-speciesIds mixed:<a>+<b>
  -- legacy alias. Each slot retains the saved source ID/name even if its user
  -- library row is subsequently deleted.
  v_ancestry := p_document->'ancestry';
  IF jsonb_typeof(v_ancestry) = 'object' THEN
    v_species_names := v_ancestry->'speciesNames';
    IF jsonb_typeof(v_ancestry->'speciesIds') = 'array' THEN
      v_species_ids := v_ancestry->'speciesIds';
    ELSIF v_ancestry->>'id' ~ '^mixed:[^+]+\+[^+]+$' THEN
      v_species_ids := jsonb_build_array(
        split_part(split_part(v_ancestry->>'id',':',2),'+',1),
        split_part(split_part(v_ancestry->>'id',':',2),'+',2));
    ELSE
      v_species_ids := jsonb_build_array(v_ancestry->'id');
    END IF;
    IF jsonb_array_length(v_species_ids) > 2 THEN
      RAISE EXCEPTION 'Character ancestry has more than two species'
        USING ERRCODE = '22023';
    END IF;
    FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(v_species_ids)
      WITH ORDINALITY LOOP
      v_source_id := nullif(v_entry.value #>> '{}','');
      v_name := CASE
        WHEN jsonb_typeof(v_species_names) = 'array'
          THEN v_species_names->>(v_entry.ordinality::integer - 1)
        WHEN jsonb_array_length(v_species_ids) = 2
          THEN nullif(trim(split_part(v_ancestry->>'name',' / ',v_entry.ordinality::integer)),'')
        ELSE coalesce(v_ancestry->>'name', p_document->>'species') END;
      IF v_source_id IS NULL AND v_name IS NULL THEN CONTINUE; END IF;
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('species', v_source_id, v_name, v_owner_id);
      INSERT INTO public.character_species (
        character_id, position, source_kind, source_id, name_snapshot,
        codex_species_id, user_species_id
      ) VALUES (
        p_character_id, v_entry.ordinality, v_source_kind, v_source_id, v_name,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        CASE WHEN v_source_kind = 'user' THEN v_reference_id END
      );
    END LOOP;
  ELSIF nullif(p_document->>'species','') IS NOT NULL THEN
    v_name := p_document->>'species';
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('species', NULL, v_name, v_owner_id);
    INSERT INTO public.character_species (
      character_id, position, source_kind, name_snapshot,
      codex_species_id, user_species_id
    ) VALUES (
      p_character_id, 1, v_source_kind, v_name,
      CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user' THEN v_reference_id END
    );
  END IF;

  -- Feats and archetype feats retain first-entry order after exact dedupe.
  FOREACH v_collection IN ARRAY ARRAY['feats','archetypeFeats'] LOOP
    v_seen := ARRAY[]::text[];
    FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p_document->v_collection) = 'array'
        THEN p_document->v_collection ELSE '[]'::jsonb END
    ) WITH ORDINALITY LOOP
      v_source_id := nullif(v_entry.value->>'id','');
      v_name := coalesce(nullif(v_entry.value->>'name',''),
        CASE WHEN jsonb_typeof(v_entry.value) = 'string'
          THEN v_entry.value #>> '{}' END);
      v_key := coalesce(v_source_id, v_name);
      IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
      v_seen := array_append(v_seen, v_key);
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('feat', v_source_id, v_name, v_owner_id);
      INSERT INTO public.character_feats (
        character_id, feat_kind, position, feat_id, source_id, name_snapshot,
        description_snapshot, current_uses, custom_name, note
      ) VALUES (
        p_character_id,
        CASE WHEN v_collection = 'feats' THEN 'character' ELSE 'archetype' END,
        v_entry.ordinality,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        v_source_id, v_name, v_entry.value->>'description',
        nullif(v_entry.value->>'currentUses','')::integer,
        v_entry.value->>'customName', v_entry.value->>'note'
      );
    END LOOP;
  END LOOP;

  -- Skill rows may be an old id→rank object or current lean row array.
  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'skills') = 'array'
      THEN p_document->'skills'
      WHEN jsonb_typeof(p_document->'skills') = 'object' THEN
        (SELECT coalesce(jsonb_agg(jsonb_build_object('id',key,'skill_val',value)
          ORDER BY key),'[]'::jsonb) FROM jsonb_each(p_document->'skills'))
      ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := nullif(v_entry.value->>'id','');
    v_name := coalesce(nullif(v_entry.value->>'name',''),
      CASE WHEN jsonb_typeof(v_entry.value) = 'string'
        THEN v_entry.value #>> '{}' END);
    v_key := coalesce(v_source_id, v_name);
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('skill', v_source_id, v_name, v_owner_id);
    INSERT INTO public.character_skills (
      character_id, position, skill_id, source_id, name_snapshot,
      category_snapshot, base_skill_snapshot, skill_val, proficient,
      selected_ability, selected_base_skill_source_id, selected_base_skill_id
    ) VALUES (
      p_character_id, v_entry.ordinality,
      CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
      v_source_id, v_name, v_entry.value->>'category', v_entry.value->>'baseSkill',
      coalesce(nullif(v_entry.value->>'skill_val','')::integer, 0),
      coalesce(nullif(v_entry.value->>'prof','')::boolean, false),
      v_entry.value->>'ability', v_entry.value->>'selectedBaseSkillId',
      (SELECT id FROM public.codex_skills
        WHERE id = v_entry.value->>'selectedBaseSkillId')
    );
  END LOOP;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedSpeciesSkillIds') = 'array'
      THEN v_ancestry->'selectedSpeciesSkillIds' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := v_entry.value #>> '{}';
    UPDATE public.character_skills
    SET species_selected = true,
        species_selection_position = v_entry.ordinality::smallint
    WHERE character_id = p_character_id AND source_id = v_source_id;
    IF NOT FOUND THEN
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('skill', v_source_id, NULL, v_owner_id);
      SELECT coalesce(max(position),0) + 1 INTO v_position
      FROM public.character_skills WHERE character_id = p_character_id;
      INSERT INTO public.character_skills (
        character_id, position, skill_id, source_id, name_snapshot,
        selection_present, species_selected, species_selection_position
      ) VALUES (
        p_character_id, v_position,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        v_source_id,
        (SELECT name FROM public.codex_skills WHERE id = v_reference_id),
        false, true, v_entry.ordinality::smallint
      );
    END IF;
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(p_document#>'{tempModifiers,skills}') = 'object'
      THEN p_document#>'{tempModifiers,skills}' ELSE '{}'::jsonb END
  ) LOOP
    UPDATE public.character_skills SET temp_delta = v_entry.value::integer
    WHERE character_id = p_character_id AND source_id = v_entry.key;
    IF NOT FOUND THEN
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('skill', v_entry.key, NULL, v_owner_id);
      SELECT coalesce(max(position),0) + 1 INTO v_position
      FROM public.character_skills WHERE character_id = p_character_id;
      INSERT INTO public.character_skills (
        character_id, position, skill_id, source_id, name_snapshot,
        selection_present, temp_delta
      ) VALUES (
        p_character_id, v_position,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        v_entry.key,
        (SELECT name FROM public.codex_skills WHERE id = v_reference_id),
        false, v_entry.value::integer
      );
    END IF;
  END LOOP;

  -- Trait selection/state is split by role, preserving mixed-species slot and
  -- single-species option-parent relationships. Name-keyed use counters are
  -- kept by name even when several Codex traits share that name.
  v_trait_position := 0;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedTraits') = 'array'
      THEN v_ancestry->'selectedTraits' ELSE '[]'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'ancestry', v_entry.value #>> '{}');
  END LOOP;
  IF nullif(v_ancestry->>'selectedFlaw','') IS NOT NULL THEN
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'flaw', v_ancestry->>'selectedFlaw');
  END IF;
  IF nullif(v_ancestry->>'selectedCharacteristic','') IS NOT NULL THEN
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'characteristic',
      v_ancestry->>'selectedCharacteristic');
  END IF;
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedSpeciesTraits') = 'array'
      THEN v_ancestry->'selectedSpeciesTraits' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'species', v_entry.value #>> '{}',
      NULL, v_entry.ordinality::smallint);
  END LOOP;
  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedSpeciesTraitChoices') = 'object'
      THEN v_ancestry->'selectedSpeciesTraitChoices' ELSE '{}'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'choice', v_entry.value,
      NULL, NULL, v_entry.key);
  END LOOP;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'traits') = 'array'
      THEN p_document->'traits' ELSE '[]'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    IF jsonb_typeof(v_entry.value) = 'string' THEN
      PERFORM public.insert_character_trait_selection(
        p_character_id, v_trait_position, 'owned', NULL, v_entry.value #>> '{}');
    ELSE
      PERFORM public.insert_character_trait_selection(
        p_character_id, v_trait_position, 'owned', v_entry.value->>'id',
        v_entry.value->>'name');
    END IF;
  END LOOP;
  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(p_document->'traitUses') = 'object'
      THEN p_document->'traitUses' ELSE '{}'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'uses', NULL, v_entry.key,
      NULL, NULL, v_entry.value::integer);
  END LOOP;
  FOR v_entry IN SELECT key, value FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document->'traitCustomizations') = 'object'
      THEN p_document->'traitCustomizations' ELSE '{}'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'customization', v_entry.key,
      NULL, NULL, NULL, NULL,
      v_entry.value->>'customName', v_entry.value->>'note');
  END LOOP;

  -- Power and technique source matches are source-specific FKs. Deletion of
  -- user-library rows later nulls only the FK, not the snapshots.
  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'powers') = 'array'
      THEN p_document->'powers' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := nullif(v_entry.value->>'id','');
    v_name := coalesce(nullif(v_entry.value->>'name',''),
      CASE WHEN jsonb_typeof(v_entry.value) = 'string'
        THEN v_entry.value #>> '{}' END);
    v_key := coalesce(v_source_id, v_name);
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('power', v_source_id, v_name, v_owner_id);
    INSERT INTO public.character_powers (
      character_id, position, source_kind, source_id, name_snapshot,
      official_power_id, user_power_id, innate, selected_variant_id
    ) VALUES (
      p_character_id, v_entry.ordinality, v_source_kind, v_source_id, v_name,
      CASE WHEN v_source_kind = 'official' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user' THEN v_reference_id END,
      coalesce(nullif(v_entry.value->>'innate','')::boolean,false),
      v_entry.value->>'selectedVariantId'
    );
  END LOOP;

  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'techniques') = 'array'
      THEN p_document->'techniques' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := nullif(v_entry.value->>'id','');
    v_name := coalesce(nullif(v_entry.value->>'name',''),
      CASE WHEN jsonb_typeof(v_entry.value) = 'string'
        THEN v_entry.value #>> '{}' END);
    v_key := coalesce(v_source_id, v_name);
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('technique', v_source_id, v_name, v_owner_id);
    INSERT INTO public.character_techniques (
      character_id, position, source_kind, source_id, name_snapshot,
      official_technique_id, user_technique_id, official_empowered_id, user_empowered_id
    ) VALUES (
      p_character_id, v_entry.ordinality, v_source_kind, v_source_id, v_name,
      CASE WHEN v_source_kind = 'official' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'official_empowered' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user_empowered' THEN v_reference_id END
    );
  END LOOP;

  -- Current saver uses weapons/shields/armor/items/accessories. Legacy
  -- inventory is accepted only if identical to items; otherwise it is unique
  -- information and the migration fails until explicitly mapped.
  IF NOT v_skip_inventory THEN
  v_equipment := p_document->'equipment';
  IF jsonb_typeof(v_equipment) = 'object' THEN
    IF v_equipment ? 'inventory' AND v_equipment->'inventory' <> 'null'::jsonb
       AND v_equipment->'inventory' IS DISTINCT FROM v_equipment->'items' THEN
      RAISE EXCEPTION 'Non-duplicate equipment.inventory needs review'
        USING ERRCODE = '22023';
    END IF;
    FOR v_entry IN SELECT key, value FROM jsonb_each(v_equipment)
      ORDER BY CASE WHEN key IN ('mainHand','offHand') THEN 1 ELSE 0 END, key LOOP
      IF v_entry.key NOT IN ('weapons','shields','armor','items','accessories',
                             'inventory','mainHand','offHand') THEN
        RAISE EXCEPTION 'Unknown equipment key %', v_entry.key USING ERRCODE = '22023';
      END IF;
      IF v_entry.key IN ('weapons','shields','armor','items','accessories') THEN
        IF jsonb_typeof(v_entry.value) = 'array' THEN
          FOR v_position IN 1..jsonb_array_length(v_entry.value) LOOP
            PERFORM public.insert_character_inventory_item(
              p_character_id, v_owner_id,
              CASE v_entry.key WHEN 'weapons' THEN 'weapon'
                WHEN 'shields' THEN 'shield' WHEN 'items' THEN 'equipment'
                WHEN 'accessories' THEN 'accessory' ELSE 'armor' END,
              v_position, v_entry.value->(v_position - 1));
          END LOOP;
        ELSIF v_entry.value <> 'null'::jsonb THEN
          IF v_entry.key <> 'armor' THEN
            RAISE EXCEPTION 'Equipment % must be an array', v_entry.key
              USING ERRCODE = '22023';
          END IF;
          PERFORM public.insert_character_inventory_item(
            p_character_id, v_owner_id, 'armor', 1, v_entry.value, 'armor');
        END IF;
      ELSIF v_entry.key IN ('mainHand','offHand')
            AND v_entry.value <> 'null'::jsonb THEN
        v_collection := CASE
          WHEN v_entry.value->>'type' = 'shield' THEN 'shield'
          WHEN v_entry.value->>'type' = 'armor' THEN 'armor'
          ELSE 'weapon' END;
        SELECT coalesce(max(position),0) + 1 INTO v_position
        FROM public.character_inventory
        WHERE character_id = p_character_id AND category = v_collection;
        PERFORM public.insert_character_inventory_item(
          p_character_id, v_owner_id, v_collection, v_position,
          v_entry.value, v_entry.key);
      END IF;
    END LOOP;
  END IF;
  END IF;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'conditions') = 'array'
      THEN p_document->'conditions' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    INSERT INTO public.character_conditions (
      character_id, position, name, level, decaying, description
    ) VALUES (
      p_character_id, v_entry.ordinality, v_entry.value->>'name',
      coalesce(nullif(v_entry.value->>'level','')::integer,1),
      coalesce(nullif(v_entry.value->>'decaying','')::boolean,false),
      v_entry.value->>'description'
    );
  END LOOP;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'namedNotes') = 'array'
      THEN p_document->'namedNotes' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    INSERT INTO public.character_named_notes (
      character_id, position, note_id, name, content, hidden
    ) VALUES (
      p_character_id, v_entry.ordinality, v_entry.value->>'id',
      v_entry.value->>'name', coalesce(v_entry.value->>'content',''),
      nullif(v_entry.value->>'hidden','')::boolean
    );
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document->'librarySectionVisibility') = 'object'
      THEN p_document->'librarySectionVisibility' ELSE '{}'::jsonb END
  ) LOOP
    INSERT INTO public.character_library_section_preferences (
      character_id, section_id, visible
    ) VALUES (
      p_character_id, v_entry.key, (v_entry.value #>> '{}')::boolean
    );
  END LOOP;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'notesSectionOrder') = 'array'
      THEN p_document->'notesSectionOrder' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    INSERT INTO public.character_note_section_preferences (
      character_id, section_id, position
    ) VALUES (
      p_character_id, v_entry.value #>> '{}', v_entry.ordinality
    );
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document->'notesSectionVisibility') = 'object'
      THEN p_document->'notesSectionVisibility' ELSE '{}'::jsonb END
  ) LOOP
    INSERT INTO public.character_note_section_preferences (
      character_id, section_id, visible
    ) VALUES (
      p_character_id, v_entry.key, (v_entry.value #>> '{}')::boolean
    ) ON CONFLICT (character_id, section_id) DO UPDATE
      SET visible = EXCLUDED.visible;
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(p_document->'archetypeChoices') = 'object'
      THEN p_document->'archetypeChoices' ELSE '{}'::jsonb END
  ) LOOP
    INSERT INTO public.character_archetype_choices (
      character_id, milestone_level, choice
    ) VALUES (p_character_id, v_entry.key::integer, v_entry.value);
  END LOOP;

  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'proficiencies') = 'array'
      THEN p_document->'proficiencies' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_key := coalesce(v_entry.value->>'id',v_entry.value->>'name');
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    v_source_id := nullif(v_entry.value->>'refId','');
    v_name := v_entry.value->>'name';
    IF v_entry.value->>'kind' = 'custom' THEN
      v_source_kind := 'unresolved'; v_reference_id := NULL;
    ELSE
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference(
        CASE WHEN v_entry.value->>'kind' = 'item_property' THEN 'property'
          ELSE 'part' END, v_source_id, v_name, v_owner_id);
    END IF;
    INSERT INTO public.character_proficiencies (
      character_id, position, kind, source_id, ref_id, name, part_id,
      property_id, damage_type, op_1_level, op_2_level, op_3_level,
      base_tp, op_1_tp, op_2_tp, op_3_tp, custom
    ) VALUES (
      p_character_id, v_entry.ordinality, v_entry.value->>'kind',
      v_entry.value->>'id', v_source_id, v_name,
      CASE WHEN v_entry.value->>'kind' IN ('power_part','technique_part')
             AND v_source_kind = 'codex' THEN v_reference_id END,
      CASE WHEN v_entry.value->>'kind' = 'item_property'
             AND v_source_kind = 'codex' THEN v_reference_id END,
      v_entry.value->>'damageType',
      nullif(v_entry.value->>'op1Level','')::integer,
      nullif(v_entry.value->>'op2Level','')::integer,
      nullif(v_entry.value->>'op3Level','')::integer,
      nullif(v_entry.value->>'baseTP','')::numeric,
      nullif(v_entry.value->>'op1TP','')::numeric,
      nullif(v_entry.value->>'op2TP','')::numeric,
      nullif(v_entry.value->>'op3TP','')::numeric,
      coalesce(nullif(v_entry.value->>'custom','')::boolean,false)
    );
  END LOOP;

  IF jsonb_typeof(p_document->'tempModifiers') = 'object' THEN
    INSERT INTO public.character_temp_modifiers (
      character_id, speed, evasion, damage_reduction, critical_range, terminal,
      ability_strength, ability_vitality, ability_agility, ability_acuity,
      ability_intelligence, ability_charisma, defense_might, defense_fortitude,
      defense_reflex, defense_discernment, defense_mental_fortitude,
      defense_resolve, apply_ability_to_resource_maxima
    ) VALUES (
      p_character_id,
      nullif(p_document#>>'{tempModifiers,speed}','')::integer,
      nullif(p_document#>>'{tempModifiers,evasion}','')::integer,
      nullif(p_document#>>'{tempModifiers,damageReduction}','')::integer,
      nullif(p_document#>>'{tempModifiers,criticalRange}','')::integer,
      nullif(p_document#>>'{tempModifiers,terminal}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,strength}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,vitality}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,agility}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,acuity}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,intelligence}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,charisma}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,might}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,fortitude}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,reflex}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,discernment}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,mentalFortitude}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,resolve}','')::integer,
      nullif(p_document#>>'{tempModifiers,applyAbilityToResourceMaxima}','')::boolean
    );
  END IF;

  FOREACH v_collection IN ARRAY ARRAY['allies','organizations'] LOOP
    IF p_document ? v_collection AND p_document->v_collection <> 'null'::jsonb
       AND jsonb_typeof(p_document->v_collection) <> 'array' THEN
      RAISE EXCEPTION 'Character % must be an array', v_collection
        USING ERRCODE = '22023';
    END IF;
    FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p_document->v_collection) = 'array'
        THEN p_document->v_collection ELSE '[]'::jsonb END
    ) WITH ORDINALITY LOOP
      IF jsonb_typeof(v_entry.value) = 'object'
         AND EXISTS (SELECT 1 FROM jsonb_object_keys(v_entry.value) k
                     WHERE k <> 'name') THEN
        RAISE EXCEPTION 'Legacy % has unmapped object fields', v_collection
          USING ERRCODE = '22023';
      END IF;
      INSERT INTO public.character_affiliations (
        character_id, affiliation_kind, position, name
      ) VALUES (
        p_character_id,
        CASE WHEN v_collection = 'allies' THEN 'ally' ELSE 'organization' END,
        v_entry.ordinality,
        CASE WHEN jsonb_typeof(v_entry.value) = 'string'
          THEN v_entry.value #>> '{}' ELSE v_entry.value->>'name' END
      );
    END LOOP;
  END LOOP;

  FOREACH v_collection IN ARRAY ARRAY['baseAbilities','ancestryAbilities'] LOOP
    IF p_document ? v_collection AND p_document->v_collection <> 'null'::jsonb THEN
      IF jsonb_typeof(p_document->v_collection) <> 'object' THEN
        RAISE EXCEPTION 'Character % must be an object', v_collection
          USING ERRCODE = '22023';
      END IF;
      INSERT INTO public.character_ability_components (
        character_id, component_kind, strength, vitality, agility,
        acuity, intelligence, charisma
      ) VALUES (
        p_character_id,
        CASE WHEN v_collection = 'baseAbilities' THEN 'base' ELSE 'ancestry' END,
        nullif(p_document#>>ARRAY[v_collection,'strength'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'vitality'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'agility'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'acuity'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'intelligence'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'charisma'],'')::integer
      );
    END IF;
  END LOOP;
END;
$_$;


--
-- Name: sync_character_cutover_scalars(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_character_cutover_scalars(p_character_id text, p_document jsonb) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character % data must be an object', p_character_id
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.characters SET
    innate_energy = nullif(p_document->>'innateEnergy','')::integer,
    training_points_spent = nullif(p_document->>'trainingPointsSpent','')::numeric
  WHERE id = p_character_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character % not found', p_character_id USING ERRCODE = 'P0002';
  END IF;
END;
$$;


--
-- Name: sync_character_data_compat_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_character_data_compat_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE v_previous_flag text;
BEGIN
  IF current_setting('app.character_relational_write', true) = 'on' THEN
    RETURN NEW;
  END IF;

  v_previous_flag := current_setting('app.character_compat_sync', true);
  PERFORM set_config('app.character_compat_sync','on',true);
  PERFORM public.sync_character_scalar_columns(NEW.id, NEW.data);
  PERFORM public.sync_character_cutover_scalars(NEW.id, NEW.data);
  PERFORM public.sync_character_child_tables(NEW.id, NEW.data);
  PERFORM set_config('app.character_compat_sync',coalesce(v_previous_flag,''),true);
  RETURN NEW;
END;
$$;


--
-- Name: sync_character_scalar_columns(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_character_scalar_columns(p_character_id text, p_document jsonb) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
DECLARE
  d jsonb;
  archetype_ref text;
BEGIN
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character % data must be an object', p_character_id
      USING ERRCODE = '22023';
  END IF;
  d := coalesce(p_document->'defenseVals', p_document->'defenseSkills');
  archetype_ref := nullif(p_document#>>'{archetype,id}', '');

  UPDATE public.characters c SET
    experience = coalesce(nullif(p_document->>'experience',''),
                          nullif(p_document->>'xp',''))::integer,
    portrait = coalesce(p_document->>'portrait', p_document->>'portraitUrl',
                        p_document->>'portrait_url'),
    gender = p_document->>'gender',
    description = p_document->>'description',
    notes = p_document->>'notes',
    backstory = p_document->>'backstory',
    appearance = p_document->>'appearance',
    archetype_desc = p_document->>'archetypeDesc',
    age = p_document->>'age',
    height = nullif(p_document->>'height','')::numeric,
    weight = nullif(p_document->>'weight','')::numeric,
    currency = nullif(p_document->>'currency','')::numeric,
    health_points = coalesce(nullif(p_document->>'healthPoints',''),
                             nullif(p_document#>>'{health_energy_points,health}',''))::integer,
    energy_points = coalesce(nullif(p_document->>'energyPoints',''),
                             nullif(p_document#>>'{health_energy_points,energy}',''))::integer,
    innate_energy = nullif(p_document->>'innateEnergy','')::integer,
    training_points_spent = nullif(p_document->>'trainingPointsSpent','')::numeric,
    current_health = coalesce(nullif(p_document->>'currentHealth',''),
                              nullif(p_document#>>'{health,current}',''))::integer,
    current_energy = coalesce(nullif(p_document->>'currentEnergy',''),
                              nullif(p_document#>>'{energy,current}',''))::integer,
    action_points = nullif(p_document->>'actionPoints','')::integer,
    state_uses_current = nullif(p_document->>'stateUsesCurrent','')::integer,
    unarmed_prowess = nullif(p_document->>'unarmedProwess','')::integer,
    speed_base = nullif(p_document->>'speedBase','')::integer,
    evasion_base = nullif(p_document->>'evasionBase','')::integer,
    pow_prof = coalesce(nullif(p_document->>'pow_prof',''),
                        nullif(p_document->>'powerProficiency',''))::integer,
    mart_prof = coalesce(nullif(p_document->>'mart_prof',''),
                         nullif(p_document->>'martialProficiency',''))::integer,
    pow_abil = p_document->>'pow_abil',
    mart_abil = p_document->>'mart_abil',
    archetype_category = CASE p_document#>>'{archetype,type}'
      WHEN 'mixed' THEN 'powered-martial'
      ELSE p_document#>>'{archetype,type}' END,
    archetype_source_id = archetype_ref,
    archetype_id = (SELECT a.id FROM public.codex_archetypes a
                    WHERE a.id = archetype_ref),
    archetype_path_id_snapshot = nullif(p_document->>'archetypePathId',''),
    archetype_path_id = (SELECT a.id FROM public.codex_archetypes a
                         WHERE a.id = nullif(p_document->>'archetypePathId','')),
    ancestry_id_snapshot = p_document#>>'{ancestry,id}',
    ancestry_name_snapshot = coalesce(p_document#>>'{ancestry,name}',
                                      p_document->>'species'),
    ancestry_mixed = (p_document#>>'{ancestry,mixed}' = 'true'
                      OR p_document#>>'{ancestry,id}' ~ '^mixed:[^+]+\+[^+]+$'),
    ancestry_size = p_document#>>'{ancestry,size}',
    ancestry_speed = nullif(p_document#>>'{ancestry,speed}','')::integer,
    ancestry_selected_size = p_document#>>'{ancestry,selectedSize}',
    ancestry_flaw_species_source_id = p_document#>>'{ancestry,selectedFlawSpeciesId}',
    ancestry_mixed_height = nullif(p_document#>>'{ancestry,mixedPhysical,aveHeight}','')::numeric,
    ancestry_mixed_weight = nullif(p_document#>>'{ancestry,mixedPhysical,aveWeight}','')::numeric,
    ancestry_mixed_adulthood = nullif(p_document#>>'{ancestry,mixedPhysical,adulthood}','')::numeric,
    ancestry_mixed_max_age = nullif(p_document#>>'{ancestry,mixedPhysical,maxAge}','')::numeric,
    speed_display_unit = p_document->>'speedDisplayUnit',
    library_powers_visible = nullif(p_document#>>'{libraryTabVisibility,powers}','')::boolean,
    library_techniques_visible = nullif(p_document#>>'{libraryTabVisibility,techniques}','')::boolean,
    library_inventory_visible = nullif(p_document#>>'{libraryTabVisibility,inventory}','')::boolean,
    library_feats_visible = nullif(p_document#>>'{libraryTabVisibility,feats}','')::boolean,
    library_proficiencies_visible = nullif(p_document#>>'{libraryTabVisibility,proficiencies}','')::boolean,
    library_notes_visible = nullif(p_document#>>'{libraryTabVisibility,notes}','')::boolean,
    last_played_at = (nullif(p_document->>'lastPlayedAt','')::timestamptz
                      AT TIME ZONE 'UTC'),
    ability_strength = nullif(p_document#>>'{abilities,strength}','')::integer,
    ability_vitality = nullif(p_document#>>'{abilities,vitality}','')::integer,
    ability_agility = nullif(p_document#>>'{abilities,agility}','')::integer,
    ability_acuity = nullif(p_document#>>'{abilities,acuity}','')::integer,
    ability_intelligence = nullif(p_document#>>'{abilities,intelligence}','')::integer,
    ability_charisma = nullif(p_document#>>'{abilities,charisma}','')::integer,
    defense_might = nullif(d->>'might','')::integer,
    defense_fortitude = nullif(d->>'fortitude','')::integer,
    defense_reflex = nullif(d->>'reflex','')::integer,
    defense_discernment = nullif(d->>'discernment','')::integer,
    defense_mental_fortitude = nullif(d->>'mentalFortitude','')::integer,
    defense_resolve = nullif(d->>'resolve','')::integer
  WHERE c.id = p_character_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character % not found', p_character_id USING ERRCODE = 'P0002';
  END IF;
END;
$_$;


--
-- Name: sync_library_promoted_columns(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_library_promoted_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
DECLARE
  payload_doc JSONB := COALESCE(NEW.payload, '{}'::jsonb);
BEGIN
  NEW.payload := payload_doc;
  IF TG_TABLE_NAME IN ('official_powers', 'user_powers') THEN
    NEW.range_steps := COALESCE(NEW.range_steps, CASE WHEN (payload_doc->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'range'->>'steps')::INTEGER ELSE NULL END);
    NEW.duration_type := COALESCE(NEW.duration_type, payload_doc->'duration'->>'type');
    NEW.duration_value := COALESCE(NEW.duration_value, CASE WHEN (payload_doc->'duration'->>'value') ~ '^-?[0-9]+$' THEN (payload_doc->'duration'->>'value')::INTEGER ELSE NULL END);
    NEW.area_type := COALESCE(NEW.area_type, payload_doc->'area'->>'type');
    NEW.area_level := COALESCE(NEW.area_level, CASE WHEN (payload_doc->'area'->>'level') ~ '^-?[0-9]+$' THEN (payload_doc->'area'->>'level')::INTEGER ELSE NULL END);
    NEW.damage := COALESCE(NEW.damage, CASE WHEN jsonb_typeof(payload_doc->'damage') = 'array' THEN payload_doc->'damage' ELSE NULL END, '[]'::jsonb);
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME IN ('official_techniques', 'user_techniques', 'official_empowered_techniques', 'user_empowered_techniques') THEN
    NEW.range_steps := COALESCE(NEW.range_steps, CASE WHEN (payload_doc->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'range'->>'steps')::INTEGER WHEN (payload_doc->'power'->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'power'->'range'->>'steps')::INTEGER ELSE NULL END);
    NEW.duration_type := COALESCE(NEW.duration_type, payload_doc->'duration'->>'type', payload_doc->'power'->'duration'->>'type');
    NEW.duration_value := COALESCE(NEW.duration_value, CASE WHEN (payload_doc->'duration'->>'value') ~ '^-?[0-9]+$' THEN (payload_doc->'duration'->>'value')::INTEGER WHEN (payload_doc->'power'->'duration'->>'value') ~ '^-?[0-9]+$' THEN (payload_doc->'power'->'duration'->>'value')::INTEGER ELSE NULL END);
    NEW.damage := COALESCE(NEW.damage, CASE WHEN jsonb_typeof(payload_doc->'damage') = 'array' THEN payload_doc->'damage' WHEN jsonb_typeof(payload_doc->'power'->'damage') = 'array' THEN payload_doc->'power'->'damage' ELSE NULL END, '[]'::jsonb);
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME IN ('official_items', 'user_items') THEN
    NEW.range_steps := COALESCE(NEW.range_steps, CASE WHEN (payload_doc->>'rangeLevel') ~ '^-?[0-9]+$' THEN (payload_doc->>'rangeLevel')::INTEGER WHEN (payload_doc->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'range'->>'steps')::INTEGER ELSE NULL END);
    NEW.is_two_handed := COALESCE(NEW.is_two_handed, CASE WHEN payload_doc ? 'isTwoHanded' THEN (payload_doc->>'isTwoHanded')::BOOLEAN ELSE NULL END);
    NEW.ability_requirement := COALESCE(NEW.ability_requirement, CASE WHEN jsonb_typeof(payload_doc->'abilityRequirement') = 'object' THEN payload_doc->'abilityRequirement' ELSE NULL END);
    NEW.costs := COALESCE(NEW.costs, CASE WHEN jsonb_typeof(payload_doc->'costs') = 'object' THEN payload_doc->'costs' ELSE NULL END);
    NEW.damage := COALESCE(NEW.damage, CASE WHEN jsonb_typeof(payload_doc->'damage') = 'array' THEN payload_doc->'damage' ELSE NULL END, '[]'::jsonb);
    NEW.properties := COALESCE(NEW.properties, CASE WHEN jsonb_typeof(payload_doc->'properties') = 'array' THEN payload_doc->'properties' ELSE NULL END, '[]'::jsonb);
    NEW.agility_reduction := COALESCE(NEW.agility_reduction, CASE WHEN (payload_doc->>'agilityReduction') ~ '^-?[0-9]+$' THEN (payload_doc->>'agilityReduction')::INTEGER ELSE NULL END);
    NEW.critical_range_increase := COALESCE(NEW.critical_range_increase, CASE WHEN (payload_doc->>'criticalRangeIncrease') ~ '^-?[0-9]+$' THEN (payload_doc->>'criticalRangeIncrease')::INTEGER ELSE NULL END);
    NEW.shield_dr := COALESCE(NEW.shield_dr, CASE WHEN jsonb_typeof(payload_doc->'shieldDR') = 'object' THEN payload_doc->'shieldDR' ELSE NULL END);
    NEW.shield_damage := COALESCE(NEW.shield_damage, CASE WHEN jsonb_typeof(payload_doc->'shieldDamage') = 'object' THEN payload_doc->'shieldDamage' ELSE NULL END);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$_$;


--
-- Name: touch_character_from_child(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_character_from_child() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE v_character_id text;
BEGIN
  IF current_setting('app.character_compat_sync', true) = 'on' THEN
    RETURN coalesce(NEW, OLD);
  END IF;
  v_character_id := coalesce(NEW.character_id, OLD.character_id);
  UPDATE public.characters c
  SET updated_at = greatest(
    clock_timestamp() AT TIME ZONE 'UTC',
    coalesce(c.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
      + interval '1 millisecond'
  )
  WHERE c.id = v_character_id;
  RETURN coalesce(NEW, OLD);
END;
$$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    -- the same values as wal2json sent them, which is what filters compare against
    raw_columns realtime.wal_column[] =
        array_agg((x->>'name', x->>'type', x->>'typeoid', x->'value', null, null)::realtime.wal_column)
        from jsonb_array_elements(wal -> 'columns') x;
    raw_old_columns realtime.wal_column[] =
        array_agg((x->>'name', x->>'type', x->>'typeoid', x->'value', null, null)::realtime.wal_column)
        from jsonb_array_elements(wal -> 'identity') x;

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(raw_columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(raw_old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: authorize(text, text, text, text, text, text[], text[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) RETURNS record
    LANGUAGE plpgsql
    AS $$
declare
  probe_ids uuid[];
  probe_inserted_at timestamp := now() at time zone 'utc';
  visible_ids uuid[];
  ext text;
  allowed boolean;
begin
  -- The probe inserts are rolled back, but they still give the transaction an xid, so it ends
  -- in a commit. Nothing durable was written, so skip waiting on the WAL flush and sync standbys.
  -- Set outside the block below, whose rollback would undo it.
  perform set_config('synchronous_commit', 'off', true);

  -- The RAISE at the end of this block rolls back everything in it.
  begin
    probe_ids := array(select gen_random_uuid() from unnest(read_extensions));

    insert into realtime.messages (id, topic, extension, inserted_at, updated_at)
    select p.id, topic_name, p.extension, probe_inserted_at, probe_inserted_at
    from unnest(probe_ids, read_extensions) as p(id, extension);

    perform set_config('role', role_name, true),
            set_config('realtime.topic', topic_name, true),
            set_config('request.jwt.claims', claims, true),
            set_config('request.jwt.claim.sub', sub, true),
            set_config('request.jwt.claim.role', role_name, true),
            set_config('request.headers', headers, true);

    -- One lookup for every probe, by the full primary key. Skipped without probes, so the
    -- SELECT policies are not planned for a write.
    if cardinality(probe_ids) > 0 then
      visible_ids := array(
        select m.id
        from realtime.messages m
        where m.inserted_at = probe_inserted_at
          and m.id = any(probe_ids));
    end if;

    read_allowed := array(
      select p.id = any(visible_ids)
      from unnest(probe_ids) with ordinality as p(id, n)
      order by p.n);

    write_allowed := '{}';

    foreach ext in array write_extensions loop
      begin
        insert into realtime.messages (topic, extension, inserted_at, updated_at)
        values (topic_name, ext, now() at time zone 'utc', now() at time zone 'utc');

        allowed := true;
      exception when insufficient_privilege then
        allowed := false;
      end;

      write_allowed := write_allowed || allowed;
    end loop;

    raise sqlstate 'RTA01';
  exception when sqlstate 'RTA01' then
    null;
  end;
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


--
-- Name: filters_hash(realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.filters_hash(filters realtime.user_defined_filter[]) RETURNS bytea
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    AS $$
  select pg_catalog.int8send(pg_catalog.hash_array_extended(filters, 0))
      || pg_catalog.int8send(pg_catalog.hash_array_extended(filters, 1))
$$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: list_changes_sync(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures the slot is read exactly once.
  consumed AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         realtime.settled_changes(
           slot_name, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM consumed
    WHERE consumed.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM consumed,
         realtime.apply_rls(
           wal := consumed.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE consumed.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: settled_changes(name, integer, text[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) RETURNS TABLE(lsn pg_lsn, xid xid, data text)
    LANGUAGE plpgsql
    AS $$
declare
  upto pg_lsn;
  total bigint;
  xids xid[];
  starts bigint[];
  snapshot pg_snapshot;
  running_xids xid[];
  xmax_age int;
  cut bigint;
begin
  -- Each statement in a volatile function takes its own snapshot, which is what lets the
  -- check below see a writer that was still in flight when the peek ran. Under REPEATABLE
  -- READ the snapshot never advances, so a deferred change would never be released.
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'realtime.settled_changes requires READ COMMITTED';
  end if;

  -- The peek and the read below cover the same WAL, so the read cannot reach a commit the
  -- check never saw.
  upto := pg_current_wal_flush_lsn();

  -- One entry per transaction, in commit order: its xid and the position of its first
  -- change. The peek uses the caller's own options, so max_changes counts exactly what the
  -- read counts. A non-transactional logical message is emitted as soon as it is decoded,
  -- tagged with the xid of whatever transaction wrote it, so it does not mark where that
  -- transaction starts.
  select coalesce(sum(g.n), 0),
         array_agg(g.x order by g.first) filter (where g.first is not null),
         array_agg(g.first order by g.first) filter (where g.first is not null)
    into total, xids, starts
    from (
      select p.xid as x, count(*) as n,
             min(p.ord) filter (where not case
               when starts_with(p.data, '{"action":"M"') then (p.data::jsonb->>'transactional')::boolean is false
               else false
             end) as first
      from pg_logical_slot_peek_changes(slot_name, upto, max_changes, variadic opts)
           with ordinality as p(lsn, xid, data, ord)
      group by p.xid
    ) g;

  -- Nothing for the caller, but the slot still has to move past what the peek covered.
  if total = 0 then
    perform pg_replication_slot_advance(slot_name, upto);
    return;
  end if;

  if xids is not null then
    -- Taken after the peek is materialized, so a writer that was still in flight during
    -- decoding is guaranteed to show up here.
    snapshot := pg_current_snapshot();

    -- A commit record reaches the WAL before the writer leaves the proc array, so a change
    -- can be decoded while its row is invisible. apply_rls would resolve a policy against a
    -- row it cannot see and authorize it for nobody, while the read consumed it regardless.
    --
    -- xip lists transactions running when the snapshot was taken. It does not cover a writer
    -- whose xid sits at or beyond xmax, which never appears there, so the horizon is checked
    -- too. age() counts backwards from the current xid and so compares correctly across
    -- wraparound.
    select coalesce(array_agg(running.x::xid), array[]::xid[])
      into running_xids
      from pg_snapshot_xip(snapshot) running(x);
    xmax_age := age(pg_snapshot_xmax(snapshot)::xid);

    select min(u.s) into cut
      from unnest(xids, starts) as u(x, s)
      where u.x = any(running_xids) or age(u.x) <= xmax_age;
  end if;

  -- The read stops right after the commit that brings its count to upto_nchanges, so the
  -- count of changes in front of the first unsettled transaction stops it just before that
  -- transaction.
  if cut is null then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, max_changes, variadic opts) p;
  elsif cut > 1 then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, (cut - 1)::int, variadic opts) p;
  end if;
end;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are treated
    -- as the same subscription group in apply_rls. Preserve an empty array as '{}'
    -- ("primary keys only") so it stays distinct from NULL ("all columns"); array_agg
    -- over an empty set would otherwise collapse '{}' back to NULL.
    if new.selected_columns is not null then
        new.selected_columns = coalesce(
            (
                select array_agg(c order by c)
                from unnest(new.selected_columns) c
            ),
            '{}'::text[]
        );
    end if;

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_lifecycle_objects(uuid[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) RETURNS TABLE(id uuid, is_delete_marker boolean, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    object_id uuid;
    deleted_row storage.objects%ROWTYPE;
    deleted_ids uuid[];
    deleted_markers boolean[];
    deleted_metadata jsonb[];
    bulk_deleted boolean := false;
BEGIN
    -- Surface pre-existing deferred violations instead of treating them as blocked rows.
    SET CONSTRAINTS ALL IMMEDIATE;
    PERFORM set_config('storage.allow_delete_query', 'true', true);

    -- One subxact keeps the subxid cache from overflowing; rows return only once it commits.
    BEGIN
        WITH deleted AS (
            DELETE FROM storage.objects AS object_row
              WHERE object_row.id = ANY(object_ids) AND object_row.archived_at IS NOT NULL
              RETURNING object_row.id, object_row.is_delete_marker, object_row.metadata
        )
        SELECT array_agg(deleted.id), array_agg(deleted.is_delete_marker), array_agg(deleted.metadata)
          INTO deleted_ids, deleted_markers, deleted_metadata
          FROM deleted;
        bulk_deleted := true;
    EXCEPTION
        WHEN OTHERS THEN
            -- User triggers may use insufficient_privilege to block a row.
            IF SQLSTATE <> '42501' AND left(SQLSTATE, 2) IN ('08', '40', '42', '53', '55', '57', '58', 'XX') THEN
                RAISE;
            END IF;
    END;
    IF bulk_deleted THEN
        RETURN QUERY SELECT * FROM unnest(deleted_ids, deleted_markers, deleted_metadata);
        RETURN;
    END IF;

    FOREACH object_id IN ARRAY object_ids LOOP
        BEGIN
            DELETE FROM storage.objects AS object_row
              WHERE object_row.id = object_id AND object_row.archived_at IS NOT NULL
              RETURNING object_row.* INTO deleted_row;
            IF FOUND THEN
                id := deleted_row.id;
                is_delete_marker := deleted_row.is_delete_marker;
                metadata := deleted_row.metadata;
                RETURN NEXT;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLSTATE <> '42501' AND left(SQLSTATE, 2) IN ('08', '40', '42', '53', '55', '57', '58', 'XX') THEN
                    RAISE;
                END IF;
        END;
    END LOOP;
END;
$$;


--
-- Name: enforce_bucket_lifecycle_service_role(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_lifecycle_service_role() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
  IF current_user::text IS DISTINCT FROM TG_ARGV[0] THEN
    -- Keep this check AFTER caller RLS accepts the proposed row. The API
    -- recognizes this exact signal after rolling back its permission probe.
    RAISE EXCEPTION 'bucket control columns may only be changed by the configured storage service role'
      USING ERRCODE = 'PST01',
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            CONSTRAINT = TG_NAME;
  END IF;

  RETURN NULL;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: enforce_versioning_status_transition(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_versioning_status_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.versioning_status = OLD.versioning_status THEN
        RETURN NEW;
    END IF;

    IF NEW.versioning_status = 'DISABLED' OR
       (OLD.versioning_status = 'DISABLED' AND NEW.versioning_status = 'SUSPENDED') THEN
        RAISE EXCEPTION 'Cannot transition bucket versioning status from % to %',
            OLD.versioning_status, NEW.versioning_status;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN p_delimiter <> ''
         AND position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(
        p_key,
        length(p_prefix)
            + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1))
            + length(p_delimiter) - 1
    )
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket(noncurrent_versions text DEFAULT 'include'::text, delete_markers text DEFAULT 'include'::text) RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'include');
    delete_markers := COALESCE(delete_markers, 'include');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'include';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'include';
    END IF;

    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        where (noncurrent_versions != 'exclude' OR obj.archived_at IS NULL)
          and (noncurrent_versions != 'only' OR obj.archived_at IS NOT NULL)
          and (delete_markers != 'exclude' OR NOT obj.is_delete_marker)
          and (delete_markers != 'only' OR obj.is_delete_marker)
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text, raw_prefix_param text DEFAULT NULL::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $_$
WITH candidates AS (
    SELECT
        upload.key AS object_key,
        CASE
            WHEN position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0
            THEN left(
                upload.key,
                length(coalesce($7, $2))
                    + position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1))
                    + length($3) - 1
            )
            ELSE upload.key
        END AS result_key,
        upload.id,
        upload.created_at,
        position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0 AS is_common_prefix
    FROM storage.s3_multipart_uploads AS upload
    WHERE upload.bucket_id = $1
      AND upload.key COLLATE "C" LIKE $2 || '%'
), filtered AS (
    SELECT candidate.*
    FROM candidates AS candidate
    WHERE $5 = ''
       OR candidate.result_key COLLATE "C" > $5
       OR (
           candidate.result_key COLLATE "C" = $5
           AND NOT candidate.is_common_prefix
           AND $6 <> ''
           -- A completed or aborted marker repeats the remaining same-key uploads.
           AND COALESCE(
               (candidate.created_at, candidate.id COLLATE "C") > (
                   SELECT marker.created_at, marker.id COLLATE "C"
                   FROM storage.s3_multipart_uploads AS marker
                   WHERE marker.bucket_id = $1
                     AND marker.key COLLATE "C" = $5
                     AND marker.id = $6
               ),
               TRUE
           )
       )
), ranked AS (
    SELECT
        filtered.*,
        row_number() OVER (
            PARTITION BY filtered.result_key COLLATE "C"
            ORDER BY filtered.created_at, filtered.id COLLATE "C"
        ) AS prefix_rank
    FROM filtered
)
SELECT ranked.result_key, ranked.id, ranked.created_at
FROM ranked
WHERE NOT ranked.is_common_prefix OR ranked.prefix_rank = 1
ORDER BY ranked.result_key COLLATE "C", ranked.created_at, ranked.id COLLATE "C"
LIMIT $4;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text, text, text, timestamp with time zone, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, next_token_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, next_token_version text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_start_relative TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;

    -- true when noncurrent_versions can return >1 row per name; keeps them
    -- ordered most-recent-first and lets pagination resume mid-key
    v_multi_row BOOLEAN;
    v_name_order TEXT;
    v_exact_range_predicate TEXT;
    v_strict_range_predicate TEXT;
    v_inclusive_range_predicate TEXT;

    -- Seek state for the current name. archived_at is normalized to JavaScript's
    -- millisecond precision and version breaks ties within the same millisecond.
    -- Current rows use 'infinity'; NULL means no tiebreak has been established.
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_cursor_is_folder BOOLEAN;
    v_count INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_batch_query_strict TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');
    v_name_order := CASE WHEN v_is_asc THEN 'ASC' ELSE 'DESC' END;

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Keep caller-provided cursors inside the requested prefix range.
    IF v_start <> '' AND v_upper_bound IS NOT NULL THEN
        IF v_is_asc THEN
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                v_start := '';
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                RETURN;
            END IF;
        ELSE
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                RETURN;
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                v_start := '';
            END IF;
        END IF;
    END IF;

    v_start_relative := substring(v_start FROM length(v_prefix) + 1);

    -- Direction affects only the indexed name range and its ordering. Cursor
    -- state transitions and within-key version ordering stay shared.
    IF v_is_asc THEN
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" > $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" >= $2';
        IF v_upper_bound IS NOT NULL THEN
            v_exact_range_predicate := 'o.name COLLATE "C" < $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" < $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" < $3';
        END IF;
    ELSE
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" < $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" < $2';
        IF v_prefix <> '' THEN
            v_exact_range_predicate := 'o.name COLLATE "C" >= $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" >= $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" >= $3';
        END IF;
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    -- The multi-row order matches the externally serialized cursor exactly:
    -- archived_at at millisecond precision, then version as the final tiebreak.
    --
    -- When v_multi_row, the seek is a keyset tuple comparison ("name > $2 OR
    -- (name = $2 AND tiebreak)") - Postgres won't split that OR into indexable
    -- form (confirmed even with fully literal values), so as one WHERE clause
    -- it forces a full bucket scan filtered row-by-row. Splitting it into two
    -- independently-indexable branches (exact name match with the tiebreak
    -- filter, vs. strictly-past names) combined with UNION ALL lets each
    -- branch keep name as a real index condition; the outer ORDER BY/LIMIT
    -- re-merges them into the same page the single query used to produce.
    IF v_multi_row THEN
        v_batch_query := format(
            $sql$
            SELECT *
            FROM (
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND o.name COLLATE "C" = $2
                      AND %s
                      AND NOT $7::boolean
                      AND (
                          $5::timestamptz IS NULL
                          OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < $5
                          OR (
                              COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = $5
                              AND COALESCE(o.version, '') > $6
                          )
                      )
                      %s
                    ORDER BY
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
                UNION ALL
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND %s
                      %s
                    ORDER BY
                        o.name COLLATE "C" %s,
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
            ) sub
            ORDER BY
                sub.name COLLATE "C" %s,
                COALESCE(date_trunc('milliseconds', sub.archived_at), 'infinity'::timestamptz) DESC,
                COALESCE(sub.version, '') ASC
            LIMIT $4
            $sql$,
            v_exact_range_predicate,
            v_version_filter,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order,
            v_name_order
        );
    ELSE
        v_batch_query := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_inclusive_range_predicate,
            v_version_filter,
            v_name_order
        );

        -- Strict counterpart of the query above: used once the single-row
        -- ASC batch advance (below) has left v_next_seek pointing at the
        -- last row already emitted, so an inclusive predicate would
        -- re-match it forever. Only single-row mode ever sets strict mode,
        -- so this variant is never needed when v_multi_row.
        v_batch_query_strict := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order
        );
    END IF;

    -- The static peek predicates cannot use the partial delete-marker index
    -- once PL/pgSQL switches to a generic plan because whether
    -- is_delete_marker is required remains parameter-dependent. Reuse the
    -- already-specialized batch query with a one-row limit for this sparse
    -- filter so the plan sees a literal `o.is_delete_marker` predicate.
    IF delete_markers = 'only' THEN
        v_delete_marker_peek_query :=
            'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        IF NOT v_multi_row THEN
            v_delete_marker_peek_query_strict :=
                'SELECT marker_page.name FROM (' || v_batch_query_strict || ') marker_page LIMIT 1';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor performs one specialized initial seek so
            -- partial current-version and delete-marker indexes remain available.
            EXECUTE format(
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY o.name COLLATE "C" DESC LIMIT 1',
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND o.name COLLATE "C" >= $2 AND o.name COLLATE "C" < $3'
                    ELSE ''
                END,
                v_version_filter
            )
            INTO v_next_seek
            USING _bucket_id, v_prefix, v_upper_bound;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Folder continuation tokens retain their trailing delimiter. A
        -- delimiter-less startAfter is always a literal key boundary.
        v_cursor_is_folder := delimiter_param <> ''
            AND v_start_relative <> ''
            AND right(v_start_relative, length(delimiter_param)) = delimiter_param;

        IF v_cursor_is_folder THEN
            v_next_seek := CASE
                WHEN right(v_start, length(delimiter_param)) = delimiter_param
                    THEN v_start
                ELSE v_start || delimiter_param
            END;
            IF v_is_asc THEN
                v_next_seek := left(v_next_seek, -1)
                    || chr(ascii(right(v_next_seek, 1)) + 1);
            END IF;
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- leaf object: when v_multi_row, stay on v_start with the
            -- caller-supplied tiebreak so a page boundary mid-key resumes
            -- that key's remaining rows instead of skipping them. Truncate
            -- to milliseconds like every other v_next_seek_at assignment -
            -- harmless today since object.ts's cursor always round-trips
            -- through JS Date first, but this shouldn't rely on that.
            IF v_multi_row THEN
                v_next_seek := v_start;
                v_next_seek_at := date_trunc('milliseconds', next_token_archived_at);
                v_next_seek_version := coalesce(next_token_version, '');
                v_next_seek_strict := coalesce(next_token, '') = '';
            ELSIF v_is_asc THEN
                v_next_seek := v_start;
                v_next_seek_strict := true;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        -- v_multi_row is branched here (rather than folded into the WHERE
        -- clause as a bound parameter) so each concrete query keeps an
        -- unconditional seek predicate - once PL/pgSQL switches to its
        -- cached generic plan (after 5 calls), a parameter-gated
        -- "(NOT v_multi_row AND name >= $x) OR (v_multi_row AND ...)"
        -- predicate stops the planner from using name as an index
        -- condition at all, degrading every subsequent peek to a full
        -- index scan filtered row-by-row instead of a bounded range scan.
        -- v_multi_row's seek predicate is a keyset tuple comparison
        -- ("name > x OR (name = x AND tiebreak)") - Postgres does not
        -- split this OR into indexable form even with fully literal
        -- values, so it falls back to a full scan filtered row-by-row.
        -- Splitting it into two independently-indexable branches (exact
        -- name match with the tiebreak filter, vs. strictly-past name)
        -- combined with UNION ALL lets each branch keep name as a real
        -- index condition; the outer ORDER BY/LIMIT picks whichever of
        -- the (at most 2) rows sorts first.
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING _bucket_id, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END,
                    1, v_next_seek_at, v_next_seek_version, v_next_seek_strict;
        ELSIF v_multi_row THEN
            IF v_is_asc THEN
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" < v_upper_bound
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek AND o.name COLLATE "C" < v_upper_bound
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" >= v_prefix
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        ELSE
            -- Single-row mode is always noncurrent_versions='exclude'. Keep
            -- this predicate literal so generic plans use the current index.
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.name COLLATE "C" >= v_prefix
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := v_common_prefix;
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            version := NULL;
            archived_at := NULL;
            is_delete_marker := NULL;
            is_versioned := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1)
                    || chr(ascii(right(v_common_prefix, 1)) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row THEN v_batch_query_strict ELSE v_batch_query END
                USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size, v_next_seek_at, v_next_seek_version,
                v_next_seek_strict
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN v_current.name
                        ELSE v_current.name || delimiter_param
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                version := v_current.version;
                archived_at := v_current.archived_at;
                is_delete_marker := v_current.is_delete_marker;
                is_versioned := v_current.is_versioned;
                RETURN NEXT;
                v_count := v_count + 1;

                -- when v_multi_row, stay on this name and record its
                -- archived_at as the new tiebreak so remaining rows for the
                -- same key are picked up before moving to the next name
                IF v_multi_row THEN
                    v_next_seek := v_current.name;
                    v_next_seek_at := COALESCE(date_trunc('milliseconds', v_current.archived_at), 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                    v_next_seek_strict := false;
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor
                    -- would skip a real key like `name || '!'` (or any
                    -- character sorting below the delimiter), which sorts
                    -- between `name` and `name || delimiter`. Track the real
                    -- name and mark the next comparison strict instead.
                    v_next_seek := v_current.name;
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.list_objects_with_delimiter made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_active_lifecycle_states(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_active_lifecycle_states() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM storage.bucket_lifecycle_states
        WHERE bucket_id = OLD.id
          AND NOT (
              continuation IS NULL
              OR (continuation @> '{"continuationVersion": 1}' AND continuation #> '{batch,inFlight}' IS NULL)
          )
    ) THEN
        RAISE EXCEPTION 'update or delete on table "buckets" violates foreign key constraint "bucket_lifecycle_states_bucket_id_fkey" on table "bucket_lifecycle_states"'
            USING ERRCODE = 'foreign_key_violation',
                  DETAIL = format('Key (id)=(%s) is still referenced from table "bucket_lifecycle_states".', OLD.id),
                  SCHEMA = 'storage',
                  TABLE = 'bucket_lifecycle_states',
                  CONSTRAINT = 'bucket_lifecycle_states_bucket_id_fkey';
    END IF;
    RETURN OLD;
END;
$$;


--
-- Name: protect_bucket_control_columns(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_bucket_control_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  configuration_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lifecycle_configuration IS NOT NULL
       OR NEW.lifecycle_configuration_generation IS NOT NULL THEN
      IF NOT pg_has_role(current_user, TG_ARGV[0], 'MEMBER') THEN
        RAISE EXCEPTION 'only members of the configured storage service role may insert lifecycle policy state'
          USING ERRCODE = '42501',
                HINT = format(
                  'Insert with both lifecycle columns NULL and configure lifecycle through the Storage API afterward, or insert as a member of %I.',
                  TG_ARGV[0]
                );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  configuration_changed =
    OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
    OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation;

  IF NOT configuration_changed THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS DISTINCT FROM 'STANDARD' THEN
    RAISE EXCEPTION 'bucket versioning and lifecycle controls require a Standard bucket'
      USING ERRCODE = '0A000';
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     AND NEW.lifecycle_configuration_generation IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     OR NEW.lifecycle_configuration_generation IS NULL
     OR OLD.lifecycle_configuration IS NOT DISTINCT FROM NEW.lifecycle_configuration
     OR OLD.lifecycle_configuration_generation IS NOT DISTINCT FROM NEW.lifecycle_configuration_generation THEN
    RAISE EXCEPTION 'a changed lifecycle policy requires a new non-null generation'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: reconcile_lifecycle_state(text, boolean); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
    bucket storage.buckets%ROWTYPE;
    active boolean;
    idle boolean;
    state_generation uuid;
BEGIN
    SELECT * INTO bucket FROM storage.buckets WHERE id = target_bucket_id FOR NO KEY UPDATE;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT continuation IS NULL OR (
               continuation @> '{"continuationVersion": 1}'
               AND continuation #> '{batch,inFlight}' IS NULL
           ), generation
    INTO idle, state_generation
    FROM storage.bucket_lifecycle_states
    WHERE bucket_id = target_bucket_id
    FOR UPDATE;

    IF bucket.lifecycle_configuration IS NULL THEN
        DELETE FROM storage.bucket_lifecycle_states
        WHERE bucket_id = target_bucket_id
          AND idle IS TRUE;

        UPDATE storage.bucket_lifecycle_states
        SET next_run_at = clock_timestamp(), updated_at = clock_timestamp()
        WHERE bucket_id = target_bucket_id
          AND idle IS NOT TRUE;
        RETURN;
    END IF;

    active := bucket.versioning_status <> 'DISABLED'
        AND bucket.lifecycle_configuration @> '{"rules":[{"status":"Enabled"}]}'::jsonb;

    -- The state row records the generation it was reconciled with so callers need not detect
    -- policy changes. Rows without a recorded generation keep their work.
    policy_changed := policy_changed OR (
        state_generation IS NOT NULL AND state_generation <> bucket.lifecycle_configuration_generation
    );

    INSERT INTO storage.bucket_lifecycle_states AS state (bucket_id, generation, next_run_at)
    VALUES (bucket.id, bucket.lifecycle_configuration_generation, CASE WHEN active THEN clock_timestamp() END)
    ON CONFLICT (bucket_id) DO UPDATE
    SET next_run_at = CASE
            WHEN policy_changed THEN
                CASE WHEN active OR idle IS NOT TRUE THEN clock_timestamp() END
            ELSE EXCLUDED.next_run_at
        END,
        generation = EXCLUDED.generation,
        claim_id = CASE WHEN policy_changed AND idle IS TRUE
                        THEN NULL ELSE state.claim_id END,
        claim_until = CASE WHEN policy_changed AND idle IS TRUE
                           THEN NULL ELSE state.claim_until END,
        continuation = CASE WHEN policy_changed AND idle IS TRUE
                            THEN NULL ELSE state.continuation END,
        failure_count = CASE WHEN policy_changed AND idle IS TRUE
                             THEN 0 ELSE state.failure_count END,
        last_error = CASE WHEN policy_changed AND idle IS TRUE
                          THEN NULL ELSE state.last_error END,
        updated_at = clock_timestamp()
    WHERE policy_changed OR (state.next_run_at IS NULL AND EXCLUDED.next_run_at IS NOT NULL);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_prefix_len INT;
    v_prefix_start INT;
    v_combined_levels INT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;
    v_multi_row BOOLEAN;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_count INT := 0;
    v_skipped INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;
    v_previous_skipped INT;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_prefix_len := length(coalesce(prefix, ''));
    v_prefix_start := coalesce(array_length(string_to_array(coalesce(prefix, ''), v_delimiter), 1), 1);
    v_combined_levels := coalesce(array_length(string_to_array(v_prefix, v_delimiter), 1), 1);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT array_to_string(path_tokens[$1:$2], '/') AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $3 || '%%'
                  AND bucket_id = $4
                  AND array_length(objects.path_tokens, 1) <> $2
                  AND ($7 != 'exclude' OR objects.archived_at IS NULL)
                  AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
                  AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
                  AND ($8 != 'only' OR objects.is_delete_marker)
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata,
                   NULL::text AS version,
                   NULL::timestamptz AS archived_at,
                   NULL::boolean AS is_delete_marker,
                   NULL::boolean AS is_versioned FROM folders)
            UNION ALL
            (SELECT array_to_string(path_tokens[$1:$2], '/') AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata,
                   version, archived_at, is_delete_marker, is_versioned
             FROM storage.objects
             WHERE objects.name ILIKE $3 || '%%'
               AND bucket_id = $4
               AND array_length(objects.path_tokens, 1) = $2
               AND ($7 != 'exclude' OR objects.archived_at IS NULL)
               AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
               AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
               AND ($8 != 'only' OR objects.is_delete_marker)
             -- name, then version, as tiebreaks so two versions of the same
             -- key tying on the sort column still sort deterministically
             ORDER BY %I %s, name COLLATE "C" %s, COALESCE(version, '') %s)
            LIMIT $5 OFFSET $6
            $sql$, v_sort_order, v_order_by, v_sort_order, v_sort_order, v_sort_order
        ) USING v_prefix_start, v_combined_levels, v_prefix, bucketname, v_limit, offsets, noncurrent_versions, delete_markers;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build a resume-safe batch query. The exact-name branch returns remaining
    -- versions after the current (archived_at, version) boundary; the strict
    -- name branch returns subsequent keys. UNION ALL keeps both predicates
    -- independently indexable.
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2 AND lower(o.name) COLLATE "C" < $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 AND lower(o.name) COLLATE "C" >= $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    END IF;

    -- Keep the delete-marker predicate literal so the cached generic
    -- plan can use idx_objects_delete_markers during the main-loop peek.
    IF delete_markers = 'only' THEN
        IF v_multi_row THEN
            v_delete_marker_peek_query :=
                'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        ELSIF v_is_asc THEN
            -- Two separate literal query strings, not one gated by a bound
            -- boolean: folding "$n AND op1 OR NOT $n AND op2" into a single
            -- query defeats the generic plan's ability to push either
            -- comparison into the index. Branching in PL/pgSQL control flow
            -- instead keeps each query's index condition intact.
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" >= $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
            -- Strict variant: used once the single-row ASC batch advance
            -- (below) has left v_next_seek pointing at the last row already
            -- emitted, so a plain >= would re-match it forever.
            v_delete_marker_peek_query_strict :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" > $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
        ELSE
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" < $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" >= $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC performs one specialized initial seek so partial current-version
        -- and delete-marker indexes remain available.
        EXECUTE format(
            'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1',
            CASE WHEN v_upper_bound IS NOT NULL
                THEN ' AND lower(o.name) COLLATE "C" >= $2 AND lower(o.name) COLLATE "C" < $3'
                ELSE ''
            END,
            v_version_filter
        )
        INTO v_peek_name
        USING bucketname, v_prefix_lower, v_upper_bound;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch and
    -- the delete-marker-only path
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;
        v_previous_skipped := v_skipped;

        -- STEP 1: PEEK
        v_peek_name := NULL;
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END,
                    1, v_next_seek_at, v_next_seek_version;
        ELSIF v_multi_row AND v_next_seek_at IS NOT NULL THEN
            SELECT o.name INTO v_peek_name
            FROM storage.objects o
            WHERE o.bucket_id = bucketname
              AND lower(o.name) COLLATE "C" = v_next_seek
              AND (COALESCE(o.archived_at, 'infinity'::timestamptz) < v_next_seek_at
                   OR (COALESCE(o.archived_at, 'infinity'::timestamptz) = v_next_seek_at
                       AND COALESCE(o.version, '') > v_next_seek_version))
              AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
              AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
              AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
              AND (delete_markers != 'only' OR o.is_delete_marker)
            ORDER BY COALESCE(o.archived_at, 'infinity'::timestamptz) DESC,
                     COALESCE(o.version, '') ASC
            LIMIT 1;

            -- The current key is exhausted. Clear its version boundary and
            -- make the following ASC name peek strict. Appending '/' is not a
            -- valid lexical successor because keys ending in characters such
            -- as '!' sort between the exhausted name and name || '/'.
            IF v_peek_name IS NULL THEN
                IF v_is_asc THEN
                    v_next_seek_strict := true;
                END IF;
                v_next_seek_at := NULL;
                v_next_seek_version := '';
            END IF;
        END IF;

        -- Single-row mode is always noncurrent_versions='exclude'. Keep the
        -- current-row predicate literal so generic plans use the current index.
        IF delete_markers != 'only' AND v_peek_name IS NULL AND NOT v_multi_row THEN
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL AND v_is_asc THEN
            IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_next_seek_strict THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- If the peek landed on a different key than we were tracking, any
        -- version boundary belongs to the OLD key and must not leak into the
        -- new one - e.g. the deleteMarkers='only' peek doesn't know or care
        -- whether it's continuing the same key or jumping to a new one, so
        -- it never clears these itself.
        IF lower(v_peek_name) IS DISTINCT FROM v_next_seek THEN
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        END IF;

        -- The peek is authoritative for the next key to process. This is
        -- especially important after exhausting a multi-version key: the
        -- version boundary has been cleared, so executing the batch against
        -- a stale v_next_seek would replay every version of that old key.
        v_next_seek := lower(v_peek_name);
        v_next_seek_strict := false;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := substring(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter) from v_prefix_len + 1);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                version := NULL;
                archived_at := NULL;
                is_delete_marker := NULL;
                is_versioned := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size,
                    v_next_seek_at, v_next_seek_version
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too - it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN lower(v_current.name)
                        ELSE lower(v_current.name) || v_delimiter
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := substring(v_current.name from v_prefix_len + 1);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    version := v_current.version;
                    archived_at := v_current.archived_at;
                    is_delete_marker := v_current.is_delete_marker;
                    is_versioned := v_current.is_versioned;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Multi-row mode must remain on this key until all of its
                -- versions have crossed the internal batch boundary.
                IF v_multi_row THEN
                    v_next_seek := lower(v_current.name);
                    v_next_seek_at := COALESCE(v_current.archived_at, 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor would
                    -- skip a real key like `name || '!'` (or any character
                    -- sorting below the delimiter), which sorts between `name`
                    -- and `name || delimiter`. Track the real name and mark the
                    -- next comparison strict instead - same fix as the
                    -- exhausted-key case above.
                    v_next_seek := lower(v_current.name);
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_skipped = v_previous_skipped
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.search made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, p_start_after_version text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
    v_prefix_pattern text;
    v_sort_order text;
    v_sort_column text;
    v_version_tiebreak text;
BEGIN
    v_prefix := coalesce(p_prefix, '');
    -- Keep the raw prefix for common-prefix calculations and escape only LIKE metacharacters.
    v_prefix_pattern := replace(v_prefix, chr(92), chr(92) || chr(92));
    v_prefix_pattern := replace(v_prefix_pattern, '%', chr(92) || '%');
    v_prefix_pattern := replace(v_prefix_pattern, '_', chr(92) || '_');

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    -- $9 is only populated in multi-row mode; it's always '' otherwise, so
    -- only use each row's real version as a tiebreak in multi-row mode.
    v_version_tiebreak := CASE WHEN noncurrent_versions IN ('only', 'include') THEN 'COALESCE(version, '''')' ELSE '''''' END;

    -- Defense-in-depth: this function is independently reachable and must
    -- not trust p_sort_order/p_sort_column to already be validated by a
    -- caller. Normalize to the same strict allow-list storage.search_v2
    -- uses before interpolating anything into dynamic SQL below.
    v_sort_order := lower(coalesce(p_sort_order, 'asc'));
    IF v_sort_order NOT IN ('asc', 'desc') THEN
        v_sort_order := 'asc';
    END IF;

    v_sort_column := lower(coalesce(p_sort_column, 'updated_at'));
    IF v_sort_column NOT IN ('updated_at', 'created_at') THEN
        v_sort_column := 'updated_at';
    END IF;

    IF v_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                o.version AS obj_version,
                o.archived_at AS obj_archived_at,
                o.is_delete_marker AS obj_is_delete_marker,
                o.is_versioned AS obj_is_versioned,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $10 || '%%'
              AND ($7 != 'exclude' OR o.archived_at IS NULL)
              AND ($7 != 'only' OR o.archived_at IS NOT NULL)
              AND ($8 != 'exclude' OR NOT o.is_delete_marker)
              AND ($8 != 'only' OR o.is_delete_marker)
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                common_prefix AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                NULL::text AS version,
                NULL::timestamptz AS archived_at,
                NULL::boolean AS is_delete_marker,
                NULL::boolean AS is_versioned,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                obj_version AS version,
                obj_archived_at AS archived_at,
                obj_is_delete_marker AS is_delete_marker,
                obj_is_versioned AS is_versioned,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz),
                    name COLLATE "C",
                    %s
                ) %s ROW(
                    -- truncated the same way as the stored value above
                    date_trunc('milliseconds', COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz)),
                    $5,
                    $9
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata,
            version,
            archived_at,
            is_delete_marker,
            is_versioned
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s,
            COALESCE(version, '') %s
        LIMIT $4
    $sql$,
        v_sort_column,
        v_version_tiebreak,
        v_cursor_op,
        v_sort_column,
        v_sort_order,
        v_sort_order,
        v_sort_order
    );

    -- version is the third tiebreak component for two versions of the same
    -- key tying on both timestamp and name (see filtered CTE / ORDER BY above)
    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after, noncurrent_versions, delete_markers, coalesce(p_start_after_version, ''), v_prefix_pattern;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text, text, text, timestamp with time zone, text, boolean); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, start_after_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, start_after_version text DEFAULT ''::text, start_after_is_continuation boolean DEFAULT false) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata,
            l.version,
            l.archived_at,
            l.is_delete_marker,
            l.is_versioned
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            CASE WHEN start_after_is_continuation THEN '' ELSE start_after END,
            CASE WHEN start_after_is_continuation THEN start_after ELSE '' END,
            v_sort_ord,
            noncurrent_versions,
            delete_markers,
            start_after_archived_at,
            start_after_version
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after,
            noncurrent_versions, delete_markers, start_after_version
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: wake_lifecycle_state(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.wake_lifecycle_state() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.lifecycle_configuration IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM storage.reconcile_lifecycle_state(NEW.id, false);
    RETURN NEW;
END;
$$;


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: mfa_recovery_code_sets; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_recovery_code_sets (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    mfa_factor_id uuid NOT NULL,
    failed_verification_count integer DEFAULT 0 NOT NULL,
    verification_locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mfa_recovery_code_sets_failed_verification_count_check CHECK ((failed_verification_count >= 0))
);


--
-- Name: mfa_recovery_codes; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_recovery_codes (
    id uuid NOT NULL,
    mfa_recovery_code_set_id uuid NOT NULL,
    code_hash text NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    link_token_hash text,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    dedicated_scope boolean,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: scim_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.scim_tokens (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    token_hash text NOT NULL,
    prefix text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    CONSTRAINT scim_tokens_expires_at_future CHECK (((expires_at IS NULL) OR (expires_at > created_at))),
    CONSTRAINT scim_tokens_revoked_after_created CHECK (((revoked_at IS NULL) OR (revoked_at >= created_at))),
    CONSTRAINT scim_tokens_token_hash_check CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))
);


--
-- Name: scim_users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.scim_users (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    user_id uuid,
    resource jsonb NOT NULL,
    user_name text GENERATED ALWAYS AS (lower((resource ->> 'userName'::text))) STORED NOT NULL,
    external_id text GENERATED ALWAYS AS ((resource ->> 'externalId'::text)) STORED,
    active boolean GENERATED ALWAYS AS (COALESCE(((resource ->> 'active'::text))::boolean, true)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: admin_role_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_role_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id text NOT NULL,
    target_id text NOT NULL,
    old_role text,
    new_role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: campaign_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_members (
    campaign_id text NOT NULL,
    user_id text NOT NULL
);


--
-- Name: campaign_rolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_rolls (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    campaign_id text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp(3) without time zone,
    character_id text,
    user_id text,
    type text,
    title text
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    owner_id text NOT NULL,
    name text NOT NULL,
    description text,
    invite_code text NOT NULL,
    characters jsonb NOT NULL,
    owner_username text,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone
);


--
-- Name: character_ability_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_ability_components (
    character_id text NOT NULL,
    component_kind text NOT NULL,
    strength integer,
    vitality integer,
    agility integer,
    acuity integer,
    intelligence integer,
    charisma integer,
    CONSTRAINT character_ability_components_component_kind_check CHECK ((component_kind = ANY (ARRAY['base'::text, 'ancestry'::text])))
);


--
-- Name: character_affiliations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_affiliations (
    character_id text NOT NULL,
    affiliation_kind text NOT NULL,
    "position" integer NOT NULL,
    name text NOT NULL,
    CONSTRAINT character_affiliations_affiliation_kind_check CHECK ((affiliation_kind = ANY (ARRAY['ally'::text, 'organization'::text]))),
    CONSTRAINT character_affiliations_position_check CHECK (("position" > 0))
);


--
-- Name: character_archetype_choices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_archetype_choices (
    character_id text NOT NULL,
    milestone_level integer NOT NULL,
    choice text NOT NULL,
    CONSTRAINT character_archetype_choices_choice_check CHECK ((choice = ANY (ARRAY['innate'::text, 'feat'::text]))),
    CONSTRAINT character_archetype_choices_milestone_level_check CHECK ((milestone_level > 0))
);


--
-- Name: character_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_conditions (
    character_id text NOT NULL,
    "position" integer NOT NULL,
    name text NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    decaying boolean DEFAULT false NOT NULL,
    description text,
    CONSTRAINT character_conditions_position_check CHECK (("position" > 0))
);


--
-- Name: character_feats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_feats (
    character_id text NOT NULL,
    feat_kind text NOT NULL,
    "position" integer NOT NULL,
    feat_id text,
    source_id text,
    name_snapshot text,
    description_snapshot text,
    current_uses integer,
    custom_name text,
    note text,
    CONSTRAINT character_feats_feat_kind_check CHECK ((feat_kind = ANY (ARRAY['character'::text, 'archetype'::text]))),
    CONSTRAINT character_feats_position_check CHECK (("position" > 0))
);


--
-- Name: character_library_section_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_library_section_preferences (
    character_id text NOT NULL,
    section_id text NOT NULL,
    visible boolean NOT NULL,
    CONSTRAINT character_library_section_preferences_section_id_check CHECK ((section_id = ANY (ARRAY['stateFeats'::text, 'weapons'::text, 'shields'::text, 'armor'::text])))
);


--
-- Name: character_named_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_named_notes (
    character_id text NOT NULL,
    "position" integer NOT NULL,
    note_id text,
    name text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    hidden boolean,
    CONSTRAINT character_named_notes_position_check CHECK (("position" > 0))
);


--
-- Name: character_note_section_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_note_section_preferences (
    character_id text NOT NULL,
    section_id text NOT NULL,
    "position" integer,
    visible boolean,
    CONSTRAINT character_note_section_preferences_position_check CHECK (("position" > 0)),
    CONSTRAINT character_note_section_preferences_section_id_check CHECK ((section_id = ANY (ARRAY['physical'::text, 'appearance'::text, 'backstory'::text, 'archetypeDesc'::text, 'generalNotes'::text, 'customNotes'::text])))
);


--
-- Name: character_powers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_powers (
    character_id text NOT NULL,
    "position" integer NOT NULL,
    source_kind text NOT NULL,
    source_id text,
    name_snapshot text,
    official_power_id text,
    user_power_id text,
    innate boolean DEFAULT false NOT NULL,
    selected_variant_id text,
    CONSTRAINT character_powers_check CHECK ((num_nonnulls(official_power_id, user_power_id) <= 1)),
    CONSTRAINT character_powers_position_check CHECK (("position" > 0)),
    CONSTRAINT character_powers_source_kind_check CHECK ((source_kind = ANY (ARRAY['official'::text, 'user'::text, 'unresolved'::text])))
);


--
-- Name: character_proficiencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_proficiencies (
    character_id text NOT NULL,
    "position" integer NOT NULL,
    kind text NOT NULL,
    source_id text,
    ref_id text,
    name text NOT NULL,
    part_id text,
    property_id text,
    damage_type text,
    op_1_level integer,
    op_2_level integer,
    op_3_level integer,
    base_tp numeric,
    op_1_tp numeric,
    op_2_tp numeric,
    op_3_tp numeric,
    custom boolean DEFAULT false NOT NULL,
    CONSTRAINT character_proficiencies_check CHECK ((num_nonnulls(part_id, property_id) <= 1)),
    CONSTRAINT character_proficiencies_kind_check CHECK ((kind = ANY (ARRAY['power_part'::text, 'technique_part'::text, 'item_property'::text, 'custom'::text]))),
    CONSTRAINT character_proficiencies_position_check CHECK (("position" > 0))
);


--
-- Name: character_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_skills (
    character_id text NOT NULL,
    "position" integer NOT NULL,
    skill_id text,
    source_id text,
    name_snapshot text,
    category_snapshot text,
    base_skill_snapshot text,
    selection_present boolean DEFAULT true NOT NULL,
    skill_val integer DEFAULT 0 NOT NULL,
    proficient boolean DEFAULT false NOT NULL,
    selected_ability text,
    selected_base_skill_source_id text,
    selected_base_skill_id text,
    species_selected boolean DEFAULT false NOT NULL,
    species_selection_position smallint,
    temp_delta integer,
    CONSTRAINT character_skills_position_check CHECK (("position" > 0))
);


--
-- Name: character_species; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_species (
    character_id text NOT NULL,
    "position" smallint NOT NULL,
    source_kind text NOT NULL,
    source_id text,
    name_snapshot text,
    codex_species_id text,
    user_species_id text,
    CONSTRAINT character_species_check CHECK ((num_nonnulls(codex_species_id, user_species_id) <= 1)),
    CONSTRAINT character_species_position_check CHECK (("position" = ANY (ARRAY[1, 2]))),
    CONSTRAINT character_species_source_kind_check CHECK ((source_kind = ANY (ARRAY['codex'::text, 'user'::text, 'unresolved'::text])))
);


--
-- Name: character_techniques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_techniques (
    character_id text NOT NULL,
    "position" integer NOT NULL,
    source_kind text NOT NULL,
    source_id text,
    name_snapshot text,
    official_technique_id text,
    user_technique_id text,
    official_empowered_id text,
    user_empowered_id text,
    CONSTRAINT character_techniques_check CHECK ((num_nonnulls(official_technique_id, user_technique_id, official_empowered_id, user_empowered_id) <= 1)),
    CONSTRAINT character_techniques_position_check CHECK (("position" > 0)),
    CONSTRAINT character_techniques_source_kind_check CHECK ((source_kind = ANY (ARRAY['official'::text, 'user'::text, 'official_empowered'::text, 'user_empowered'::text, 'unresolved'::text])))
);


--
-- Name: character_temp_modifiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_temp_modifiers (
    character_id text NOT NULL,
    speed integer,
    evasion integer,
    damage_reduction integer,
    critical_range integer,
    terminal integer,
    ability_strength integer,
    ability_vitality integer,
    ability_agility integer,
    ability_acuity integer,
    ability_intelligence integer,
    ability_charisma integer,
    defense_might integer,
    defense_fortitude integer,
    defense_reflex integer,
    defense_discernment integer,
    defense_mental_fortitude integer,
    defense_resolve integer,
    apply_ability_to_resource_maxima boolean
);


--
-- Name: character_traits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_traits (
    character_id text NOT NULL,
    "position" integer NOT NULL,
    selection_role text NOT NULL,
    species_position smallint,
    trait_id text,
    source_id text,
    name_snapshot text,
    option_parent_trait_id text,
    option_parent_source_id text,
    current_uses integer,
    custom_name text,
    note text,
    CONSTRAINT character_traits_position_check CHECK (("position" > 0)),
    CONSTRAINT character_traits_selection_role_check CHECK ((selection_role = ANY (ARRAY['ancestry'::text, 'flaw'::text, 'characteristic'::text, 'species'::text, 'choice'::text, 'owned'::text, 'uses'::text, 'customization'::text]))),
    CONSTRAINT character_traits_species_position_check CHECK (((species_position IS NULL) OR (species_position = ANY (ARRAY[1, 2]))))
);


--
-- Name: characters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.characters (
    id text NOT NULL,
    user_id text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone,
    name text,
    level integer,
    archetype_name text,
    ancestry_name text,
    status text,
    visibility text DEFAULT 'private'::text NOT NULL,
    client_request_id uuid,
    experience integer,
    portrait text,
    gender text,
    description text,
    notes text,
    backstory text,
    appearance text,
    archetype_desc text,
    age text,
    height numeric,
    weight numeric,
    currency numeric,
    health_points integer,
    energy_points integer,
    innate_energy integer,
    training_points_spent numeric,
    current_health integer,
    current_energy integer,
    action_points integer,
    state_uses_current integer,
    unarmed_prowess integer,
    speed_base integer,
    evasion_base integer,
    pow_prof integer,
    mart_prof integer,
    pow_abil text,
    mart_abil text,
    archetype_category text,
    archetype_source_id text,
    archetype_id text,
    archetype_path_id_snapshot text,
    archetype_path_id text,
    ancestry_mixed boolean,
    ancestry_id_snapshot text,
    ancestry_name_snapshot text,
    ancestry_size text,
    ancestry_speed integer,
    ancestry_selected_size text,
    ancestry_flaw_species_source_id text,
    ancestry_mixed_height numeric,
    ancestry_mixed_weight numeric,
    ancestry_mixed_adulthood numeric,
    ancestry_mixed_max_age numeric,
    speed_display_unit text,
    library_powers_visible boolean,
    library_techniques_visible boolean,
    library_inventory_visible boolean,
    library_feats_visible boolean,
    library_proficiencies_visible boolean,
    library_notes_visible boolean,
    last_played_at timestamp(3) without time zone,
    ability_strength integer,
    ability_vitality integer,
    ability_agility integer,
    ability_acuity integer,
    ability_intelligence integer,
    ability_charisma integer,
    defense_might integer,
    defense_fortitude integer,
    defense_reflex integer,
    defense_discernment integer,
    defense_mental_fortitude integer,
    defense_resolve integer,
    CONSTRAINT characters_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'campaign'::text, 'public'::text])))
);


--
-- Name: COLUMN characters.client_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.characters.client_request_id IS 'Client-generated idempotency key for POST /api/characters (TASK-738). Null for rows created before the key existed or by callers that omit it.';


--
-- Name: codex_archetype_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_archetype_levels (
    id bigint NOT NULL,
    archetype_id text NOT NULL,
    level integer NOT NULL,
    feats text,
    skills text,
    powers text,
    techniques text,
    armaments text,
    equipment text,
    remove_feats text,
    remove_powers text,
    remove_techniques text,
    remove_armaments text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT codex_archetype_levels_level_check CHECK ((level >= 2))
);


--
-- Name: codex_archetype_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codex_archetype_levels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codex_archetype_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codex_archetype_levels_id_seq OWNED BY public.codex_archetype_levels.id;


--
-- Name: codex_archetypes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_archetypes (
    id text NOT NULL,
    name text,
    type text,
    description text,
    archetype_ability text,
    secondary_ability text,
    power_prof_start integer,
    martial_prof_start integer,
    power_prof_level5 integer,
    martial_prof_level5 integer,
    path_data jsonb,
    level1_feats text,
    level1_skills text,
    level1_powers text,
    level1_techniques text,
    level1_armaments text,
    level1_equipment text,
    level1_remove_feats text,
    level1_remove_powers text,
    level1_remove_techniques text,
    level1_remove_armaments text,
    level1_notes text,
    level1_recommend_unarmed_prowess boolean DEFAULT false NOT NULL,
    level1_guidance_groups jsonb,
    level1_recommended_abilities jsonb,
    level1_loadouts jsonb,
    level1_innate_powers text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL
);


--
-- Name: COLUMN codex_archetypes.level1_guidance_groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_archetypes.level1_guidance_groups IS 'JSON array of Layer 1 build-goal groups (feats/powers/techniques/armaments/equipment + why copy).';


--
-- Name: COLUMN codex_archetypes.level1_recommended_abilities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_archetypes.level1_recommended_abilities IS 'JSON object: ability name -> value for one-click apply in guided creator (e.g. {"strength":3,"vitality":2}).';


--
-- Name: COLUMN codex_archetypes.level1_loadouts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_archetypes.level1_loadouts IS 'JSON array of loadout objects { id, title, why, armaments[], armor[], equipment[] } for guided equipment step.';


--
-- Name: COLUMN codex_archetypes.level1_innate_powers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_archetypes.level1_innate_powers IS 'CSV of official power ids recommended as Innate Powers at Level 1 (guided creator). Distinct from level1_powers.';


--
-- Name: COLUMN codex_archetypes.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_archetypes.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_archetypes.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_archetypes.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: codex_change_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_change_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    operation text NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by_user_id uuid NOT NULL,
    before_data jsonb,
    after_data jsonb,
    changed_fields jsonb,
    CONSTRAINT codex_change_logs_operation_check CHECK ((operation = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text])))
);


--
-- Name: codex_creature_feats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_creature_feats (
    id text NOT NULL,
    name text,
    description text,
    feat_points numeric,
    feat_lvl integer,
    lvl_req integer,
    mechanic boolean,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL,
    base_feat_id text,
    category text
);


--
-- Name: COLUMN codex_creature_feats.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_creature_feats.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_creature_feats.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_creature_feats.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: COLUMN codex_creature_feats.base_feat_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_creature_feats.base_feat_id IS 'Level-1 creature feat id in this family. NULL on level-1 rows. Mirrors codex_feats.base_feat_id.';


--
-- Name: COLUMN codex_creature_feats.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_creature_feats.category IS 'Stored group label, same kind of field as codex_feats.category. Empty means no group.';


--
-- Name: codex_equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_equipment (
    id text NOT NULL,
    name text,
    description text,
    category text,
    currency numeric,
    rarity text,
    image_id uuid,
    image_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL
);


--
-- Name: COLUMN codex_equipment.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_equipment.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN codex_equipment.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_equipment.image_url IS 'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.';


--
-- Name: COLUMN codex_equipment.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_equipment.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_equipment.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_equipment.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: codex_feats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_feats (
    id text NOT NULL,
    name text,
    description text,
    req_desc text,
    ability_req text,
    abil_req_val text,
    skill_req text,
    skill_req_val text,
    feat_cat_req text,
    pow_abil_req integer,
    mart_abil_req integer,
    pow_prof_req integer,
    mart_prof_req integer,
    speed_req integer,
    feat_lvl integer,
    lvl_req integer,
    uses_per_rec integer,
    rec_period text,
    category text,
    ability text,
    tags text,
    char_feat boolean,
    state_feat boolean,
    base_feat_id text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL
);


--
-- Name: COLUMN codex_feats.base_feat_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_feats.base_feat_id IS 'Id of the level-1 feat. NULL for level-1; set for feat_lvl >= 2. Used to group leveled feats and validate prerequisites.';


--
-- Name: COLUMN codex_feats.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_feats.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_feats.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_feats.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: codex_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_parts (
    id text NOT NULL,
    name text,
    description text,
    category text,
    base_en numeric,
    base_tp numeric,
    op_1_desc text,
    op_1_en numeric,
    op_1_tp numeric,
    op_2_desc text,
    op_2_en numeric,
    op_2_tp numeric,
    op_3_desc text,
    op_3_en numeric,
    op_3_tp numeric,
    type text,
    mechanic boolean,
    percentage boolean,
    duration boolean,
    defense text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL
);


--
-- Name: COLUMN codex_parts.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_parts.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_parts.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_parts.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: codex_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_properties (
    id text NOT NULL,
    name text,
    description text,
    base_ip numeric,
    base_tp numeric,
    base_c numeric,
    op_1_desc text,
    op_1_ip numeric,
    op_1_tp numeric,
    op_1_c numeric,
    type text,
    mechanic boolean,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL
);


--
-- Name: COLUMN codex_properties.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_properties.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_properties.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_properties.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: codex_retired_ids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_retired_ids (
    entity_type text NOT NULL,
    id text NOT NULL,
    retired_at timestamp with time zone DEFAULT now() NOT NULL,
    retired_by text
);


--
-- Name: TABLE codex_retired_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.codex_retired_ids IS 'Tombstones for deleted codex/official entity ids. Id allocation must never reuse an id present here. Service-role access only (RLS enabled, no policies).';


--
-- Name: codex_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_skills (
    id text NOT NULL,
    name text,
    description text,
    ability text,
    base_skill text,
    success_desc text,
    failure_desc text,
    ds_calc text,
    craft_failure_desc text,
    craft_success_desc text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL
);


--
-- Name: COLUMN codex_skills.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_skills.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_skills.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_skills.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: codex_species; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_species (
    id text NOT NULL,
    name text,
    description text,
    type text,
    sizes text,
    skills text,
    species_traits text,
    ancestry_traits text,
    flaws text,
    characteristics text,
    ave_hgt_cm numeric,
    ave_wgt_kg numeric,
    adulthood_lifespan text,
    languages text,
    is_starter boolean DEFAULT false NOT NULL,
    image_url text,
    image_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    catalog_listing text DEFAULT 'listed'::text NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL,
    CONSTRAINT codex_species_catalog_listing_check CHECK ((catalog_listing = ANY (ARRAY['listed'::text, 'unlisted'::text])))
);


--
-- Name: COLUMN codex_species.is_starter; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_species.is_starter IS 'When true, species appears in the guided creator Layer 1 starter set.';


--
-- Name: COLUMN codex_species.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_species.image_url IS 'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.';


--
-- Name: COLUMN codex_species.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_species.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN codex_species.catalog_listing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_species.catalog_listing IS 'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).';


--
-- Name: COLUMN codex_species.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_species.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_species.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_species.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: codex_traits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codex_traits (
    id text NOT NULL,
    name text,
    description text,
    uses_per_rec integer,
    rec_period text,
    flaw boolean,
    characteristic boolean,
    option_trait_ids text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text,
    sources text[] DEFAULT ARRAY['Core'::text] NOT NULL
);


--
-- Name: COLUMN codex_traits.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_traits.source IS 'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.';


--
-- Name: COLUMN codex_traits.sources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_traits.sources IS 'Content packs this entry belongs to. Display names, one or more. Default {Core}.';


--
-- Name: core_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.core_rules (
    id text NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- Name: crafting_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crafting_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    item_name text,
    currency_cost numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: encounters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounters (
    id text NOT NULL,
    user_id text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone,
    name text,
    type text,
    status text
);


--
-- Name: official_creatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_creatures (
    id text NOT NULL,
    name text,
    description text,
    level integer,
    type text,
    size text,
    hit_points integer,
    energy_points integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb,
    image_id uuid,
    image_url text,
    catalog_listing text DEFAULT 'listed'::text NOT NULL,
    CONSTRAINT official_creatures_catalog_listing_check CHECK ((catalog_listing = ANY (ARRAY['listed'::text, 'unlisted'::text])))
);


--
-- Name: COLUMN official_creatures.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_creatures.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN official_creatures.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_creatures.image_url IS 'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.';


--
-- Name: COLUMN official_creatures.catalog_listing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_creatures.catalog_listing IS 'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).';


--
-- Name: official_empowered_techniques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_empowered_techniques (
    id text NOT NULL,
    name text,
    description text,
    action_type text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    range_steps integer,
    duration_type text,
    duration_value integer,
    damage jsonb DEFAULT '[]'::jsonb NOT NULL,
    image_id uuid,
    image_url text,
    catalog_listing text DEFAULT 'listed'::text NOT NULL,
    CONSTRAINT official_empowered_techniques_catalog_listing_check CHECK ((catalog_listing = ANY (ARRAY['listed'::text, 'unlisted'::text])))
);


--
-- Name: COLUMN official_empowered_techniques.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_empowered_techniques.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN official_empowered_techniques.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_empowered_techniques.image_url IS 'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.';


--
-- Name: COLUMN official_empowered_techniques.catalog_listing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_empowered_techniques.catalog_listing IS 'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).';


--
-- Name: official_enhanced_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_enhanced_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    currency_cost numeric(12,2) NOT NULL,
    rarity text NOT NULL,
    base_item_source text NOT NULL,
    base_item_id text,
    base_item_name text NOT NULL,
    base_item_description text,
    power_source text NOT NULL,
    power_id text NOT NULL,
    power_name text NOT NULL,
    uses_type text NOT NULL,
    uses_count integer,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    catalog_listing text DEFAULT 'listed'::text NOT NULL,
    CONSTRAINT official_enhanced_items_catalog_listing_check CHECK ((catalog_listing = ANY (ARRAY['listed'::text, 'unlisted'::text])))
);


--
-- Name: COLUMN official_enhanced_items.catalog_listing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_enhanced_items.catalog_listing IS 'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).';


--
-- Name: official_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_items (
    id text NOT NULL,
    name text,
    description text,
    type text,
    rarity text,
    armor_value integer,
    damage_reduction integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb,
    range_steps integer,
    is_two_handed boolean,
    ability_requirement jsonb,
    costs jsonb,
    damage jsonb DEFAULT '[]'::jsonb NOT NULL,
    properties jsonb DEFAULT '[]'::jsonb NOT NULL,
    agility_reduction integer,
    critical_range_increase integer,
    shield_dr jsonb,
    shield_damage jsonb,
    image_url text,
    image_id uuid,
    catalog_listing text DEFAULT 'listed'::text NOT NULL,
    CONSTRAINT official_items_catalog_listing_check CHECK ((catalog_listing = ANY (ARRAY['listed'::text, 'unlisted'::text])))
);


--
-- Name: COLUMN official_items.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_items.image_url IS 'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.';


--
-- Name: COLUMN official_items.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_items.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN official_items.catalog_listing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_items.catalog_listing IS 'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).';


--
-- Name: official_powers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_powers (
    id text NOT NULL,
    name text,
    description text,
    action_type text,
    is_reaction boolean DEFAULT false,
    innate boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb,
    range_steps integer,
    duration_type text,
    duration_value integer,
    area_type text,
    area_level integer,
    damage jsonb DEFAULT '[]'::jsonb,
    image_id uuid,
    image_url text,
    catalog_listing text DEFAULT 'listed'::text NOT NULL,
    CONSTRAINT official_powers_catalog_listing_check CHECK ((catalog_listing = ANY (ARRAY['listed'::text, 'unlisted'::text])))
);


--
-- Name: COLUMN official_powers.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_powers.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN official_powers.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_powers.image_url IS 'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.';


--
-- Name: COLUMN official_powers.catalog_listing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_powers.catalog_listing IS 'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).';


--
-- Name: official_techniques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_techniques (
    id text NOT NULL,
    name text,
    description text,
    action_type text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb,
    range_steps integer,
    duration_type text,
    duration_value integer,
    damage jsonb DEFAULT '[]'::jsonb NOT NULL,
    image_id uuid,
    image_url text,
    catalog_listing text DEFAULT 'listed'::text NOT NULL,
    CONSTRAINT official_techniques_catalog_listing_check CHECK ((catalog_listing = ANY (ARRAY['listed'::text, 'unlisted'::text])))
);


--
-- Name: COLUMN official_techniques.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_techniques.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN official_techniques.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_techniques.image_url IS 'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.';


--
-- Name: COLUMN official_techniques.catalog_listing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.official_techniques.catalog_listing IS 'listed = Public library catalogs; unlisted = Admin library (not in player catalogs; still readable by id).';


--
-- Name: realms_image_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realms_image_categories (
    image_id uuid NOT NULL,
    category public.realms_image_category NOT NULL
);


--
-- Name: TABLE realms_image_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.realms_image_categories IS 'Multi category tags for Realms Image Library assets. Empowered pickers filter power OR technique.';


--
-- Name: realms_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realms_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    storage_path text NOT NULL,
    public_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE realms_images; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.realms_images IS 'Realms Image Library master assets (ADR-0003). One Storage object per row; consumers reference via image_id.';


--
-- Name: COLUMN realms_images.storage_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.realms_images.storage_path IS 'Path within codex-art bucket, typically library/{id}.{ext}. Not entity-tied.';


--
-- Name: COLUMN realms_images.public_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.realms_images.public_url IS 'Public CDN URL for the Storage object. Cache-busted on replace by API.';


--
-- Name: role_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_policies (
    role public."UserRole" NOT NULL,
    max_campaigns integer NOT NULL,
    max_players_per_campaign integer NOT NULL,
    max_characters integer NOT NULL,
    max_custom_powers integer NOT NULL,
    max_custom_techniques integer NOT NULL,
    max_custom_armaments integer NOT NULL,
    max_custom_creatures integer NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: user_creatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_creatures (
    id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone,
    name text,
    description text,
    level integer,
    type text,
    size text,
    hit_points integer,
    energy_points integer,
    payload jsonb DEFAULT '{}'::jsonb,
    image_id uuid,
    image_url text
);


--
-- Name: COLUMN user_creatures.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_creatures.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN user_creatures.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_creatures.image_url IS 'Denormalized public URL cache synced when the bank master is replaced.';


--
-- Name: user_empowered_techniques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_empowered_techniques (
    id text NOT NULL,
    user_id text NOT NULL,
    name text,
    description text,
    action_type text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    range_steps integer,
    duration_type text,
    duration_value integer,
    damage jsonb DEFAULT '[]'::jsonb NOT NULL,
    image_id uuid,
    image_url text
);


--
-- Name: COLUMN user_empowered_techniques.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_empowered_techniques.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN user_empowered_techniques.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_empowered_techniques.image_url IS 'Denormalized public URL cache synced when the bank master is replaced.';


--
-- Name: user_enhanced_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_enhanced_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_items (
    id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone,
    name text,
    description text,
    type text,
    rarity text,
    armor_value integer,
    damage_reduction integer,
    payload jsonb DEFAULT '{}'::jsonb,
    range_steps integer,
    is_two_handed boolean,
    ability_requirement jsonb,
    costs jsonb,
    damage jsonb DEFAULT '[]'::jsonb NOT NULL,
    properties jsonb DEFAULT '[]'::jsonb NOT NULL,
    agility_reduction integer,
    critical_range_increase integer,
    shield_dr jsonb,
    shield_damage jsonb,
    image_id uuid,
    image_url text
);


--
-- Name: COLUMN user_items.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_items.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN user_items.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_items.image_url IS 'Denormalized public URL cache synced when the bank master is replaced.';


--
-- Name: user_powers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_powers (
    id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone,
    name text,
    description text,
    action_type text,
    is_reaction boolean DEFAULT false,
    innate boolean DEFAULT false,
    payload jsonb DEFAULT '{}'::jsonb,
    range_steps integer,
    duration_type text,
    duration_value integer,
    area_type text,
    area_level integer,
    damage jsonb DEFAULT '[]'::jsonb NOT NULL,
    image_id uuid,
    image_url text
);


--
-- Name: COLUMN user_powers.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_powers.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN user_powers.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_powers.image_url IS 'Denormalized public URL cache synced when the bank master is replaced.';


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id text NOT NULL,
    email text,
    display_name text,
    username text,
    photo_url text,
    last_username_change timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    role public."UserRole" DEFAULT 'new_player'::public."UserRole" NOT NULL,
    username_display text
);


--
-- Name: user_species; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_species (
    id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone,
    name text,
    description text,
    type text,
    sizes text,
    skills text,
    species_traits text,
    ancestry_traits text,
    flaws text,
    characteristics text,
    ave_hgt_cm numeric,
    ave_wgt_kg numeric,
    adulthood_lifespan text,
    languages text,
    payload jsonb DEFAULT '{}'::jsonb,
    image_id uuid,
    image_url text
);


--
-- Name: COLUMN user_species.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_species.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN user_species.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_species.image_url IS 'Denormalized public URL cache synced when the bank master is replaced.';


--
-- Name: user_techniques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_techniques (
    id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone,
    name text,
    description text,
    action_type text,
    payload jsonb DEFAULT '{}'::jsonb,
    range_steps integer,
    duration_type text,
    duration_value integer,
    damage jsonb DEFAULT '[]'::jsonb NOT NULL,
    image_id uuid,
    image_url text
);


--
-- Name: COLUMN user_techniques.image_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_techniques.image_id IS 'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.';


--
-- Name: COLUMN user_techniques.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_techniques.image_url IS 'Denormalized public URL cache synced when the bank master is replaced.';


--
-- Name: usernames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usernames (
    username text NOT NULL,
    user_id text NOT NULL
);


--
-- Name: vtt_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vtt_actions (
    id text NOT NULL,
    scene_id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    token_id text,
    from_x numeric,
    from_y numeric,
    to_x numeric NOT NULL,
    to_y numeric NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vtt_actions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'dismissed'::text]))),
    CONSTRAINT vtt_actions_type_check CHECK ((type = ANY (ARRAY['ping'::text, 'move-request'::text])))
);


--
-- Name: vtt_scenes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vtt_scenes (
    id text NOT NULL,
    campaign_id text NOT NULL,
    encounter_id text,
    name text DEFAULT 'Tabletop Scene'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    map jsonb,
    grid jsonb DEFAULT '{"snap": true, "color": "#94a3b8", "enabled": true, "offsetX": 0, "offsetY": 0, "opacity": 0.45, "cellSize": 70}'::jsonb NOT NULL,
    fog jsonb DEFAULT '{"enabled": false, "regions": []}'::jsonb NOT NULL,
    settings jsonb DEFAULT '{"showEnemyResources": false}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vtt_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vtt_tokens (
    id text NOT NULL,
    scene_id text NOT NULL,
    combatant_id text,
    name text NOT NULL,
    label text DEFAULT '?'::text NOT NULL,
    x numeric DEFAULT 0 NOT NULL,
    y numeric DEFAULT 0 NOT NULL,
    size numeric DEFAULT 56 NOT NULL,
    color text DEFAULT '#64748b'::text NOT NULL,
    image_url text,
    visible boolean DEFAULT true NOT NULL,
    locked boolean DEFAULT false NOT NULL,
    combatant_type text DEFAULT 'enemy'::text NOT NULL,
    source_type text,
    source_id text,
    source_user_id text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2026_11_17; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_11_17 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_11_18; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_11_18 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_11_19; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_11_19 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_11_20; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_11_20 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_11_21; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_11_21 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_11_22; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_11_22 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_11_23; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_11_23 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bucket_lifecycle_states; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.bucket_lifecycle_states (
    bucket_id text NOT NULL,
    generation uuid,
    next_run_at timestamp with time zone,
    claim_id uuid,
    claim_until timestamp with time zone,
    continuation jsonb,
    last_started_at timestamp with time zone,
    last_completed_at timestamp with time zone,
    last_success_at timestamp with time zone,
    last_result jsonb,
    failure_count integer DEFAULT 0 NOT NULL,
    last_error jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bucket_lifecycle_continuation_object_check CHECK (((continuation IS NULL) OR (jsonb_typeof(continuation) = 'object'::text))),
    CONSTRAINT bucket_lifecycle_failure_count_check CHECK ((failure_count >= 0)),
    CONSTRAINT bucket_lifecycle_last_result_object_check CHECK (((last_result IS NULL) OR (jsonb_typeof(last_result) = 'object'::text))),
    CONSTRAINT bucket_lifecycle_recovery_due_check CHECK (((next_run_at IS NOT NULL) OR (NOT jsonb_path_exists(COALESCE(continuation, '{}'::jsonb), '$."batch"."inFlight"'::jsonpath))))
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
    versioning_status text DEFAULT 'DISABLED'::text NOT NULL,
    lifecycle_configuration jsonb,
    lifecycle_configuration_generation uuid,
    CONSTRAINT buckets_lifecycle_configuration_pair_check CHECK (((lifecycle_configuration IS NULL) = (lifecycle_configuration_generation IS NULL))),
    CONSTRAINT buckets_lifecycle_configuration_shape_check CHECK (((lifecycle_configuration IS NULL) OR ((jsonb_typeof(lifecycle_configuration) = 'object'::text) AND (lifecycle_configuration ? 'rules'::text) AND
CASE
    WHEN (jsonb_typeof((lifecycle_configuration -> 'rules'::text)) = 'array'::text) THEN ((jsonb_array_length((lifecycle_configuration -> 'rules'::text)) >= 1) AND (jsonb_array_length((lifecycle_configuration -> 'rules'::text)) <= 1000))
    ELSE false
END))),
    CONSTRAINT buckets_lifecycle_configuration_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR ((lifecycle_configuration IS NULL) AND (lifecycle_configuration_generation IS NULL)))),
    CONSTRAINT buckets_versioning_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR (versioning_status = 'DISABLED'::text))),
    CONSTRAINT buckets_versioning_status_check CHECK ((versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])))
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lifecycle_abandoned_artifacts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.lifecycle_abandoned_artifacts (
    bucket_id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    version text,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    archived_at timestamp with time zone,
    is_delete_marker boolean DEFAULT false NOT NULL,
    is_versioned boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text,
    created_by text,
    idempotency_key text,
    rollback text[]
);


--
-- Name: messages_2026_11_17; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_11_17 FOR VALUES FROM ('2026-11-17 00:00:00') TO ('2026-11-18 00:00:00');


--
-- Name: messages_2026_11_18; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_11_18 FOR VALUES FROM ('2026-11-18 00:00:00') TO ('2026-11-19 00:00:00');


--
-- Name: messages_2026_11_19; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_11_19 FOR VALUES FROM ('2026-11-19 00:00:00') TO ('2026-11-20 00:00:00');


--
-- Name: messages_2026_11_20; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_11_20 FOR VALUES FROM ('2026-11-20 00:00:00') TO ('2026-11-21 00:00:00');


--
-- Name: messages_2026_11_21; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_11_21 FOR VALUES FROM ('2026-11-21 00:00:00') TO ('2026-11-22 00:00:00');


--
-- Name: messages_2026_11_22; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_11_22 FOR VALUES FROM ('2026-11-22 00:00:00') TO ('2026-11-23 00:00:00');


--
-- Name: messages_2026_11_23; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_11_23 FOR VALUES FROM ('2026-11-23 00:00:00') TO ('2026-11-24 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: codex_archetype_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_archetype_levels ALTER COLUMN id SET DEFAULT nextval('public.codex_archetype_levels_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_key UNIQUE (mfa_factor_id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_pkey PRIMARY KEY (id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_key UNIQUE (user_id);


--
-- Name: mfa_recovery_codes mfa_recovery_codes_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: scim_tokens scim_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_pkey PRIMARY KEY (id);


--
-- Name: scim_users scim_users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: admin_role_audit admin_role_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_role_audit
    ADD CONSTRAINT admin_role_audit_pkey PRIMARY KEY (id);


--
-- Name: campaign_members campaign_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_members
    ADD CONSTRAINT campaign_members_pkey PRIMARY KEY (campaign_id, user_id);


--
-- Name: campaign_rolls campaign_rolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_rolls
    ADD CONSTRAINT campaign_rolls_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: character_ability_components character_ability_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_ability_components
    ADD CONSTRAINT character_ability_components_pkey PRIMARY KEY (character_id, component_kind);


--
-- Name: character_affiliations character_affiliations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_affiliations
    ADD CONSTRAINT character_affiliations_pkey PRIMARY KEY (character_id, affiliation_kind, "position");


--
-- Name: character_archetype_choices character_archetype_choices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_archetype_choices
    ADD CONSTRAINT character_archetype_choices_pkey PRIMARY KEY (character_id, milestone_level);


--
-- Name: character_conditions character_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_conditions
    ADD CONSTRAINT character_conditions_pkey PRIMARY KEY (character_id, "position");


--
-- Name: character_feats character_feats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_feats
    ADD CONSTRAINT character_feats_pkey PRIMARY KEY (character_id, feat_kind, "position");


--
-- Name: character_inventory character_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_inventory
    ADD CONSTRAINT character_inventory_pkey PRIMARY KEY (character_id, category, "position");


--
-- Name: character_library_section_preferences character_library_section_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_library_section_preferences
    ADD CONSTRAINT character_library_section_preferences_pkey PRIMARY KEY (character_id, section_id);


--
-- Name: character_named_notes character_named_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_named_notes
    ADD CONSTRAINT character_named_notes_pkey PRIMARY KEY (character_id, "position");


--
-- Name: character_note_section_preferences character_note_section_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_note_section_preferences
    ADD CONSTRAINT character_note_section_preferences_pkey PRIMARY KEY (character_id, section_id);


--
-- Name: character_powers character_powers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_powers
    ADD CONSTRAINT character_powers_pkey PRIMARY KEY (character_id, "position");


--
-- Name: character_proficiencies character_proficiencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_proficiencies
    ADD CONSTRAINT character_proficiencies_pkey PRIMARY KEY (character_id, "position");


--
-- Name: character_skills character_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_pkey PRIMARY KEY (character_id, "position");


--
-- Name: character_species character_species_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_species
    ADD CONSTRAINT character_species_pkey PRIMARY KEY (character_id, "position");


--
-- Name: character_techniques character_techniques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_techniques
    ADD CONSTRAINT character_techniques_pkey PRIMARY KEY (character_id, "position");


--
-- Name: character_temp_modifiers character_temp_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_temp_modifiers
    ADD CONSTRAINT character_temp_modifiers_pkey PRIMARY KEY (character_id);


--
-- Name: character_traits character_traits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_traits
    ADD CONSTRAINT character_traits_pkey PRIMARY KEY (character_id, "position");


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: codex_archetype_levels codex_archetype_levels_archetype_id_level_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_archetype_levels
    ADD CONSTRAINT codex_archetype_levels_archetype_id_level_key UNIQUE (archetype_id, level);


--
-- Name: codex_archetype_levels codex_archetype_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_archetype_levels
    ADD CONSTRAINT codex_archetype_levels_pkey PRIMARY KEY (id);


--
-- Name: codex_archetypes codex_archetypes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_archetypes
    ADD CONSTRAINT codex_archetypes_pkey PRIMARY KEY (id);


--
-- Name: codex_change_logs codex_change_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_change_logs
    ADD CONSTRAINT codex_change_logs_pkey PRIMARY KEY (id);


--
-- Name: codex_creature_feats codex_creature_feats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_creature_feats
    ADD CONSTRAINT codex_creature_feats_pkey PRIMARY KEY (id);


--
-- Name: codex_equipment codex_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_equipment
    ADD CONSTRAINT codex_equipment_pkey PRIMARY KEY (id);


--
-- Name: codex_feats codex_feats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_feats
    ADD CONSTRAINT codex_feats_pkey PRIMARY KEY (id);


--
-- Name: codex_parts codex_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_parts
    ADD CONSTRAINT codex_parts_pkey PRIMARY KEY (id);


--
-- Name: codex_properties codex_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_properties
    ADD CONSTRAINT codex_properties_pkey PRIMARY KEY (id);


--
-- Name: codex_retired_ids codex_retired_ids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_retired_ids
    ADD CONSTRAINT codex_retired_ids_pkey PRIMARY KEY (entity_type, id);


--
-- Name: codex_skills codex_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_skills
    ADD CONSTRAINT codex_skills_pkey PRIMARY KEY (id);


--
-- Name: codex_species codex_species_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_species
    ADD CONSTRAINT codex_species_pkey PRIMARY KEY (id);


--
-- Name: codex_traits codex_traits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_traits
    ADD CONSTRAINT codex_traits_pkey PRIMARY KEY (id);


--
-- Name: core_rules core_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_rules
    ADD CONSTRAINT core_rules_pkey PRIMARY KEY (id);


--
-- Name: crafting_sessions crafting_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crafting_sessions
    ADD CONSTRAINT crafting_sessions_pkey PRIMARY KEY (id);


--
-- Name: encounters encounters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_pkey PRIMARY KEY (id);


--
-- Name: official_creatures official_creatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_creatures
    ADD CONSTRAINT official_creatures_pkey PRIMARY KEY (id);


--
-- Name: official_empowered_techniques official_empowered_techniques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_empowered_techniques
    ADD CONSTRAINT official_empowered_techniques_pkey PRIMARY KEY (id);


--
-- Name: official_enhanced_items official_enhanced_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_enhanced_items
    ADD CONSTRAINT official_enhanced_items_pkey PRIMARY KEY (id);


--
-- Name: official_items official_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_items
    ADD CONSTRAINT official_items_pkey PRIMARY KEY (id);


--
-- Name: official_powers official_powers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_powers
    ADD CONSTRAINT official_powers_pkey PRIMARY KEY (id);


--
-- Name: official_techniques official_techniques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_techniques
    ADD CONSTRAINT official_techniques_pkey PRIMARY KEY (id);


--
-- Name: realms_image_categories realms_image_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realms_image_categories
    ADD CONSTRAINT realms_image_categories_pkey PRIMARY KEY (image_id, category);


--
-- Name: realms_images realms_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realms_images
    ADD CONSTRAINT realms_images_pkey PRIMARY KEY (id);


--
-- Name: realms_images realms_images_storage_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realms_images
    ADD CONSTRAINT realms_images_storage_path_key UNIQUE (storage_path);


--
-- Name: role_policies role_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_policies
    ADD CONSTRAINT role_policies_pkey PRIMARY KEY (role);


--
-- Name: user_creatures user_creatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_creatures
    ADD CONSTRAINT user_creatures_pkey PRIMARY KEY (id);


--
-- Name: user_empowered_techniques user_empowered_techniques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_empowered_techniques
    ADD CONSTRAINT user_empowered_techniques_pkey PRIMARY KEY (id);


--
-- Name: user_enhanced_items user_enhanced_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_enhanced_items
    ADD CONSTRAINT user_enhanced_items_pkey PRIMARY KEY (id);


--
-- Name: user_items user_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_items
    ADD CONSTRAINT user_items_pkey PRIMARY KEY (id);


--
-- Name: user_powers user_powers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_powers
    ADD CONSTRAINT user_powers_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_species user_species_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_species
    ADD CONSTRAINT user_species_pkey PRIMARY KEY (id);


--
-- Name: user_techniques user_techniques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_techniques
    ADD CONSTRAINT user_techniques_pkey PRIMARY KEY (id);


--
-- Name: usernames usernames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usernames
    ADD CONSTRAINT usernames_pkey PRIMARY KEY (username);


--
-- Name: vtt_actions vtt_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_actions
    ADD CONSTRAINT vtt_actions_pkey PRIMARY KEY (id);


--
-- Name: vtt_scenes vtt_scenes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_scenes
    ADD CONSTRAINT vtt_scenes_pkey PRIMARY KEY (id);


--
-- Name: vtt_tokens vtt_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_tokens
    ADD CONSTRAINT vtt_tokens_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_11_17 messages_2026_11_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_11_17
    ADD CONSTRAINT messages_2026_11_17_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_11_18 messages_2026_11_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_11_18
    ADD CONSTRAINT messages_2026_11_18_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_11_19 messages_2026_11_19_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_11_19
    ADD CONSTRAINT messages_2026_11_19_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_11_20 messages_2026_11_20_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_11_20
    ADD CONSTRAINT messages_2026_11_20_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_11_21 messages_2026_11_21_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_11_21
    ADD CONSTRAINT messages_2026_11_21_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_11_22 messages_2026_11_22_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_11_22
    ADD CONSTRAINT messages_2026_11_22_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_11_23 messages_2026_11_23_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_11_23
    ADD CONSTRAINT messages_2026_11_23_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: bucket_lifecycle_states bucket_lifecycle_states_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.bucket_lifecycle_states
    ADD CONSTRAINT bucket_lifecycle_states_pkey PRIMARY KEY (bucket_id);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: lifecycle_abandoned_artifacts lifecycle_abandoned_artifacts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.lifecycle_abandoned_artifacts
    ADD CONSTRAINT lifecycle_abandoned_artifacts_pkey PRIMARY KEY (bucket_id, key);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_idempotency_key_key; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: mfa_recovery_codes_set_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_recovery_codes_set_id_idx ON auth.mfa_recovery_codes USING btree (mfa_recovery_code_set_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_link_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_link_token_hash_hash_idx ON auth.one_time_tokens USING hash (link_token_hash);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: scim_tokens_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_tokens_expires_at_idx ON auth.scim_tokens USING btree (expires_at);


--
-- Name: scim_tokens_revoked_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_tokens_revoked_at_idx ON auth.scim_tokens USING btree (revoked_at);


--
-- Name: scim_tokens_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_tokens_sso_provider_id_idx ON auth.scim_tokens USING btree (sso_provider_id);


--
-- Name: scim_tokens_token_hash_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX scim_tokens_token_hash_key ON auth.scim_tokens USING btree (token_hash);


--
-- Name: scim_users_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_created_at_idx ON auth.scim_users USING btree (sso_provider_id, created_at, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_deleted_at_idx ON auth.scim_users USING btree (deleted_at);


--
-- Name: scim_users_external_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX scim_users_external_id_key ON auth.scim_users USING btree (sso_provider_id, external_id) WHERE ((external_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: scim_users_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_id_idx ON auth.scim_users USING btree (sso_provider_id, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_sso_provider_id_idx ON auth.scim_users USING btree (sso_provider_id);


--
-- Name: scim_users_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_updated_at_idx ON auth.scim_users USING btree (sso_provider_id, updated_at, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_user_id_idx ON auth.scim_users USING btree (user_id);


--
-- Name: scim_users_user_name_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_user_name_idx ON auth.scim_users USING btree (sso_provider_id, user_name COLLATE "C", id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_user_name_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX scim_users_user_name_key ON auth.scim_users USING btree (sso_provider_id, user_name) WHERE (deleted_at IS NULL);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: campaign_members_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_members_campaign_id_idx ON public.campaign_members USING btree (campaign_id);


--
-- Name: campaign_members_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_members_user_id_idx ON public.campaign_members USING btree (user_id);


--
-- Name: campaign_rolls_campaign_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_rolls_campaign_id_created_at_idx ON public.campaign_rolls USING btree (campaign_id, created_at);


--
-- Name: campaign_rolls_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_rolls_campaign_id_idx ON public.campaign_rolls USING btree (campaign_id);


--
-- Name: campaigns_invite_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_invite_code_idx ON public.campaigns USING btree (invite_code);


--
-- Name: campaigns_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_owner_id_idx ON public.campaigns USING btree (owner_id);


--
-- Name: character_feats_feat_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_feats_feat_id_idx ON public.character_feats USING btree (feat_id);


--
-- Name: character_feats_source_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX character_feats_source_unique_idx ON public.character_feats USING btree (character_id, feat_kind, source_id) WHERE (source_id IS NOT NULL);


--
-- Name: character_inventory_codex_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_inventory_codex_idx ON public.character_inventory USING btree (codex_equipment_id);


--
-- Name: character_inventory_inventory_row_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX character_inventory_inventory_row_id_key ON public.character_inventory USING btree (inventory_row_id);


--
-- Name: character_inventory_official_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_inventory_official_idx ON public.character_inventory USING btree (official_item_id);


--
-- Name: character_inventory_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_inventory_user_idx ON public.character_inventory USING btree (user_item_id);


--
-- Name: character_note_section_position_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX character_note_section_position_unique_idx ON public.character_note_section_preferences USING btree (character_id, "position") WHERE ("position" IS NOT NULL);


--
-- Name: character_powers_official_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_powers_official_idx ON public.character_powers USING btree (official_power_id);


--
-- Name: character_powers_source_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX character_powers_source_unique_idx ON public.character_powers USING btree (character_id, source_id) WHERE (source_id IS NOT NULL);


--
-- Name: character_powers_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_powers_user_idx ON public.character_powers USING btree (user_power_id);


--
-- Name: character_proficiencies_part_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_proficiencies_part_idx ON public.character_proficiencies USING btree (part_id);


--
-- Name: character_proficiencies_property_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_proficiencies_property_idx ON public.character_proficiencies USING btree (property_id);


--
-- Name: character_proficiencies_source_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX character_proficiencies_source_unique_idx ON public.character_proficiencies USING btree (character_id, source_id) WHERE (source_id IS NOT NULL);


--
-- Name: character_skills_base_skill_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_skills_base_skill_idx ON public.character_skills USING btree (selected_base_skill_id);


--
-- Name: character_skills_skill_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_skills_skill_id_idx ON public.character_skills USING btree (skill_id);


--
-- Name: character_skills_source_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX character_skills_source_unique_idx ON public.character_skills USING btree (character_id, source_id) WHERE (source_id IS NOT NULL);


--
-- Name: character_species_codex_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_species_codex_idx ON public.character_species USING btree (codex_species_id);


--
-- Name: character_species_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_species_user_idx ON public.character_species USING btree (user_species_id);


--
-- Name: character_techniques_official_empowered_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_techniques_official_empowered_idx ON public.character_techniques USING btree (official_empowered_id);


--
-- Name: character_techniques_official_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_techniques_official_idx ON public.character_techniques USING btree (official_technique_id);


--
-- Name: character_techniques_source_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX character_techniques_source_unique_idx ON public.character_techniques USING btree (character_id, source_id) WHERE (source_id IS NOT NULL);


--
-- Name: character_techniques_user_empowered_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_techniques_user_empowered_idx ON public.character_techniques USING btree (user_empowered_id);


--
-- Name: character_techniques_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_techniques_user_idx ON public.character_techniques USING btree (user_technique_id);


--
-- Name: character_traits_option_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_traits_option_parent_idx ON public.character_traits USING btree (option_parent_trait_id);


--
-- Name: character_traits_trait_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX character_traits_trait_id_idx ON public.character_traits USING btree (trait_id);


--
-- Name: characters_archetype_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_archetype_id_idx ON public.characters USING btree (archetype_id);


--
-- Name: characters_archetype_path_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_archetype_path_id_idx ON public.characters USING btree (archetype_path_id);


--
-- Name: characters_user_client_request_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX characters_user_client_request_id_key ON public.characters USING btree (user_id, client_request_id) WHERE (client_request_id IS NOT NULL);


--
-- Name: characters_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_user_id_idx ON public.characters USING btree (user_id);


--
-- Name: characters_user_id_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_user_id_updated_at_idx ON public.characters USING btree (user_id, updated_at);


--
-- Name: codex_archetypes_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_archetypes_sources_gin ON public.codex_archetypes USING gin (sources);


--
-- Name: codex_creature_feats_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_creature_feats_sources_gin ON public.codex_creature_feats USING gin (sources);


--
-- Name: codex_equipment_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_equipment_sources_gin ON public.codex_equipment USING gin (sources);


--
-- Name: codex_feats_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_feats_sources_gin ON public.codex_feats USING gin (sources);


--
-- Name: codex_parts_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_parts_sources_gin ON public.codex_parts USING gin (sources);


--
-- Name: codex_properties_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_properties_sources_gin ON public.codex_properties USING gin (sources);


--
-- Name: codex_skills_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_skills_sources_gin ON public.codex_skills USING gin (sources);


--
-- Name: codex_species_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_species_sources_gin ON public.codex_species USING gin (sources);


--
-- Name: codex_traits_sources_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX codex_traits_sources_gin ON public.codex_traits USING gin (sources);


--
-- Name: encounters_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_user_id_idx ON public.encounters USING btree (user_id);


--
-- Name: encounters_user_id_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX encounters_user_id_updated_at_idx ON public.encounters USING btree (user_id, updated_at);


--
-- Name: idx_admin_role_audit_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_role_audit_target ON public.admin_role_audit USING btree (target_id, created_at DESC);


--
-- Name: idx_characters_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_characters_visibility ON public.characters USING btree (visibility);


--
-- Name: idx_codex_change_logs_changed_by_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codex_change_logs_changed_by_changed_at ON public.codex_change_logs USING btree (changed_by_user_id, changed_at DESC);


--
-- Name: idx_codex_change_logs_entity_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codex_change_logs_entity_changed_at ON public.codex_change_logs USING btree (entity_type, entity_id, changed_at DESC);


--
-- Name: idx_codex_change_logs_entity_type_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codex_change_logs_entity_type_changed_at ON public.codex_change_logs USING btree (entity_type, changed_at DESC);


--
-- Name: idx_codex_equipment_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codex_equipment_image_id ON public.codex_equipment USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_codex_species_catalog_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codex_species_catalog_listing ON public.codex_species USING btree (catalog_listing);


--
-- Name: idx_codex_species_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codex_species_image_id ON public.codex_species USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_crafting_sessions_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crafting_sessions_updated_at ON public.crafting_sessions USING btree (updated_at DESC);


--
-- Name: idx_crafting_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crafting_sessions_user_id ON public.crafting_sessions USING btree (user_id);


--
-- Name: idx_official_creatures_catalog_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_creatures_catalog_listing ON public.official_creatures USING btree (catalog_listing);


--
-- Name: idx_official_creatures_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_creatures_image_id ON public.official_creatures USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_official_empowered_techniques_catalog_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_empowered_techniques_catalog_listing ON public.official_empowered_techniques USING btree (catalog_listing);


--
-- Name: idx_official_empowered_techniques_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_empowered_techniques_image_id ON public.official_empowered_techniques USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_official_enhanced_items_base_item_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_enhanced_items_base_item_name ON public.official_enhanced_items USING btree (lower(base_item_name));


--
-- Name: idx_official_enhanced_items_catalog_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_enhanced_items_catalog_listing ON public.official_enhanced_items USING btree (catalog_listing);


--
-- Name: idx_official_enhanced_items_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_enhanced_items_name ON public.official_enhanced_items USING btree (lower(name));


--
-- Name: idx_official_enhanced_items_power_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_enhanced_items_power_name ON public.official_enhanced_items USING btree (lower(power_name));


--
-- Name: idx_official_enhanced_items_rarity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_enhanced_items_rarity ON public.official_enhanced_items USING btree (rarity);


--
-- Name: idx_official_enhanced_items_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_enhanced_items_updated_at ON public.official_enhanced_items USING btree (updated_at DESC);


--
-- Name: idx_official_items_catalog_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_items_catalog_listing ON public.official_items USING btree (catalog_listing);


--
-- Name: idx_official_items_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_items_image_id ON public.official_items USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_official_powers_catalog_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_powers_catalog_listing ON public.official_powers USING btree (catalog_listing);


--
-- Name: idx_official_powers_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_powers_image_id ON public.official_powers USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_official_techniques_catalog_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_techniques_catalog_listing ON public.official_techniques USING btree (catalog_listing);


--
-- Name: idx_official_techniques_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_techniques_image_id ON public.official_techniques USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_realms_image_categories_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realms_image_categories_category ON public.realms_image_categories USING btree (category);


--
-- Name: idx_realms_images_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realms_images_created_at ON public.realms_images USING btree (created_at DESC);


--
-- Name: idx_realms_images_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realms_images_created_by ON public.realms_images USING btree (created_by);


--
-- Name: idx_realms_images_name_ilike; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_realms_images_name_ilike ON public.realms_images USING btree (lower(name));


--
-- Name: idx_role_policies_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_policies_updated_by ON public.role_policies USING btree (updated_by);


--
-- Name: idx_user_creatures_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_creatures_image_id ON public.user_creatures USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_user_empowered_techniques_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_empowered_techniques_image_id ON public.user_empowered_techniques USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_user_enhanced_items_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_enhanced_items_updated_at ON public.user_enhanced_items USING btree (updated_at DESC);


--
-- Name: idx_user_enhanced_items_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_enhanced_items_user_id ON public.user_enhanced_items USING btree (user_id);


--
-- Name: idx_user_items_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_items_image_id ON public.user_items USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_user_powers_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_powers_image_id ON public.user_powers USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_user_species_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_species_image_id ON public.user_species USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_user_techniques_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_techniques_image_id ON public.user_techniques USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_usernames_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usernames_user_id ON public.usernames USING btree (user_id);


--
-- Name: idx_vtt_actions_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vtt_actions_token_id ON public.vtt_actions USING btree (token_id);


--
-- Name: official_items_type_rarity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX official_items_type_rarity_idx ON public.official_items USING btree (type, rarity);


--
-- Name: official_powers_action_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX official_powers_action_type_idx ON public.official_powers USING btree (action_type);


--
-- Name: official_techniques_action_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX official_techniques_action_type_idx ON public.official_techniques USING btree (action_type);


--
-- Name: user_creatures_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_creatures_user_id_idx ON public.user_creatures USING btree (user_id);


--
-- Name: user_empowered_techniques_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_empowered_techniques_user_id_idx ON public.user_empowered_techniques USING btree (user_id);


--
-- Name: user_items_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_items_user_id_idx ON public.user_items USING btree (user_id);


--
-- Name: user_items_user_id_type_rarity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_items_user_id_type_rarity_idx ON public.user_items USING btree (user_id, type, rarity);


--
-- Name: user_powers_user_id_action_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_powers_user_id_action_type_idx ON public.user_powers USING btree (user_id, action_type);


--
-- Name: user_powers_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_powers_user_id_idx ON public.user_powers USING btree (user_id);


--
-- Name: user_profiles_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username);


--
-- Name: user_species_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_species_user_id_idx ON public.user_species USING btree (user_id);


--
-- Name: user_techniques_user_id_action_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_techniques_user_id_action_type_idx ON public.user_techniques USING btree (user_id, action_type);


--
-- Name: user_techniques_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_techniques_user_id_idx ON public.user_techniques USING btree (user_id);


--
-- Name: vtt_actions_scene_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vtt_actions_scene_created_idx ON public.vtt_actions USING btree (scene_id, created_at DESC);


--
-- Name: vtt_actions_scene_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vtt_actions_scene_status_idx ON public.vtt_actions USING btree (scene_id, status);


--
-- Name: vtt_scenes_campaign_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vtt_scenes_campaign_active_idx ON public.vtt_scenes USING btree (campaign_id, is_active, updated_at DESC);


--
-- Name: vtt_scenes_encounter_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vtt_scenes_encounter_idx ON public.vtt_scenes USING btree (encounter_id);


--
-- Name: vtt_tokens_scene_combatant_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vtt_tokens_scene_combatant_unique ON public.vtt_tokens USING btree (scene_id, combatant_id) WHERE (combatant_id IS NOT NULL);


--
-- Name: vtt_tokens_scene_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vtt_tokens_scene_idx ON public.vtt_tokens USING btree (scene_id, created_at);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_replay_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_replay_index ON ONLY realtime.messages USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: messages_2026_11_17_topic_inserted_at_coalesce_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_11_17_topic_inserted_at_coalesce_idx ON realtime.messages_2026_11_17 USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: messages_2026_11_18_topic_inserted_at_coalesce_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_11_18_topic_inserted_at_coalesce_idx ON realtime.messages_2026_11_18 USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: messages_2026_11_19_topic_inserted_at_coalesce_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_11_19_topic_inserted_at_coalesce_idx ON realtime.messages_2026_11_19 USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: messages_2026_11_20_topic_inserted_at_coalesce_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_11_20_topic_inserted_at_coalesce_idx ON realtime.messages_2026_11_20 USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: messages_2026_11_21_topic_inserted_at_coalesce_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_11_21_topic_inserted_at_coalesce_idx ON realtime.messages_2026_11_21 USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: messages_2026_11_22_topic_inserted_at_coalesce_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_11_22_topic_inserted_at_coalesce_idx ON realtime.messages_2026_11_22 USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: messages_2026_11_23_topic_inserted_at_coalesce_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_11_23_topic_inserted_at_coalesce_idx ON realtime.messages_2026_11_23 USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: subscription_subscription_id_entity_filters_hash_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_hash_key ON realtime.subscription USING btree (subscription_id, entity, realtime.filters_hash(filters), action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucket_lifecycle_states_due_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX bucket_lifecycle_states_due_idx ON storage.bucket_lifecycle_states USING btree (next_run_at, bucket_id) WHERE (next_run_at IS NOT NULL);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: idx_objects_current_version; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_objects_current_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (archived_at IS NULL);


--
-- Name: idx_objects_delete_markers; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_delete_markers ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE is_delete_marker;


--
-- Name: idx_objects_null_version; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_objects_null_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (NOT is_versioned);


--
-- Name: lifecycle_abandoned_artifacts_attempted_at_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX lifecycle_abandoned_artifacts_attempted_at_idx ON storage.lifecycle_abandoned_artifacts USING btree (attempted_at);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_archived_due_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX objects_archived_due_idx ON storage.objects USING btree (bucket_id, archived_at, name COLLATE "C") INCLUDE (id, version, is_delete_marker) WHERE (archived_at IS NOT NULL);


--
-- Name: objects_archived_order_uq; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_archived_order_uq ON storage.objects USING btree (bucket_id, name COLLATE "C", archived_at) WHERE (archived_at IS NOT NULL);


--
-- Name: objects_bucket_id_name_version_key; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_name_version_key ON storage.objects USING btree (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT;


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_11_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_11_17_pkey;


--
-- Name: messages_2026_11_17_topic_inserted_at_coalesce_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_replay_index ATTACH PARTITION realtime.messages_2026_11_17_topic_inserted_at_coalesce_idx;


--
-- Name: messages_2026_11_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_11_18_pkey;


--
-- Name: messages_2026_11_18_topic_inserted_at_coalesce_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_replay_index ATTACH PARTITION realtime.messages_2026_11_18_topic_inserted_at_coalesce_idx;


--
-- Name: messages_2026_11_19_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_11_19_pkey;


--
-- Name: messages_2026_11_19_topic_inserted_at_coalesce_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_replay_index ATTACH PARTITION realtime.messages_2026_11_19_topic_inserted_at_coalesce_idx;


--
-- Name: messages_2026_11_20_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_11_20_pkey;


--
-- Name: messages_2026_11_20_topic_inserted_at_coalesce_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_replay_index ATTACH PARTITION realtime.messages_2026_11_20_topic_inserted_at_coalesce_idx;


--
-- Name: messages_2026_11_21_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_11_21_pkey;


--
-- Name: messages_2026_11_21_topic_inserted_at_coalesce_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_replay_index ATTACH PARTITION realtime.messages_2026_11_21_topic_inserted_at_coalesce_idx;


--
-- Name: messages_2026_11_22_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_11_22_pkey;


--
-- Name: messages_2026_11_22_topic_inserted_at_coalesce_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_replay_index ATTACH PARTITION realtime.messages_2026_11_22_topic_inserted_at_coalesce_idx;


--
-- Name: messages_2026_11_23_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_11_23_pkey;


--
-- Name: messages_2026_11_23_topic_inserted_at_coalesce_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_replay_index ATTACH PARTITION realtime.messages_2026_11_23_topic_inserted_at_coalesce_idx;


--
-- Name: character_inventory assert_character_library_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER assert_character_library_owner BEFORE INSERT OR UPDATE ON public.character_inventory FOR EACH ROW EXECUTE FUNCTION public.assert_character_library_owner();


--
-- Name: character_powers assert_character_library_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER assert_character_library_owner BEFORE INSERT OR UPDATE ON public.character_powers FOR EACH ROW EXECUTE FUNCTION public.assert_character_library_owner();


--
-- Name: character_species assert_character_library_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER assert_character_library_owner BEFORE INSERT OR UPDATE ON public.character_species FOR EACH ROW EXECUTE FUNCTION public.assert_character_library_owner();


--
-- Name: character_techniques assert_character_library_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER assert_character_library_owner BEFORE INSERT OR UPDATE ON public.character_techniques FOR EACH ROW EXECUTE FUNCTION public.assert_character_library_owner();


--
-- Name: campaigns campaigns_roster_members_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER campaigns_roster_members_only BEFORE INSERT OR UPDATE OF characters ON public.campaigns FOR EACH ROW EXECUTE FUNCTION private.enforce_campaign_roster_members();


--
-- Name: codex_archetypes codex_archetypes_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_archetypes_touch_updated_at BEFORE UPDATE ON public.codex_archetypes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_creature_feats codex_creature_feats_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_creature_feats_touch_updated_at BEFORE UPDATE ON public.codex_creature_feats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_equipment codex_equipment_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_equipment_touch_updated_at BEFORE UPDATE ON public.codex_equipment FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_feats codex_feats_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_feats_touch_updated_at BEFORE UPDATE ON public.codex_feats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_parts codex_parts_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_parts_touch_updated_at BEFORE UPDATE ON public.codex_parts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_properties codex_properties_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_properties_touch_updated_at BEFORE UPDATE ON public.codex_properties FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_skills codex_skills_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_skills_touch_updated_at BEFORE UPDATE ON public.codex_skills FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_species codex_species_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_species_touch_updated_at BEFORE UPDATE ON public.codex_species FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: codex_traits codex_traits_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER codex_traits_touch_updated_at BEFORE UPDATE ON public.codex_traits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: official_enhanced_items set_official_enhanced_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_official_enhanced_items_updated_at BEFORE UPDATE ON public.official_enhanced_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- Name: characters sync_character_data_compat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_character_data_compat AFTER INSERT OR UPDATE OF data ON public.characters FOR EACH ROW EXECUTE FUNCTION public.sync_character_data_compat_trigger();


--
-- Name: character_ability_components touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_ability_components FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_affiliations touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_affiliations FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_archetype_choices touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_archetype_choices FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_conditions touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_conditions FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_feats touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_feats FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_inventory touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_inventory FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_library_section_preferences touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_library_section_preferences FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_named_notes touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_named_notes FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_note_section_preferences touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_note_section_preferences FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_powers touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_powers FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_proficiencies touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_proficiencies FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_skills touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_skills FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_species touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_species FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_techniques touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_techniques FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_temp_modifiers touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_temp_modifiers FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: character_traits touch_character_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER touch_character_parent AFTER INSERT OR DELETE OR UPDATE ON public.character_traits FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child();


--
-- Name: user_profiles trg_prevent_client_profile_field_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_client_profile_field_change BEFORE INSERT OR UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_client_profile_field_change();


--
-- Name: user_profiles trg_prevent_unauthorized_role_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_unauthorized_role_change BEFORE INSERT OR UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_change();


--
-- Name: official_empowered_techniques trg_sync_library_promoted_columns_official_empowered_techniques; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_official_empowered_techniques BEFORE INSERT OR UPDATE ON public.official_empowered_techniques FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: official_items trg_sync_library_promoted_columns_official_items; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_official_items BEFORE INSERT OR UPDATE ON public.official_items FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: official_powers trg_sync_library_promoted_columns_official_powers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_official_powers BEFORE INSERT OR UPDATE ON public.official_powers FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: official_techniques trg_sync_library_promoted_columns_official_techniques; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_official_techniques BEFORE INSERT OR UPDATE ON public.official_techniques FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: user_empowered_techniques trg_sync_library_promoted_columns_user_empowered_techniques; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_user_empowered_techniques BEFORE INSERT OR UPDATE ON public.user_empowered_techniques FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: user_items trg_sync_library_promoted_columns_user_items; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_user_items BEFORE INSERT OR UPDATE ON public.user_items FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: user_powers trg_sync_library_promoted_columns_user_powers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_user_powers BEFORE INSERT OR UPDATE ON public.user_powers FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: user_techniques trg_sync_library_promoted_columns_user_techniques; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_library_promoted_columns_user_techniques BEFORE INSERT OR UPDATE ON public.user_techniques FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();


--
-- Name: codex_change_logs trigger_codex_change_logs_keep_latest_ten; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_codex_change_logs_keep_latest_ten AFTER INSERT ON public.codex_change_logs FOR EACH ROW EXECUTE FUNCTION public.prune_codex_change_logs_to_latest_ten();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets enforce_versioning_status_transition; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_versioning_status_transition BEFORE UPDATE OF versioning_status ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_versioning_status_transition();


--
-- Name: buckets protect_active_lifecycle_states; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_active_lifecycle_states BEFORE DELETE ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_active_lifecycle_states();


--
-- Name: buckets protect_bucket_control_insert; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns('service_role');


--
-- Name: buckets protect_bucket_control_update; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_bucket_control_update BEFORE UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns();


--
-- Name: buckets protect_bucket_control_update_role; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_bucket_control_update_role AFTER UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_lifecycle_service_role('service_role');


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: buckets wake_lifecycle_on_policy_write; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER wake_lifecycle_on_policy_write AFTER INSERT OR UPDATE OF lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.wake_lifecycle_state();


--
-- Name: buckets wake_lifecycle_on_versioning_enable; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER wake_lifecycle_on_versioning_enable AFTER UPDATE OF versioning_status ON storage.buckets FOR EACH ROW WHEN ((new.lifecycle_configuration IS NOT NULL)) EXECUTE FUNCTION storage.wake_lifecycle_state();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_fkey FOREIGN KEY (mfa_factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_codes mfa_recovery_codes_mfa_recovery_code_set_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_mfa_recovery_code_set_id_fkey FOREIGN KEY (mfa_recovery_code_set_id) REFERENCES auth.mfa_recovery_code_sets(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_tokens scim_tokens_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_users scim_users_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_users scim_users_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: campaign_members campaign_members_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_members
    ADD CONSTRAINT campaign_members_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_rolls campaign_rolls_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_rolls
    ADD CONSTRAINT campaign_rolls_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: character_ability_components character_ability_components_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_ability_components
    ADD CONSTRAINT character_ability_components_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_affiliations character_affiliations_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_affiliations
    ADD CONSTRAINT character_affiliations_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_archetype_choices character_archetype_choices_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_archetype_choices
    ADD CONSTRAINT character_archetype_choices_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_conditions character_conditions_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_conditions
    ADD CONSTRAINT character_conditions_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_feats character_feats_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_feats
    ADD CONSTRAINT character_feats_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_feats character_feats_feat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_feats
    ADD CONSTRAINT character_feats_feat_id_fkey FOREIGN KEY (feat_id) REFERENCES public.codex_feats(id) ON DELETE RESTRICT;


--
-- Name: character_inventory character_inventory_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_inventory
    ADD CONSTRAINT character_inventory_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_inventory character_inventory_codex_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_inventory
    ADD CONSTRAINT character_inventory_codex_equipment_id_fkey FOREIGN KEY (codex_equipment_id) REFERENCES public.codex_equipment(id) ON DELETE RESTRICT;


--
-- Name: character_inventory character_inventory_official_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_inventory
    ADD CONSTRAINT character_inventory_official_item_id_fkey FOREIGN KEY (official_item_id) REFERENCES public.official_items(id) ON DELETE RESTRICT;


--
-- Name: character_inventory character_inventory_user_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_inventory
    ADD CONSTRAINT character_inventory_user_item_id_fkey FOREIGN KEY (user_item_id) REFERENCES public.user_items(id) ON DELETE SET NULL;


--
-- Name: character_library_section_preferences character_library_section_preferences_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_library_section_preferences
    ADD CONSTRAINT character_library_section_preferences_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_named_notes character_named_notes_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_named_notes
    ADD CONSTRAINT character_named_notes_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_note_section_preferences character_note_section_preferences_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_note_section_preferences
    ADD CONSTRAINT character_note_section_preferences_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_powers character_powers_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_powers
    ADD CONSTRAINT character_powers_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_powers character_powers_official_power_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_powers
    ADD CONSTRAINT character_powers_official_power_id_fkey FOREIGN KEY (official_power_id) REFERENCES public.official_powers(id) ON DELETE RESTRICT;


--
-- Name: character_powers character_powers_user_power_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_powers
    ADD CONSTRAINT character_powers_user_power_id_fkey FOREIGN KEY (user_power_id) REFERENCES public.user_powers(id) ON DELETE SET NULL;


--
-- Name: character_proficiencies character_proficiencies_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_proficiencies
    ADD CONSTRAINT character_proficiencies_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_proficiencies character_proficiencies_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_proficiencies
    ADD CONSTRAINT character_proficiencies_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.codex_parts(id) ON DELETE RESTRICT;


--
-- Name: character_proficiencies character_proficiencies_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_proficiencies
    ADD CONSTRAINT character_proficiencies_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.codex_properties(id) ON DELETE RESTRICT;


--
-- Name: character_skills character_skills_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_skills character_skills_selected_base_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_selected_base_skill_id_fkey FOREIGN KEY (selected_base_skill_id) REFERENCES public.codex_skills(id) ON DELETE RESTRICT;


--
-- Name: character_skills character_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.codex_skills(id) ON DELETE RESTRICT;


--
-- Name: character_species character_species_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_species
    ADD CONSTRAINT character_species_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_species character_species_codex_species_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_species
    ADD CONSTRAINT character_species_codex_species_id_fkey FOREIGN KEY (codex_species_id) REFERENCES public.codex_species(id) ON DELETE RESTRICT;


--
-- Name: character_species character_species_user_species_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_species
    ADD CONSTRAINT character_species_user_species_id_fkey FOREIGN KEY (user_species_id) REFERENCES public.user_species(id) ON DELETE SET NULL;


--
-- Name: character_techniques character_techniques_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_techniques
    ADD CONSTRAINT character_techniques_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_techniques character_techniques_official_empowered_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_techniques
    ADD CONSTRAINT character_techniques_official_empowered_id_fkey FOREIGN KEY (official_empowered_id) REFERENCES public.official_empowered_techniques(id) ON DELETE RESTRICT;


--
-- Name: character_techniques character_techniques_official_technique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_techniques
    ADD CONSTRAINT character_techniques_official_technique_id_fkey FOREIGN KEY (official_technique_id) REFERENCES public.official_techniques(id) ON DELETE RESTRICT;


--
-- Name: character_techniques character_techniques_user_empowered_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_techniques
    ADD CONSTRAINT character_techniques_user_empowered_id_fkey FOREIGN KEY (user_empowered_id) REFERENCES public.user_empowered_techniques(id) ON DELETE SET NULL;


--
-- Name: character_techniques character_techniques_user_technique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_techniques
    ADD CONSTRAINT character_techniques_user_technique_id_fkey FOREIGN KEY (user_technique_id) REFERENCES public.user_techniques(id) ON DELETE SET NULL;


--
-- Name: character_temp_modifiers character_temp_modifiers_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_temp_modifiers
    ADD CONSTRAINT character_temp_modifiers_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_traits character_traits_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_traits
    ADD CONSTRAINT character_traits_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_traits character_traits_option_parent_trait_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_traits
    ADD CONSTRAINT character_traits_option_parent_trait_id_fkey FOREIGN KEY (option_parent_trait_id) REFERENCES public.codex_traits(id) ON DELETE RESTRICT;


--
-- Name: character_traits character_traits_trait_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_traits
    ADD CONSTRAINT character_traits_trait_id_fkey FOREIGN KEY (trait_id) REFERENCES public.codex_traits(id) ON DELETE RESTRICT;


--
-- Name: characters characters_archetype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_archetype_id_fkey FOREIGN KEY (archetype_id) REFERENCES public.codex_archetypes(id) ON DELETE RESTRICT;


--
-- Name: characters characters_archetype_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_archetype_path_id_fkey FOREIGN KEY (archetype_path_id) REFERENCES public.codex_archetypes(id) ON DELETE RESTRICT;


--
-- Name: characters characters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: codex_archetype_levels codex_archetype_levels_archetype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_archetype_levels
    ADD CONSTRAINT codex_archetype_levels_archetype_id_fkey FOREIGN KEY (archetype_id) REFERENCES public.codex_archetypes(id) ON DELETE CASCADE;


--
-- Name: codex_change_logs codex_change_logs_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_change_logs
    ADD CONSTRAINT codex_change_logs_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: codex_equipment codex_equipment_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_equipment
    ADD CONSTRAINT codex_equipment_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: codex_species codex_species_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codex_species
    ADD CONSTRAINT codex_species_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: crafting_sessions crafting_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crafting_sessions
    ADD CONSTRAINT crafting_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: official_creatures official_creatures_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_creatures
    ADD CONSTRAINT official_creatures_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: official_empowered_techniques official_empowered_techniques_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_empowered_techniques
    ADD CONSTRAINT official_empowered_techniques_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: official_items official_items_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_items
    ADD CONSTRAINT official_items_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: official_powers official_powers_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_powers
    ADD CONSTRAINT official_powers_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: official_techniques official_techniques_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_techniques
    ADD CONSTRAINT official_techniques_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: realms_image_categories realms_image_categories_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realms_image_categories
    ADD CONSTRAINT realms_image_categories_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE CASCADE;


--
-- Name: realms_images realms_images_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realms_images
    ADD CONSTRAINT realms_images_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: role_policies role_policies_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_policies
    ADD CONSTRAINT role_policies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_creatures user_creatures_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_creatures
    ADD CONSTRAINT user_creatures_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: user_creatures user_creatures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_creatures
    ADD CONSTRAINT user_creatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_empowered_techniques user_empowered_techniques_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_empowered_techniques
    ADD CONSTRAINT user_empowered_techniques_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: user_empowered_techniques user_empowered_techniques_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_empowered_techniques
    ADD CONSTRAINT user_empowered_techniques_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: user_enhanced_items user_enhanced_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_enhanced_items
    ADD CONSTRAINT user_enhanced_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_items user_items_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_items
    ADD CONSTRAINT user_items_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: user_items user_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_items
    ADD CONSTRAINT user_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_powers user_powers_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_powers
    ADD CONSTRAINT user_powers_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: user_powers user_powers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_powers
    ADD CONSTRAINT user_powers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_species user_species_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_species
    ADD CONSTRAINT user_species_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: user_species user_species_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_species
    ADD CONSTRAINT user_species_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: user_techniques user_techniques_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_techniques
    ADD CONSTRAINT user_techniques_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.realms_images(id) ON DELETE SET NULL;


--
-- Name: user_techniques user_techniques_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_techniques
    ADD CONSTRAINT user_techniques_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usernames usernames_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usernames
    ADD CONSTRAINT usernames_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vtt_actions vtt_actions_scene_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_actions
    ADD CONSTRAINT vtt_actions_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.vtt_scenes(id) ON DELETE CASCADE;


--
-- Name: vtt_actions vtt_actions_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_actions
    ADD CONSTRAINT vtt_actions_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.vtt_tokens(id) ON DELETE SET NULL;


--
-- Name: vtt_scenes vtt_scenes_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_scenes
    ADD CONSTRAINT vtt_scenes_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: vtt_scenes vtt_scenes_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_scenes
    ADD CONSTRAINT vtt_scenes_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON DELETE SET NULL;


--
-- Name: vtt_tokens vtt_tokens_scene_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vtt_tokens
    ADD CONSTRAINT vtt_tokens_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.vtt_scenes(id) ON DELETE CASCADE;


--
-- Name: bucket_lifecycle_states bucket_lifecycle_states_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.bucket_lifecycle_states
    ADD CONSTRAINT bucket_lifecycle_states_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: official_creatures Admin can delete official creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete official creatures" ON public.official_creatures FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_empowered_techniques Admin can delete official empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete official empowered techniques" ON public.official_empowered_techniques FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_enhanced_items Admin can delete official enhanced items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete official enhanced items" ON public.official_enhanced_items FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_items Admin can delete official items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete official items" ON public.official_items FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_powers Admin can delete official powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete official powers" ON public.official_powers FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_techniques Admin can delete official techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete official techniques" ON public.official_techniques FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_creatures Admin can insert official creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert official creatures" ON public.official_creatures FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_empowered_techniques Admin can insert official empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert official empowered techniques" ON public.official_empowered_techniques FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_enhanced_items Admin can insert official enhanced items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert official enhanced items" ON public.official_enhanced_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_items Admin can insert official items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert official items" ON public.official_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_powers Admin can insert official powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert official powers" ON public.official_powers FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_techniques Admin can insert official techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert official techniques" ON public.official_techniques FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_creatures Admin can update official creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update official creatures" ON public.official_creatures FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_empowered_techniques Admin can update official empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update official empowered techniques" ON public.official_empowered_techniques FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_enhanced_items Admin can update official enhanced items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update official enhanced items" ON public.official_enhanced_items FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_items Admin can update official items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update official items" ON public.official_items FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_powers Admin can update official powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update official powers" ON public.official_powers FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: official_techniques Admin can update official techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update official techniques" ON public.official_techniques FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = (( SELECT auth.uid() AS uid))::text) AND (user_profiles.role = 'admin'::public."UserRole")))));


--
-- Name: admin_role_audit Admins can read role audit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read role audit" ON public.admin_role_audit FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_profiles up
  WHERE ((up.id = (( SELECT auth.uid() AS uid))::text) AND (up.role = 'admin'::public."UserRole")))));


--
-- Name: codex_archetype_levels Anyone can read codex archetype levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex archetype levels" ON public.codex_archetype_levels FOR SELECT USING (true);


--
-- Name: codex_archetypes Anyone can read codex archetypes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex archetypes" ON public.codex_archetypes FOR SELECT USING (true);


--
-- Name: codex_creature_feats Anyone can read codex creature feats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex creature feats" ON public.codex_creature_feats FOR SELECT USING (true);


--
-- Name: codex_equipment Anyone can read codex equipment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex equipment" ON public.codex_equipment FOR SELECT USING (true);


--
-- Name: codex_feats Anyone can read codex feats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex feats" ON public.codex_feats FOR SELECT USING (true);


--
-- Name: codex_parts Anyone can read codex parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex parts" ON public.codex_parts FOR SELECT USING (true);


--
-- Name: codex_properties Anyone can read codex properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex properties" ON public.codex_properties FOR SELECT USING (true);


--
-- Name: codex_skills Anyone can read codex skills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex skills" ON public.codex_skills FOR SELECT USING (true);


--
-- Name: codex_species Anyone can read codex species; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex species" ON public.codex_species FOR SELECT USING (true);


--
-- Name: codex_traits Anyone can read codex traits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read codex traits" ON public.codex_traits FOR SELECT USING (true);


--
-- Name: core_rules Anyone can read core rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read core rules" ON public.core_rules FOR SELECT USING (true);


--
-- Name: official_creatures Anyone can read official creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read official creatures" ON public.official_creatures FOR SELECT USING (true);


--
-- Name: official_empowered_techniques Anyone can read official empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read official empowered techniques" ON public.official_empowered_techniques FOR SELECT USING (true);


--
-- Name: official_enhanced_items Anyone can read official enhanced items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read official enhanced items" ON public.official_enhanced_items FOR SELECT USING (true);


--
-- Name: official_items Anyone can read official items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read official items" ON public.official_items FOR SELECT USING (true);


--
-- Name: official_powers Anyone can read official powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read official powers" ON public.official_powers FOR SELECT USING (true);


--
-- Name: official_techniques Anyone can read official techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read official techniques" ON public.official_techniques FOR SELECT USING (true);


--
-- Name: realms_image_categories Anyone can read realms image categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read realms image categories" ON public.realms_image_categories FOR SELECT USING (true);


--
-- Name: realms_images Anyone can read realms images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read realms images" ON public.realms_images FOR SELECT USING (true);


--
-- Name: campaign_rolls Campaign participants can read rolls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Campaign participants can read rolls" ON public.campaign_rolls FOR SELECT USING (private.auth_is_campaign_participant(campaign_id));


--
-- Name: campaign_rolls Owner or author deletes rolls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner or author deletes rolls" ON public.campaign_rolls FOR DELETE USING ((private.auth_is_campaign_owner(campaign_id) OR ((user_id = (( SELECT auth.uid() AS uid))::text) AND private.auth_is_campaign_participant(campaign_id))));


--
-- Name: campaign_rolls Participants insert own rolls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants insert own rolls" ON public.campaign_rolls FOR INSERT WITH CHECK (((user_id = (( SELECT auth.uid() AS uid))::text) AND private.auth_is_campaign_participant(campaign_id)));


--
-- Name: characters Users can delete own characters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own characters" ON public.characters FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_creatures Users can delete own creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own creatures" ON public.user_creatures FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_empowered_techniques Users can delete own empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own empowered techniques" ON public.user_empowered_techniques FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: encounters Users can delete own encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own encounters" ON public.encounters FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_items Users can delete own items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own items" ON public.user_items FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_powers Users can delete own powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own powers" ON public.user_powers FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_species Users can delete own species; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own species" ON public.user_species FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_techniques Users can delete own techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own techniques" ON public.user_techniques FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_creatures Users can insert own creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own creatures" ON public.user_creatures FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_empowered_techniques Users can insert own empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own empowered techniques" ON public.user_empowered_techniques FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: encounters Users can insert own encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own encounters" ON public.encounters FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_items Users can insert own items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own items" ON public.user_items FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_powers Users can insert own powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own powers" ON public.user_powers FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK ((id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_species Users can insert own species; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own species" ON public.user_species FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_techniques Users can insert own techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own techniques" ON public.user_techniques FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_creatures Users can read own creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own creatures" ON public.user_creatures FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_empowered_techniques Users can read own empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own empowered techniques" ON public.user_empowered_techniques FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: encounters Users can read own encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own encounters" ON public.encounters FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_items Users can read own items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own items" ON public.user_items FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_powers Users can read own powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own powers" ON public.user_powers FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_profiles Users can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT TO authenticated USING ((id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_species Users can read own species; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own species" ON public.user_species FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_techniques Users can read own techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own techniques" ON public.user_techniques FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: usernames Users can read own username; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own username" ON public.usernames FOR SELECT TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_creatures Users can update own creatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own creatures" ON public.user_creatures FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_empowered_techniques Users can update own empowered techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own empowered techniques" ON public.user_empowered_techniques FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: encounters Users can update own encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own encounters" ON public.encounters FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_items Users can update own items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own items" ON public.user_items FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_powers Users can update own powers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own powers" ON public.user_powers FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING ((id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_species Users can update own species; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own species" ON public.user_species FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: user_techniques Users can update own techniques; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own techniques" ON public.user_techniques FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: admin_role_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_role_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_members campaign_members_delete_owner_or_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_members_delete_owner_or_self ON public.campaign_members FOR DELETE TO authenticated USING (((user_id = (( SELECT auth.uid() AS uid))::text) OR private.auth_is_campaign_owner(campaign_id)));


--
-- Name: campaign_members campaign_members_insert_owner_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_members_insert_owner_self ON public.campaign_members FOR INSERT TO authenticated WITH CHECK ((private.auth_is_campaign_owner(campaign_id) AND (user_id = (( SELECT auth.uid() AS uid))::text)));


--
-- Name: campaign_members campaign_members_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_members_select_participants ON public.campaign_members FOR SELECT TO authenticated USING (((user_id = (( SELECT auth.uid() AS uid))::text) OR private.auth_is_campaign_owner(campaign_id)));


--
-- Name: campaign_rolls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_rolls ENABLE ROW LEVEL SECURITY;

--
-- Name: campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: campaigns campaigns_owner_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaigns_owner_delete ON public.campaigns FOR DELETE TO authenticated USING ((owner_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: campaigns campaigns_owner_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaigns_owner_insert ON public.campaigns FOR INSERT TO authenticated WITH CHECK ((owner_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: campaigns campaigns_owner_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaigns_owner_update ON public.campaigns FOR UPDATE TO authenticated USING ((owner_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((owner_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: campaigns campaigns_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaigns_select_participants ON public.campaigns FOR SELECT TO authenticated USING (((owner_id = (( SELECT auth.uid() AS uid))::text) OR private.auth_is_campaign_participant(id)));


--
-- Name: character_ability_components; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_ability_components ENABLE ROW LEVEL SECURITY;

--
-- Name: character_affiliations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_affiliations ENABLE ROW LEVEL SECURITY;

--
-- Name: character_archetype_choices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_archetype_choices ENABLE ROW LEVEL SECURITY;

--
-- Name: character_ability_components character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_ability_components FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_ability_components.character_id))));


--
-- Name: character_affiliations character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_affiliations FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_affiliations.character_id))));


--
-- Name: character_archetype_choices character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_archetype_choices FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_archetype_choices.character_id))));


--
-- Name: character_conditions character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_conditions FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_conditions.character_id))));


--
-- Name: character_feats character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_feats FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_feats.character_id))));


--
-- Name: character_inventory character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_inventory FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_inventory.character_id))));


--
-- Name: character_library_section_preferences character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_library_section_preferences FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_library_section_preferences.character_id))));


--
-- Name: character_named_notes character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_named_notes FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_named_notes.character_id))));


--
-- Name: character_note_section_preferences character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_note_section_preferences FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_note_section_preferences.character_id))));


--
-- Name: character_powers character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_powers FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_powers.character_id))));


--
-- Name: character_proficiencies character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_proficiencies FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_proficiencies.character_id))));


--
-- Name: character_skills character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_skills FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_skills.character_id))));


--
-- Name: character_species character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_species FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_species.character_id))));


--
-- Name: character_techniques character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_techniques FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_techniques.character_id))));


--
-- Name: character_temp_modifiers character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_temp_modifiers FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_temp_modifiers.character_id))));


--
-- Name: character_traits character_child_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY character_child_select ON public.character_traits FOR SELECT TO authenticated, anon USING ((EXISTS ( SELECT 1
   FROM public.characters c
  WHERE (c.id = character_traits.character_id))));


--
-- Name: character_conditions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_conditions ENABLE ROW LEVEL SECURITY;

--
-- Name: character_feats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_feats ENABLE ROW LEVEL SECURITY;

--
-- Name: character_inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: character_library_section_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_library_section_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: character_named_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_named_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: character_note_section_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_note_section_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: character_powers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_powers ENABLE ROW LEVEL SECURITY;

--
-- Name: character_proficiencies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_proficiencies ENABLE ROW LEVEL SECURITY;

--
-- Name: character_skills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_skills ENABLE ROW LEVEL SECURITY;

--
-- Name: character_species; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_species ENABLE ROW LEVEL SECURITY;

--
-- Name: character_techniques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_techniques ENABLE ROW LEVEL SECURITY;

--
-- Name: character_temp_modifiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_temp_modifiers ENABLE ROW LEVEL SECURITY;

--
-- Name: character_traits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_traits ENABLE ROW LEVEL SECURITY;

--
-- Name: characters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

--
-- Name: characters characters_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY characters_select_authenticated ON public.characters FOR SELECT TO authenticated USING (((user_id = (( SELECT auth.uid() AS uid))::text) OR (visibility = 'public'::text) OR ((visibility = 'campaign'::text) AND (EXISTS ( SELECT 1
   FROM (public.campaigns c
     CROSS JOIN LATERAL jsonb_array_elements(
        CASE
            WHEN (c.characters IS NULL) THEN '[]'::jsonb
            WHEN (jsonb_typeof(c.characters) = 'array'::text) THEN c.characters
            ELSE '[]'::jsonb
        END) elem(value))
  WHERE ((((elem.value ? 'characterId'::text) AND ((elem.value ->> 'characterId'::text) = characters.id) AND ((elem.value ->> 'userId'::text) = characters.user_id)) OR ((elem.value ? 'character_id'::text) AND ((elem.value ->> 'character_id'::text) = characters.id) AND ((elem.value ->> 'user_id'::text) = characters.user_id))) AND private.auth_is_campaign_participant(c.id) AND private.campaign_roster_user_joined(c.id,
        CASE
            WHEN (elem.value ? 'userId'::text) THEN (elem.value ->> 'userId'::text)
            ELSE (elem.value ->> 'user_id'::text)
        END)))))));


--
-- Name: characters characters_select_public_anon; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY characters_select_public_anon ON public.characters FOR SELECT TO anon USING ((visibility = 'public'::text));


--
-- Name: codex_archetype_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_archetype_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_archetypes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_archetypes ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_change_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_change_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_change_logs codex_change_logs_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY codex_change_logs_admin_select ON public.codex_change_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles up
  WHERE ((up.id = (( SELECT auth.uid() AS uid))::text) AND (up.role = 'admin'::public."UserRole")))));


--
-- Name: codex_creature_feats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_creature_feats ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_equipment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_equipment ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_feats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_feats ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_parts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_properties ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_retired_ids; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_retired_ids ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_skills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_skills ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_species; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_species ENABLE ROW LEVEL SECURITY;

--
-- Name: codex_traits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.codex_traits ENABLE ROW LEVEL SECURITY;

--
-- Name: core_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.core_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: crafting_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crafting_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: crafting_sessions crafting_sessions_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crafting_sessions_delete ON public.crafting_sessions FOR DELETE USING (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: crafting_sessions crafting_sessions_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crafting_sessions_insert ON public.crafting_sessions FOR INSERT WITH CHECK (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: crafting_sessions crafting_sessions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crafting_sessions_select ON public.crafting_sessions FOR SELECT USING (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: crafting_sessions crafting_sessions_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crafting_sessions_update ON public.crafting_sessions FOR UPDATE USING (((( SELECT auth.uid() AS uid))::text = user_id)) WITH CHECK (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: encounters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

--
-- Name: official_creatures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.official_creatures ENABLE ROW LEVEL SECURITY;

--
-- Name: official_empowered_techniques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.official_empowered_techniques ENABLE ROW LEVEL SECURITY;

--
-- Name: official_enhanced_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.official_enhanced_items ENABLE ROW LEVEL SECURITY;

--
-- Name: official_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.official_items ENABLE ROW LEVEL SECURITY;

--
-- Name: official_powers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.official_powers ENABLE ROW LEVEL SECURITY;

--
-- Name: official_techniques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.official_techniques ENABLE ROW LEVEL SECURITY;

--
-- Name: realms_image_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.realms_image_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: realms_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.realms_images ENABLE ROW LEVEL SECURITY;

--
-- Name: role_policies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_policies ENABLE ROW LEVEL SECURITY;

--
-- Name: role_policies role_policies_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_policies_admin_delete ON public.role_policies FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles up
  WHERE ((up.id = (( SELECT auth.uid() AS uid))::text) AND (up.role = 'admin'::public."UserRole")))));


--
-- Name: role_policies role_policies_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_policies_admin_insert ON public.role_policies FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles up
  WHERE ((up.id = (( SELECT auth.uid() AS uid))::text) AND (up.role = 'admin'::public."UserRole")))));


--
-- Name: role_policies role_policies_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_policies_admin_update ON public.role_policies FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles up
  WHERE ((up.id = (( SELECT auth.uid() AS uid))::text) AND (up.role = 'admin'::public."UserRole"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles up
  WHERE ((up.id = (( SELECT auth.uid() AS uid))::text) AND (up.role = 'admin'::public."UserRole")))));


--
-- Name: role_policies role_policies_select_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_policies_select_scoped ON public.role_policies FOR SELECT TO authenticated USING (((role = ( SELECT up.role
   FROM public.user_profiles up
  WHERE (up.id = (( SELECT auth.uid() AS uid))::text))) OR (EXISTS ( SELECT 1
   FROM public.user_profiles up
  WHERE ((up.id = (( SELECT auth.uid() AS uid))::text) AND (up.role = 'admin'::public."UserRole"))))));


--
-- Name: user_creatures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_creatures ENABLE ROW LEVEL SECURITY;

--
-- Name: user_empowered_techniques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_empowered_techniques ENABLE ROW LEVEL SECURITY;

--
-- Name: user_enhanced_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_enhanced_items ENABLE ROW LEVEL SECURITY;

--
-- Name: user_enhanced_items user_enhanced_items_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_enhanced_items_delete ON public.user_enhanced_items FOR DELETE USING (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: user_enhanced_items user_enhanced_items_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_enhanced_items_insert ON public.user_enhanced_items FOR INSERT WITH CHECK (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: user_enhanced_items user_enhanced_items_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_enhanced_items_select ON public.user_enhanced_items FOR SELECT USING (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: user_enhanced_items user_enhanced_items_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_enhanced_items_update ON public.user_enhanced_items FOR UPDATE USING (((( SELECT auth.uid() AS uid))::text = user_id)) WITH CHECK (((( SELECT auth.uid() AS uid))::text = user_id));


--
-- Name: user_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;

--
-- Name: user_powers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_powers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_species; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_species ENABLE ROW LEVEL SECURITY;

--
-- Name: user_techniques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_techniques ENABLE ROW LEVEL SECURITY;

--
-- Name: usernames; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

--
-- Name: vtt_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vtt_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: vtt_actions vtt_actions_delete_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_actions_delete_owner ON public.vtt_actions FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_actions.scene_id) AND private.auth_is_vtt_campaign_owner(s.campaign_id)))));


--
-- Name: vtt_actions vtt_actions_insert_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_actions_insert_participants ON public.vtt_actions FOR INSERT TO authenticated WITH CHECK (((user_id = (( SELECT auth.uid() AS uid))::text) AND (EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_actions.scene_id) AND private.auth_is_vtt_campaign_participant(s.campaign_id))))));


--
-- Name: vtt_actions vtt_actions_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_actions_select_participants ON public.vtt_actions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_actions.scene_id) AND private.auth_is_vtt_campaign_participant(s.campaign_id)))));


--
-- Name: vtt_actions vtt_actions_update_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_actions_update_owner ON public.vtt_actions FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_actions.scene_id) AND private.auth_is_vtt_campaign_owner(s.campaign_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_actions.scene_id) AND private.auth_is_vtt_campaign_owner(s.campaign_id)))));


--
-- Name: vtt_scenes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vtt_scenes ENABLE ROW LEVEL SECURITY;

--
-- Name: vtt_scenes vtt_scenes_delete_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_scenes_delete_owner ON public.vtt_scenes FOR DELETE TO authenticated USING (private.auth_is_vtt_campaign_owner(campaign_id));


--
-- Name: vtt_scenes vtt_scenes_insert_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_scenes_insert_owner ON public.vtt_scenes FOR INSERT TO authenticated WITH CHECK (private.auth_is_vtt_campaign_owner(campaign_id));


--
-- Name: vtt_scenes vtt_scenes_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_scenes_select_participants ON public.vtt_scenes FOR SELECT TO authenticated USING (private.auth_is_vtt_campaign_participant(campaign_id));


--
-- Name: vtt_scenes vtt_scenes_update_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_scenes_update_owner ON public.vtt_scenes FOR UPDATE TO authenticated USING (private.auth_is_vtt_campaign_owner(campaign_id)) WITH CHECK (private.auth_is_vtt_campaign_owner(campaign_id));


--
-- Name: vtt_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vtt_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: vtt_tokens vtt_tokens_delete_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_tokens_delete_owner ON public.vtt_tokens FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_tokens.scene_id) AND private.auth_is_vtt_campaign_owner(s.campaign_id)))));


--
-- Name: vtt_tokens vtt_tokens_insert_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_tokens_insert_owner ON public.vtt_tokens FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_tokens.scene_id) AND private.auth_is_vtt_campaign_owner(s.campaign_id)))));


--
-- Name: vtt_tokens vtt_tokens_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_tokens_select_participants ON public.vtt_tokens FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_tokens.scene_id) AND private.auth_is_vtt_campaign_participant(s.campaign_id)))));


--
-- Name: vtt_tokens vtt_tokens_update_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vtt_tokens_update_owner ON public.vtt_tokens FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_tokens.scene_id) AND private.auth_is_vtt_campaign_owner(s.campaign_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vtt_scenes s
  WHERE ((s.id = vtt_tokens.scene_id) AND private.auth_is_vtt_campaign_owner(s.campaign_id)))));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Users can delete own portraits; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own portraits" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'portraits'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));


--
-- Name: objects Users can delete own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own profile picture" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text)) AND public.auth_can_upload_profile_picture()));


--
-- Name: objects Users can read own portraits; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can read own portraits" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'portraits'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));


--
-- Name: objects Users can read own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can read own profile picture" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text))));


--
-- Name: objects Users can update own portraits; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update own portraits" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'portraits'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))) WITH CHECK (((bucket_id = 'portraits'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));


--
-- Name: objects Users can update own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update own profile picture" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text)) AND public.auth_can_upload_profile_picture())) WITH CHECK (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text)) AND public.auth_can_upload_profile_picture()));


--
-- Name: objects Users can upload own portraits; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own portraits" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'portraits'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));


--
-- Name: objects Users can upload own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own profile picture" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text)) AND public.auth_can_upload_profile_picture()));


--
-- Name: bucket_lifecycle_states; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.bucket_lifecycle_states ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: lifecycle_abandoned_artifacts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.lifecycle_abandoned_artifacts ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime campaign_rolls; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.campaign_rolls;


--
-- Name: supabase_realtime characters; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.characters;


--
-- Name: supabase_realtime vtt_actions; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.vtt_actions;


--
-- Name: supabase_realtime vtt_scenes; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.vtt_scenes;


--
-- Name: supabase_realtime vtt_tokens; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.vtt_tokens;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA private; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA private TO authenticated;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: -
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: -
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: -
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION auth_is_campaign_owner(p_campaign_id text); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.auth_is_campaign_owner(p_campaign_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION private.auth_is_campaign_owner(p_campaign_id text) TO authenticated;


--
-- Name: FUNCTION auth_is_campaign_participant(p_campaign_id text); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.auth_is_campaign_participant(p_campaign_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION private.auth_is_campaign_participant(p_campaign_id text) TO authenticated;


--
-- Name: FUNCTION auth_is_vtt_campaign_owner(p_campaign_id text); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.auth_is_vtt_campaign_owner(p_campaign_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION private.auth_is_vtt_campaign_owner(p_campaign_id text) TO authenticated;


--
-- Name: FUNCTION auth_is_vtt_campaign_participant(p_campaign_id text); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.auth_is_vtt_campaign_participant(p_campaign_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION private.auth_is_vtt_campaign_participant(p_campaign_id text) TO authenticated;


--
-- Name: FUNCTION campaign_roster_user_joined(p_campaign_id text, p_user_id text); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.campaign_roster_user_joined(p_campaign_id text, p_user_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION private.campaign_roster_user_joined(p_campaign_id text, p_user_id text) TO authenticated;


--
-- Name: FUNCTION enforce_campaign_roster_members(); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.enforce_campaign_roster_members() FROM PUBLIC;


--
-- Name: FUNCTION _official_power_rebuilt_mechanic_part_names(p_is_reaction boolean, p_action_type text, p_range_steps integer, p_area_type text, p_duration_type text, p_payload_duration jsonb, p_damage jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public._official_power_rebuilt_mechanic_part_names(p_is_reaction boolean, p_action_type text, p_range_steps integer, p_area_type text, p_duration_type text, p_payload_duration jsonb, p_damage jsonb) TO anon;
GRANT ALL ON FUNCTION public._official_power_rebuilt_mechanic_part_names(p_is_reaction boolean, p_action_type text, p_range_steps integer, p_area_type text, p_duration_type text, p_payload_duration jsonb, p_damage jsonb) TO authenticated;
GRANT ALL ON FUNCTION public._official_power_rebuilt_mechanic_part_names(p_is_reaction boolean, p_action_type text, p_range_steps integer, p_area_type text, p_duration_type text, p_payload_duration jsonb, p_damage jsonb) TO service_role;


--
-- Name: FUNCTION add_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_owner_max_characters integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.add_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_owner_max_characters integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_owner_max_characters integer) TO service_role;


--
-- Name: FUNCTION apply_character_inventory_patch(p_character_id text, p_owner_id text, p_patch jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.apply_character_inventory_patch(p_character_id text, p_owner_id text, p_patch jsonb) FROM PUBLIC;


--
-- Name: FUNCTION apply_character_relational_document(p_character_id text, p_document jsonb, p_updated_at timestamp without time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.apply_character_relational_document(p_character_id text, p_document jsonb, p_updated_at timestamp without time zone) FROM PUBLIC;


--
-- Name: FUNCTION assert_account_create_quota(p_user_id text, p_resource text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assert_account_create_quota(p_user_id text, p_resource text) FROM PUBLIC;


--
-- Name: FUNCTION assert_character_document_mapped(p_document jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assert_character_document_mapped(p_document jsonb) FROM PUBLIC;


--
-- Name: FUNCTION assert_character_library_owner(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.assert_character_library_owner() TO anon;
GRANT ALL ON FUNCTION public.assert_character_library_owner() TO authenticated;
GRANT ALL ON FUNCTION public.assert_character_library_owner() TO service_role;


--
-- Name: FUNCTION auth_can_upload_profile_picture(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.auth_can_upload_profile_picture() FROM PUBLIC;
GRANT ALL ON FUNCTION public.auth_can_upload_profile_picture() TO authenticated;
GRANT ALL ON FUNCTION public.auth_can_upload_profile_picture() TO service_role;


--
-- Name: FUNCTION collapse_codex_source_name(raw text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.collapse_codex_source_name(raw text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.collapse_codex_source_name(raw text) TO service_role;


--
-- Name: FUNCTION create_character_relational(p_character_id text, p_document jsonb, p_client_request_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_character_relational(p_character_id text, p_document jsonb, p_client_request_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_character_relational(p_character_id text, p_document jsonb, p_client_request_id uuid) TO authenticated;


--
-- Name: FUNCTION get_campaign_character_relational_document(p_campaign_id text, p_character_owner_id text, p_character_id text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_campaign_character_relational_document(p_campaign_id text, p_character_owner_id text, p_character_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_campaign_character_relational_document(p_campaign_id text, p_character_owner_id text, p_character_id text) TO authenticated;


--
-- Name: FUNCTION get_character_relational_document(p_character_id text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_character_relational_document(p_character_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_character_relational_document(p_character_id text) TO anon;
GRANT ALL ON FUNCTION public.get_character_relational_document(p_character_id text) TO authenticated;
GRANT ALL ON FUNCTION public.get_character_relational_document(p_character_id text) TO service_role;


--
-- Name: FUNCTION insert_character_inventory_item(p_character_id text, p_owner_id text, p_category text, p_position integer, p_item jsonb, p_slot text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.insert_character_inventory_item(p_character_id text, p_owner_id text, p_category text, p_position integer, p_item jsonb, p_slot text) FROM PUBLIC;


--
-- Name: FUNCTION insert_character_trait_selection(p_character_id text, p_position integer, p_role text, p_source_id text, p_name text, p_species_position smallint, p_parent_source_id text, p_current_uses integer, p_custom_name text, p_note text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.insert_character_trait_selection(p_character_id text, p_position integer, p_role text, p_source_id text, p_name text, p_species_position smallint, p_parent_source_id text, p_current_uses integer, p_custom_name text, p_note text) FROM PUBLIC;


--
-- Name: FUNCTION insert_table_row_from_jsonb_keys(p_target regclass, p_row jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.insert_table_row_from_jsonb_keys(p_target regclass, p_row jsonb) FROM PUBLIC;


--
-- Name: FUNCTION insert_user_library_row_with_quota(p_library_kind text, p_row jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.insert_user_library_row_with_quota(p_library_kind text, p_row jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.insert_user_library_row_with_quota(p_library_kind text, p_row jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.insert_user_library_row_with_quota(p_library_kind text, p_row jsonb) TO service_role;


--
-- Name: FUNCTION inventory_patch_bucket_category(p_bucket text, OUT p_category text, OUT p_slot text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.inventory_patch_bucket_category(p_bucket text, OUT p_category text, OUT p_slot text) FROM PUBLIC;


--
-- Name: FUNCTION inventory_patch_field_clear(p_item jsonb, p_key text, OUT p_clear boolean, OUT p_value text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.inventory_patch_field_clear(p_item jsonb, p_key text, OUT p_clear boolean, OUT p_value text) FROM PUBLIC;


--
-- Name: TABLE character_inventory; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_inventory TO anon;
GRANT ALL ON TABLE public.character_inventory TO authenticated;
GRANT ALL ON TABLE public.character_inventory TO service_role;


--
-- Name: FUNCTION inventory_row_cas_snapshot(p_row public.character_inventory); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.inventory_row_cas_snapshot(p_row public.character_inventory) FROM PUBLIC;


--
-- Name: FUNCTION join_campaign_character_relational(p_actor_id text, p_invite_code text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_max_players_per_campaign integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.join_campaign_character_relational(p_actor_id text, p_invite_code text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_max_players_per_campaign integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.join_campaign_character_relational(p_actor_id text, p_invite_code text, p_character_id text, p_roster_entry jsonb, p_expected_updated_at text, p_max_campaign_characters integer, p_max_players_per_campaign integer) TO service_role;


--
-- Name: FUNCTION lock_user_profile_for_writes(p_user_id text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.lock_user_profile_for_writes(p_user_id text) FROM PUBLIC;


--
-- Name: FUNCTION map_feat_tag_phase1(raw text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.map_feat_tag_phase1(raw text) TO anon;
GRANT ALL ON FUNCTION public.map_feat_tag_phase1(raw text) TO authenticated;
GRANT ALL ON FUNCTION public.map_feat_tag_phase1(raw text) TO service_role;


--
-- Name: FUNCTION map_feat_tag_phase2(raw text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.map_feat_tag_phase2(raw text) TO anon;
GRANT ALL ON FUNCTION public.map_feat_tag_phase2(raw text) TO authenticated;
GRANT ALL ON FUNCTION public.map_feat_tag_phase2(raw text) TO service_role;


--
-- Name: FUNCTION map_feat_tag_phase3(raw text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.map_feat_tag_phase3(raw text) TO anon;
GRANT ALL ON FUNCTION public.map_feat_tag_phase3(raw text) TO authenticated;
GRANT ALL ON FUNCTION public.map_feat_tag_phase3(raw text) TO service_role;


--
-- Name: FUNCTION normalize_feat_tags(tag_string text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.normalize_feat_tags(tag_string text) TO anon;
GRANT ALL ON FUNCTION public.normalize_feat_tags(tag_string text) TO authenticated;
GRANT ALL ON FUNCTION public.normalize_feat_tags(tag_string text) TO service_role;


--
-- Name: FUNCTION patch_character_relational(p_character_id text, p_patch jsonb, p_expected_updated_at text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.patch_character_relational(p_character_id text, p_patch jsonb, p_expected_updated_at text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.patch_character_relational(p_character_id text, p_patch jsonb, p_expected_updated_at text) TO authenticated;


--
-- Name: FUNCTION prevent_client_profile_field_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.prevent_client_profile_field_change() TO anon;
GRANT ALL ON FUNCTION public.prevent_client_profile_field_change() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_client_profile_field_change() TO service_role;


--
-- Name: FUNCTION prevent_unauthorized_role_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.prevent_unauthorized_role_change() TO anon;
GRANT ALL ON FUNCTION public.prevent_unauthorized_role_change() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_unauthorized_role_change() TO service_role;


--
-- Name: FUNCTION provision_character_relational(p_character_id text, p_owner_id text, p_document jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.provision_character_relational(p_character_id text, p_owner_id text, p_document jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.provision_character_relational(p_character_id text, p_owner_id text, p_document jsonb) TO service_role;


--
-- Name: FUNCTION prune_codex_change_logs_to_latest_ten(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.prune_codex_change_logs_to_latest_ten() TO anon;
GRANT ALL ON FUNCTION public.prune_codex_change_logs_to_latest_ten() TO authenticated;
GRANT ALL ON FUNCTION public.prune_codex_change_logs_to_latest_ten() TO service_role;


--
-- Name: FUNCTION remove_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_owner_id text, p_character_id text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.remove_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_owner_id text, p_character_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.remove_campaign_character_relational(p_actor_id text, p_campaign_id text, p_character_owner_id text, p_character_id text) TO service_role;


--
-- Name: FUNCTION rename_codex_source(from_name text, to_name text, actor uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rename_codex_source(from_name text, to_name text, actor uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.rename_codex_source(from_name text, to_name text, actor uuid) TO service_role;


--
-- Name: FUNCTION replace_archetype_levels(p_archetype_id text, p_levels jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.replace_archetype_levels(p_archetype_id text, p_levels jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.replace_archetype_levels(p_archetype_id text, p_levels jsonb) TO service_role;


--
-- Name: FUNCTION resolve_character_reference(p_kind text, p_source_id text, p_name text, p_owner_id text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.resolve_character_reference(p_kind text, p_source_id text, p_name text, p_owner_id text) FROM PUBLIC;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: FUNCTION role_policy_limits_for_role(p_role public."UserRole"); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.role_policy_limits_for_role(p_role public."UserRole") FROM PUBLIC;


--
-- Name: FUNCTION set_updated_at_timestamp(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_updated_at_timestamp() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at_timestamp() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at_timestamp() TO service_role;


--
-- Name: FUNCTION sync_character_child_tables(p_character_id text, p_document jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_character_child_tables(p_character_id text, p_document jsonb) FROM PUBLIC;


--
-- Name: FUNCTION sync_character_cutover_scalars(p_character_id text, p_document jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_character_cutover_scalars(p_character_id text, p_document jsonb) FROM PUBLIC;


--
-- Name: FUNCTION sync_character_data_compat_trigger(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_character_data_compat_trigger() TO anon;
GRANT ALL ON FUNCTION public.sync_character_data_compat_trigger() TO authenticated;
GRANT ALL ON FUNCTION public.sync_character_data_compat_trigger() TO service_role;


--
-- Name: FUNCTION sync_character_scalar_columns(p_character_id text, p_document jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_character_scalar_columns(p_character_id text, p_document jsonb) FROM PUBLIC;


--
-- Name: FUNCTION sync_library_promoted_columns(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_library_promoted_columns() TO anon;
GRANT ALL ON FUNCTION public.sync_library_promoted_columns() TO authenticated;
GRANT ALL ON FUNCTION public.sync_library_promoted_columns() TO service_role;


--
-- Name: FUNCTION touch_character_from_child(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_character_from_child() TO anon;
GRANT ALL ON FUNCTION public.touch_character_from_child() TO authenticated;
GRANT ALL ON FUNCTION public.touch_character_from_child() TO service_role;


--
-- Name: FUNCTION touch_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_updated_at() TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;


--
-- Name: FUNCTION authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) TO postgres;
GRANT ALL ON FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) TO dashboard_user;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- Name: FUNCTION filters_hash(filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.filters_hash(filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.filters_hash(filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.filters_hash(filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.filters_hash(filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.filters_hash(filters realtime.user_defined_filter[]) TO service_role;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) TO postgres;
GRANT ALL ON FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- Name: FUNCTION delete_lifecycle_objects(object_ids uuid[]); Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) TO service_role;


--
-- Name: FUNCTION protect_active_lifecycle_states(); Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON FUNCTION storage.protect_active_lifecycle_states() FROM PUBLIC;


--
-- Name: FUNCTION reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean); Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) TO service_role;


--
-- Name: FUNCTION wake_lifecycle_state(); Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON FUNCTION storage.wake_lifecycle_state() FROM PUBLIC;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: -
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: -
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: -
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE mfa_recovery_code_sets; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.mfa_recovery_code_sets TO postgres;
GRANT ALL ON TABLE auth.mfa_recovery_code_sets TO dashboard_user;


--
-- Name: TABLE mfa_recovery_codes; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.mfa_recovery_codes TO postgres;
GRANT ALL ON TABLE auth.mfa_recovery_codes TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: -
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE scim_tokens; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.scim_tokens TO postgres;
GRANT ALL ON TABLE auth.scim_tokens TO dashboard_user;


--
-- Name: TABLE scim_users; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.scim_users TO postgres;
GRANT ALL ON TABLE auth.scim_users TO dashboard_user;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: -
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE admin_role_audit; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_role_audit TO authenticated;
GRANT ALL ON TABLE public.admin_role_audit TO service_role;


--
-- Name: TABLE campaign_members; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.campaign_members TO authenticated;
GRANT ALL ON TABLE public.campaign_members TO service_role;


--
-- Name: TABLE campaign_rolls; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.campaign_rolls TO authenticated;
GRANT ALL ON TABLE public.campaign_rolls TO service_role;


--
-- Name: TABLE campaigns; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.campaigns TO authenticated;
GRANT ALL ON TABLE public.campaigns TO service_role;


--
-- Name: TABLE character_ability_components; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_ability_components TO anon;
GRANT ALL ON TABLE public.character_ability_components TO authenticated;
GRANT ALL ON TABLE public.character_ability_components TO service_role;


--
-- Name: TABLE character_affiliations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_affiliations TO anon;
GRANT ALL ON TABLE public.character_affiliations TO authenticated;
GRANT ALL ON TABLE public.character_affiliations TO service_role;


--
-- Name: TABLE character_archetype_choices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_archetype_choices TO anon;
GRANT ALL ON TABLE public.character_archetype_choices TO authenticated;
GRANT ALL ON TABLE public.character_archetype_choices TO service_role;


--
-- Name: TABLE character_conditions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_conditions TO anon;
GRANT ALL ON TABLE public.character_conditions TO authenticated;
GRANT ALL ON TABLE public.character_conditions TO service_role;


--
-- Name: TABLE character_feats; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_feats TO anon;
GRANT ALL ON TABLE public.character_feats TO authenticated;
GRANT ALL ON TABLE public.character_feats TO service_role;


--
-- Name: TABLE character_library_section_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_library_section_preferences TO anon;
GRANT ALL ON TABLE public.character_library_section_preferences TO authenticated;
GRANT ALL ON TABLE public.character_library_section_preferences TO service_role;


--
-- Name: TABLE character_named_notes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_named_notes TO anon;
GRANT ALL ON TABLE public.character_named_notes TO authenticated;
GRANT ALL ON TABLE public.character_named_notes TO service_role;


--
-- Name: TABLE character_note_section_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_note_section_preferences TO anon;
GRANT ALL ON TABLE public.character_note_section_preferences TO authenticated;
GRANT ALL ON TABLE public.character_note_section_preferences TO service_role;


--
-- Name: TABLE character_powers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_powers TO anon;
GRANT ALL ON TABLE public.character_powers TO authenticated;
GRANT ALL ON TABLE public.character_powers TO service_role;


--
-- Name: TABLE character_proficiencies; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_proficiencies TO anon;
GRANT ALL ON TABLE public.character_proficiencies TO authenticated;
GRANT ALL ON TABLE public.character_proficiencies TO service_role;


--
-- Name: TABLE character_skills; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_skills TO anon;
GRANT ALL ON TABLE public.character_skills TO authenticated;
GRANT ALL ON TABLE public.character_skills TO service_role;


--
-- Name: TABLE character_species; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_species TO anon;
GRANT ALL ON TABLE public.character_species TO authenticated;
GRANT ALL ON TABLE public.character_species TO service_role;


--
-- Name: TABLE character_techniques; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_techniques TO anon;
GRANT ALL ON TABLE public.character_techniques TO authenticated;
GRANT ALL ON TABLE public.character_techniques TO service_role;


--
-- Name: TABLE character_temp_modifiers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_temp_modifiers TO anon;
GRANT ALL ON TABLE public.character_temp_modifiers TO authenticated;
GRANT ALL ON TABLE public.character_temp_modifiers TO service_role;


--
-- Name: TABLE character_traits; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.character_traits TO anon;
GRANT ALL ON TABLE public.character_traits TO authenticated;
GRANT ALL ON TABLE public.character_traits TO service_role;


--
-- Name: TABLE characters; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.characters TO authenticated;
GRANT ALL ON TABLE public.characters TO service_role;
GRANT SELECT ON TABLE public.characters TO anon;


--
-- Name: TABLE codex_archetype_levels; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.codex_archetype_levels TO authenticated;
GRANT ALL ON TABLE public.codex_archetype_levels TO service_role;
GRANT SELECT ON TABLE public.codex_archetype_levels TO anon;


--
-- Name: SEQUENCE codex_archetype_levels_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.codex_archetype_levels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.codex_archetype_levels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.codex_archetype_levels_id_seq TO service_role;


--
-- Name: TABLE codex_archetypes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_archetypes TO authenticated;
GRANT ALL ON TABLE public.codex_archetypes TO service_role;
GRANT SELECT ON TABLE public.codex_archetypes TO anon;


--
-- Name: TABLE codex_change_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.codex_change_logs TO authenticated;
GRANT ALL ON TABLE public.codex_change_logs TO service_role;


--
-- Name: TABLE codex_creature_feats; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_creature_feats TO authenticated;
GRANT ALL ON TABLE public.codex_creature_feats TO service_role;
GRANT SELECT ON TABLE public.codex_creature_feats TO anon;


--
-- Name: TABLE codex_equipment; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_equipment TO authenticated;
GRANT ALL ON TABLE public.codex_equipment TO service_role;
GRANT SELECT ON TABLE public.codex_equipment TO anon;


--
-- Name: TABLE codex_feats; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_feats TO authenticated;
GRANT ALL ON TABLE public.codex_feats TO service_role;
GRANT SELECT ON TABLE public.codex_feats TO anon;


--
-- Name: TABLE codex_parts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_parts TO authenticated;
GRANT ALL ON TABLE public.codex_parts TO service_role;
GRANT SELECT ON TABLE public.codex_parts TO anon;


--
-- Name: TABLE codex_properties; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_properties TO authenticated;
GRANT ALL ON TABLE public.codex_properties TO service_role;
GRANT SELECT ON TABLE public.codex_properties TO anon;


--
-- Name: TABLE codex_retired_ids; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.codex_retired_ids TO service_role;


--
-- Name: TABLE codex_skills; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_skills TO authenticated;
GRANT ALL ON TABLE public.codex_skills TO service_role;
GRANT SELECT ON TABLE public.codex_skills TO anon;


--
-- Name: TABLE codex_species; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_species TO authenticated;
GRANT ALL ON TABLE public.codex_species TO service_role;
GRANT SELECT ON TABLE public.codex_species TO anon;


--
-- Name: TABLE codex_traits; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.codex_traits TO authenticated;
GRANT ALL ON TABLE public.codex_traits TO service_role;
GRANT SELECT ON TABLE public.codex_traits TO anon;


--
-- Name: TABLE core_rules; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.core_rules TO authenticated;
GRANT ALL ON TABLE public.core_rules TO service_role;
GRANT SELECT ON TABLE public.core_rules TO anon;


--
-- Name: TABLE crafting_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crafting_sessions TO authenticated;
GRANT ALL ON TABLE public.crafting_sessions TO service_role;


--
-- Name: TABLE encounters; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.encounters TO authenticated;
GRANT ALL ON TABLE public.encounters TO service_role;


--
-- Name: TABLE official_creatures; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.official_creatures TO authenticated;
GRANT ALL ON TABLE public.official_creatures TO service_role;
GRANT SELECT ON TABLE public.official_creatures TO anon;


--
-- Name: TABLE official_empowered_techniques; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.official_empowered_techniques TO authenticated;
GRANT ALL ON TABLE public.official_empowered_techniques TO service_role;
GRANT SELECT ON TABLE public.official_empowered_techniques TO anon;


--
-- Name: TABLE official_enhanced_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.official_enhanced_items TO authenticated;
GRANT ALL ON TABLE public.official_enhanced_items TO service_role;
GRANT SELECT ON TABLE public.official_enhanced_items TO anon;


--
-- Name: TABLE official_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.official_items TO authenticated;
GRANT ALL ON TABLE public.official_items TO service_role;
GRANT SELECT ON TABLE public.official_items TO anon;


--
-- Name: TABLE official_powers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.official_powers TO authenticated;
GRANT ALL ON TABLE public.official_powers TO service_role;
GRANT SELECT ON TABLE public.official_powers TO anon;


--
-- Name: TABLE official_techniques; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.official_techniques TO authenticated;
GRANT ALL ON TABLE public.official_techniques TO service_role;
GRANT SELECT ON TABLE public.official_techniques TO anon;


--
-- Name: TABLE realms_image_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.realms_image_categories TO authenticated;
GRANT ALL ON TABLE public.realms_image_categories TO service_role;
GRANT SELECT ON TABLE public.realms_image_categories TO anon;


--
-- Name: TABLE realms_images; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.realms_images TO authenticated;
GRANT ALL ON TABLE public.realms_images TO service_role;
GRANT SELECT ON TABLE public.realms_images TO anon;


--
-- Name: TABLE role_policies; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.role_policies TO authenticated;
GRANT ALL ON TABLE public.role_policies TO service_role;


--
-- Name: TABLE user_creatures; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_creatures TO authenticated;
GRANT ALL ON TABLE public.user_creatures TO service_role;


--
-- Name: TABLE user_empowered_techniques; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_empowered_techniques TO authenticated;
GRANT ALL ON TABLE public.user_empowered_techniques TO service_role;


--
-- Name: TABLE user_enhanced_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_enhanced_items TO authenticated;
GRANT ALL ON TABLE public.user_enhanced_items TO service_role;


--
-- Name: TABLE user_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_items TO authenticated;
GRANT ALL ON TABLE public.user_items TO service_role;


--
-- Name: TABLE user_powers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_powers TO authenticated;
GRANT ALL ON TABLE public.user_powers TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: COLUMN user_profiles.id; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(id) ON TABLE public.user_profiles TO authenticated;


--
-- Name: COLUMN user_profiles.display_name; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(display_name),UPDATE(display_name) ON TABLE public.user_profiles TO authenticated;


--
-- Name: COLUMN user_profiles.created_at; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(created_at) ON TABLE public.user_profiles TO authenticated;


--
-- Name: COLUMN user_profiles.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(updated_at),UPDATE(updated_at) ON TABLE public.user_profiles TO authenticated;


--
-- Name: TABLE user_species; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_species TO authenticated;
GRANT ALL ON TABLE public.user_species TO service_role;


--
-- Name: TABLE user_techniques; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_techniques TO authenticated;
GRANT ALL ON TABLE public.user_techniques TO service_role;


--
-- Name: TABLE usernames; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.usernames TO authenticated;
GRANT ALL ON TABLE public.usernames TO service_role;


--
-- Name: TABLE vtt_actions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vtt_actions TO authenticated;
GRANT ALL ON TABLE public.vtt_actions TO service_role;


--
-- Name: TABLE vtt_scenes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vtt_scenes TO authenticated;
GRANT ALL ON TABLE public.vtt_scenes TO service_role;


--
-- Name: TABLE vtt_tokens; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vtt_tokens TO authenticated;
GRANT ALL ON TABLE public.vtt_tokens TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2026_11_17; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages_2026_11_17 TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages_2026_11_17 TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages_2026_11_17 TO dashboard_user;


--
-- Name: TABLE messages_2026_11_18; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages_2026_11_18 TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages_2026_11_18 TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages_2026_11_18 TO dashboard_user;


--
-- Name: TABLE messages_2026_11_19; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages_2026_11_19 TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages_2026_11_19 TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages_2026_11_19 TO dashboard_user;


--
-- Name: TABLE messages_2026_11_20; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages_2026_11_20 TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages_2026_11_20 TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages_2026_11_20 TO dashboard_user;


--
-- Name: TABLE messages_2026_11_21; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages_2026_11_21 TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages_2026_11_21 TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages_2026_11_21 TO dashboard_user;


--
-- Name: TABLE messages_2026_11_22; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages_2026_11_22 TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages_2026_11_22 TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages_2026_11_22 TO dashboard_user;


--
-- Name: TABLE messages_2026_11_23; Type: ACL; Schema: realtime; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages_2026_11_23 TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages_2026_11_23 TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages_2026_11_23 TO dashboard_user;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: -
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;


--
-- Name: TABLE bucket_lifecycle_states; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.bucket_lifecycle_states TO service_role;
GRANT SELECT ON TABLE storage.bucket_lifecycle_states TO postgres;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets_analytics TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: -
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;


--
-- Name: TABLE lifecycle_abandoned_artifacts; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.lifecycle_abandoned_artifacts TO service_role;
GRANT SELECT ON TABLE storage.lifecycle_abandoned_artifacts TO postgres;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: -
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.objects TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: -
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: -
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: -
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: -
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT SELECT,INSERT ON TABLES TO postgres WITH GRANT OPTION;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict pZcaD7tY2VgNRh4lxstxYPDezqHVCG8FIpMVNVRndQyYihcRqIkz3chwS21DD6b

