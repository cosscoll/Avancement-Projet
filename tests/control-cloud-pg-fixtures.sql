\set ON_ERROR_STOP on
-- This is a disposable PostgreSQL 16 CI database. Not Supabase and not production.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE SQL STABLE AS $auth$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true),'')::uuid;
$auth$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
INSERT INTO auth.users (id) VALUES
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002');
-- Identically guarded production SQL is applied to the isolated mock only.
SET app.control_isolated_project = 'confirmed';
\i supabase/migrations/20261017_control_saas_v1.sql
\i supabase/migrations/20261017_control_ai_dispatch.sql
