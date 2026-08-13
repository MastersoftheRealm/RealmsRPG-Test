--
-- PostgreSQL database dump
--

\restrict hDTMoAYltlmb24sE4O74Mc2oqPXdxL24XD8Ems7YaAHKV9jzoLqXj82U7NYZzw8

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

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
-- Name: content; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA content;


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
    'phone'
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
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
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

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
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
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
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
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
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

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

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
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
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
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
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

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
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
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
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
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

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
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
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

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
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
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
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
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
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
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
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
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
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


SET default_tablespace = '';

SET default_table_access_method = heap;

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
    CONSTRAINT characters_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'campaign'::text, 'public'::text])))
);


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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN codex_feats.base_feat_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codex_feats.base_feat_id IS 'Id of the level-1 feat. NULL for level-1; set for feat_lvl >= 2. Used to group leveled feats and validate prerequisites.';


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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    image_url text
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
    image_url text
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    image_id uuid
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
    image_url text
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
    image_url text
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2026_08_10; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_08_10 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_08_11; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_08_11 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_08_12; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_08_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_08_13; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_08_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_08_14; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_08_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_08_15; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_08_15 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL)))
);


--
-- Name: messages_2026_08_16; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_08_16 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
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
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
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
    user_metadata jsonb
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
-- Name: messages_2026_08_10; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_08_10 FOR VALUES FROM ('2026-08-10 00:00:00') TO ('2026-08-11 00:00:00');


--
-- Name: messages_2026_08_11; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_08_11 FOR VALUES FROM ('2026-08-11 00:00:00') TO ('2026-08-12 00:00:00');


--
-- Name: messages_2026_08_12; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_08_12 FOR VALUES FROM ('2026-08-12 00:00:00') TO ('2026-08-13 00:00:00');


--
-- Name: messages_2026_08_13; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_08_13 FOR VALUES FROM ('2026-08-13 00:00:00') TO ('2026-08-14 00:00:00');


--
-- Name: messages_2026_08_14; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_08_14 FOR VALUES FROM ('2026-08-14 00:00:00') TO ('2026-08-15 00:00:00');


--
-- Name: messages_2026_08_15; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_08_15 FOR VALUES FROM ('2026-08-15 00:00:00') TO ('2026-08-16 00:00:00');


--
-- Name: messages_2026_08_16; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_08_16 FOR VALUES FROM ('2026-08-16 00:00:00') TO ('2026-08-17 00:00:00');


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
-- Name: messages_2026_08_10 messages_2026_08_10_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_08_10
    ADD CONSTRAINT messages_2026_08_10_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_08_11 messages_2026_08_11_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_08_11
    ADD CONSTRAINT messages_2026_08_11_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_08_12 messages_2026_08_12_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_08_12
    ADD CONSTRAINT messages_2026_08_12_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_08_13 messages_2026_08_13_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_08_13
    ADD CONSTRAINT messages_2026_08_13_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_08_14 messages_2026_08_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_08_14
    ADD CONSTRAINT messages_2026_08_14_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_08_15 messages_2026_08_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_08_15
    ADD CONSTRAINT messages_2026_08_15_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_08_16 messages_2026_08_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_08_16
    ADD CONSTRAINT messages_2026_08_16_pkey PRIMARY KEY (id, inserted_at);


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
-- Name: characters_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_user_id_idx ON public.characters USING btree (user_id);


--
-- Name: characters_user_id_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_user_id_updated_at_idx ON public.characters USING btree (user_id, updated_at);


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
-- Name: idx_official_creatures_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_creatures_image_id ON public.official_creatures USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_official_empowered_techniques_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_empowered_techniques_image_id ON public.official_empowered_techniques USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_official_enhanced_items_base_item_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_enhanced_items_base_item_name ON public.official_enhanced_items USING btree (lower(base_item_name));


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
-- Name: idx_official_items_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_items_image_id ON public.official_items USING btree (image_id) WHERE (image_id IS NOT NULL);


--
-- Name: idx_official_powers_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_powers_image_id ON public.official_powers USING btree (image_id) WHERE (image_id IS NOT NULL);


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
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_08_10_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_08_10_inserted_at_topic_idx ON realtime.messages_2026_08_10 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_08_11_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_08_11_inserted_at_topic_idx ON realtime.messages_2026_08_11 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_08_12_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_08_12_inserted_at_topic_idx ON realtime.messages_2026_08_12 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_08_13_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_08_13_inserted_at_topic_idx ON realtime.messages_2026_08_13 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_08_14_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_08_14_inserted_at_topic_idx ON realtime.messages_2026_08_14 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_08_15_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_08_15_inserted_at_topic_idx ON realtime.messages_2026_08_15 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_08_16_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_08_16_inserted_at_topic_idx ON realtime.messages_2026_08_16 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


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
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_08_10_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_08_10_inserted_at_topic_idx;


--
-- Name: messages_2026_08_10_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_08_10_pkey;


--
-- Name: messages_2026_08_11_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_08_11_inserted_at_topic_idx;


--
-- Name: messages_2026_08_11_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_08_11_pkey;


--
-- Name: messages_2026_08_12_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_08_12_inserted_at_topic_idx;


--
-- Name: messages_2026_08_12_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_08_12_pkey;


--
-- Name: messages_2026_08_13_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_08_13_inserted_at_topic_idx;


--
-- Name: messages_2026_08_13_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_08_13_pkey;


--
-- Name: messages_2026_08_14_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_08_14_inserted_at_topic_idx;


--
-- Name: messages_2026_08_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_08_14_pkey;


--
-- Name: messages_2026_08_15_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_08_15_inserted_at_topic_idx;


--
-- Name: messages_2026_08_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_08_15_pkey;


--
-- Name: messages_2026_08_16_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_08_16_inserted_at_topic_idx;


--
-- Name: messages_2026_08_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_08_16_pkey;


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
-- Name: usernames Users can delete own username; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own username" ON public.usernames FOR DELETE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: characters Users can insert own characters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own characters" ON public.characters FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


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
-- Name: usernames Users can insert own username; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own username" ON public.usernames FOR INSERT TO authenticated WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


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
-- Name: characters Users can update own characters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own characters" ON public.characters FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


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
-- Name: usernames Users can update own username; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own username" ON public.usernames FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


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
-- Name: campaign_members campaign_members_insert_owner_or_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_members_insert_owner_or_self ON public.campaign_members FOR INSERT TO authenticated WITH CHECK (((user_id = (( SELECT auth.uid() AS uid))::text) OR private.auth_is_campaign_owner(campaign_id)));


--
-- Name: campaign_members campaign_members_select_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_members_select_participants ON public.campaign_members FOR SELECT TO authenticated USING (((user_id = (( SELECT auth.uid() AS uid))::text) OR private.auth_is_campaign_owner(campaign_id)));


--
-- Name: campaign_members campaign_members_update_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_members_update_self ON public.campaign_members FOR UPDATE TO authenticated USING ((user_id = (( SELECT auth.uid() AS uid))::text)) WITH CHECK ((user_id = (( SELECT auth.uid() AS uid))::text));


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

CREATE POLICY campaigns_select_participants ON public.campaigns FOR SELECT TO authenticated USING (private.auth_is_campaign_participant(id));


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
  WHERE ((((elem.value ? 'characterId'::text) AND ((elem.value ->> 'characterId'::text) = characters.id) AND ((elem.value ->> 'userId'::text) = characters.user_id)) OR ((elem.value ? 'character_id'::text) AND ((elem.value ->> 'character_id'::text) = characters.id) AND ((elem.value ->> 'user_id'::text) = characters.user_id))) AND private.auth_is_campaign_participant(c.id)))))));


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

CREATE POLICY "Users can delete own profile picture" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text))));


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

CREATE POLICY "Users can update own profile picture" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text)))) WITH CHECK (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text))));


--
-- Name: objects Users can upload own portraits; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own portraits" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'portraits'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));


--
-- Name: objects Users can upload own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own profile picture" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'profile-pictures'::text) AND (name ~~ ((( SELECT auth.uid() AS uid))::text || '.%'::text))));


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

\unrestrict hDTMoAYltlmb24sE4O74Mc2oqPXdxL24XD8Ems7YaAHKV9jzoLqXj82U7NYZzw8

