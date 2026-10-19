\set ON_ERROR_STOP on
-- Real PostgreSQL row-level checks with two synthetic account IDs.
-- This DOES NOT prove Supabase deployment, JWT validation or phone synchronization.
SET ROLE authenticated;
SET "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
DO $check$
BEGIN
 IF (SELECT auth.uid()) IS DISTINCT FROM '00000000-0000-4000-8000-000000000001'::uuid
 THEN RAISE EXCEPTION 'Test authentication emulation failed for account A'; END IF;
END $check$;
INSERT INTO public.control_profiles (user_id,display_name)
 VALUES ('00000000-0000-4000-8000-000000000001','Synthetic A');
INSERT INTO public.control_projects (id,name)
 VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Private A');
INSERT INTO public.control_items (id,project_id,kind,title)
 VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','task','Private task of A');
INSERT INTO public.control_preferences (settings) VALUES ('{"theme":"light"}');
INSERT INTO public.control_connections (provider,label) VALUES ('ChatGPT','A-only metadata');
INSERT INTO public.control_audit_events (action,entity_type) VALUES ('test_read','project');
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.control_profiles) <> 1
 OR (SELECT count(*) FROM public.control_projects) <> 1
 OR (SELECT count(*) FROM public.control_items) <> 1
 OR (SELECT count(*) FROM public.control_preferences) <> 1
 OR (SELECT count(*) FROM public.control_connections) <> 1
 OR (SELECT count(*) FROM public.control_audit_events) <> 1
 THEN RAISE EXCEPTION 'Account A cannot read its own six record types'; END IF;
END $check$;
\echo RLS PASS: account A can create and read six private record types

SET "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.control_profiles) <> 0
 OR (SELECT count(*) FROM public.control_projects) <> 0
 OR (SELECT count(*) FROM public.control_items) <> 0
 OR (SELECT count(*) FROM public.control_preferences) <> 0
 OR (SELECT count(*) FROM public.control_connections) <> 0
 OR (SELECT count(*) FROM public.control_audit_events) <> 0
 THEN RAISE EXCEPTION 'Account B can read account A private records'; END IF;
END $check$;
\echo RLS PASS: account B sees zero rows belonging to A

-- UPDATE/DELETE of another account's project are zero-row operations.
DO $check$
DECLARE changed integer;
BEGIN
 UPDATE public.control_projects SET name='CORRUPTED' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'B modified A project'; END IF;
 DELETE FROM public.control_items WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'B deleted A item'; END IF;
END $check$;
\echo RLS PASS: cross-account update/delete are blocked

-- Owner-id spoofing MUST be denied by the real RLS WITH CHECK predicates.
DO $check$
BEGIN
 BEGIN
  INSERT INTO public.control_projects (owner_id,name)
  VALUES ('00000000-0000-4000-8000-000000000001','spoofed');
  RAISE EXCEPTION 'B inserted a project owned by A';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  INSERT INTO public.control_audit_events (owner_id,action,entity_type)
  VALUES ('00000000-0000-4000-8000-000000000001','fake','project');
  RAISE EXCEPTION 'B forged account A audit';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  INSERT INTO public.control_profiles (user_id,display_name)
  VALUES ('00000000-0000-4000-8000-000000000001','spoofed');
  RAISE EXCEPTION 'B impersonated account A profile';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $check$;
\echo RLS PASS: owner spoofing refused in project, audit and profile

-- Even a legitimate B-owned item CANNOT point to A's project: composite FK.
DO $check$
BEGIN
 BEGIN
  INSERT INTO public.control_items (owner_id,project_id,kind,title)
  VALUES ('00000000-0000-4000-8000-000000000002',
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','task','cross-project');
  RAISE EXCEPTION 'B linked an item into A project';
 EXCEPTION WHEN foreign_key_violation THEN NULL;
 END;
END $check$;
\echo RLS PASS: composite owner/project FK prevents cross-tenant linking

INSERT INTO public.control_projects (id,name)
 VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Private B');
INSERT INTO public.control_items (id,project_id,kind,title)
 VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','task','Private B task');
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.control_projects)<>1
 OR (SELECT count(*) FROM public.control_items)<>1
 THEN RAISE EXCEPTION 'Account B data isolation failed after own inserts'; END IF;
END $check$;
SET "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.control_projects)<>1
 OR (SELECT count(*) FROM public.control_items)<>1
 OR EXISTS (SELECT 1 FROM public.control_projects WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
 THEN RAISE EXCEPTION 'Account A sees B after B inserts'; END IF;
END $check$;
\echo RLS PASS: both users' private records stay isolated bidirectionally

-- A tenant must not reassign ownership to B, even for a row they own.
DO $check$
BEGIN
 BEGIN
  UPDATE public.control_projects
  SET owner_id='00000000-0000-4000-8000-000000000002'
  WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'A reassigned their project into account B';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  UPDATE public.control_items
  SET owner_id='00000000-0000-4000-8000-000000000002'
  WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  RAISE EXCEPTION 'A reassigned their item into account B';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $check$;
\echo RLS PASS: ownership cannot be transferred with an authenticated client

-- Even if a caller has the authenticated DB role, no valid JWT subject must fail closed.
RESET "request.jwt.claim.sub";
DO $check$
BEGIN
 IF (SELECT auth.uid()) IS NOT NULL
 OR (SELECT count(*) FROM public.control_projects) <> 0
 OR (SELECT count(*) FROM public.control_items) <> 0
 OR (SELECT count(*) FROM public.control_profiles) <> 0
 THEN RAISE EXCEPTION 'Authenticated-role request without user identity accessed data'; END IF;
 BEGIN
  INSERT INTO public.control_projects (owner_id,name)
  VALUES ('00000000-0000-4000-8000-000000000001','no identity');
  RAISE EXCEPTION 'Authenticated role without identity inserted A project';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $check$;
\echo RLS PASS: authenticated DB role with missing identity cannot read/write another account
SET "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';


-- Audit is append-only for authenticated clients. Service-only quota function.
DO $check$
BEGIN
 IF has_table_privilege('authenticated','public.control_audit_events','UPDATE')
 OR has_table_privilege('authenticated','public.control_audit_events','DELETE')
 OR has_table_privilege('anon','public.control_projects','SELECT')
 OR has_function_privilege('authenticated','public.control_claim_ai_quota(uuid,text,integer)','EXECUTE')
 OR has_function_privilege('anon','public.control_claim_ai_quota(uuid,text,integer)','EXECUTE')
 OR NOT has_function_privilege('service_role','public.control_claim_ai_quota(uuid,text,integer)','EXECUTE')
 THEN RAISE EXCEPTION 'Incorrect audit/anon/quota function privileges'; END IF;
END $check$;
\echo RLS PASS: audit cannot be edited and quota definer function is service-only

RESET ROLE;
SET ROLE anon;
RESET "request.jwt.claim.sub";
DO $check$
BEGIN
 BEGIN
  EXECUTE 'SELECT count(*) FROM public.control_projects';
  RAISE EXCEPTION 'Anonymous project SELECT unexpectedly succeeded';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  EXECUTE 'INSERT INTO public.control_projects(name) VALUES (''Anonymous'')';
  RAISE EXCEPTION 'Anonymous project INSERT unexpectedly succeeded';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $check$;
\echo RLS PASS: anonymous requests cannot select or write private project records

RESET ROLE;
DO $check$
DECLARE n int;
BEGIN
 SELECT COUNT(*) INTO n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
 WHERE ns.nspname='public' AND c.relname LIKE 'control_%' AND c.relkind='r' AND c.relrowsecurity;
 IF n <> 7 THEN RAISE EXCEPTION 'Unexpected RLS table count: %, wanted 7',n; END IF;
END $check$;
\echo RLS A/B POSTGRESQL SUITE: ALL CHECKS PASSED (mock Supabase auth.uid; not deployed)
