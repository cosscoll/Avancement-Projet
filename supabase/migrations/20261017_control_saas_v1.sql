-- CONTROL SaaS V1. Independent Supabase project ONLY; never run in IAgile or any product database.
-- Every record belongs to an authenticated user. No passwords/API tokens stored.
create extension if not exists pgcrypto;

create table public.control_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (char_length(display_name) <= 100),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.control_projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 140),
 description text not null default '' check (char_length(description) <= 6000),
 category text not null default '' check (char_length(category) <= 70),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint control_projects_owner_key unique (id, owner_id)
);
create index control_projects_owner_created_idx on public.control_projects (owner_id, created_at desc);

create table public.control_items (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 project_id uuid,
 kind text not null check (kind in ('ai_space','conversation','resource','task','mission','automation','report','decision','note','event','expense','income')),
 title text not null check (char_length(trim(title)) between 1 and 200),
 provider text not null default '' check (char_length(provider) <= 60),
 url text not null default '' check (char_length(url) <= 2100),
 body text not null default '' check (char_length(body) <= 30000),
 status text not null default '' check (char_length(status) <= 35),
 due_at timestamptz,
 details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and pg_column_size(details) < 30000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint control_items_owned_project_fk foreign key (project_id, owner_id)
    references public.control_projects (id, owner_id) on delete cascade,
 constraint control_items_https check (url = '' or url ~ '^https://[^[:space:]]+$')
);
create index control_items_owner_project_idx on public.control_items (owner_id, project_id, created_at desc);
create index control_items_owner_kind_status_idx on public.control_items (owner_id, kind, status);

create table public.control_preferences (
 owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 30000),
 updated_at timestamptz not null default now()
);

-- Connector metadata ONLY. No access tokens, refresh tokens, passwords or API keys.
create table public.control_connections (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 provider text not null check (char_length(trim(provider)) between 1 and 60),
 label text not null default '' check (char_length(label) <= 100),
 auth_type text not null default 'deep_link' check (auth_type in ('deep_link','not_connected')),
 status text not null default 'link_only' check (status in ('link_only','not_connected')),
 created_at timestamptz not null default now()
);
create index control_connections_owner_idx on public.control_connections (owner_id, created_at desc);

-- Append-only per-user audit trail. No cross-tenant access; not a guaranteed server audit log.
create table public.control_audit_events (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 action text not null check (char_length(action) between 1 and 100),
 entity_type text not null check (char_length(entity_type) <= 50),
 entity_id uuid,
 created_at timestamptz not null default now()
);
create index control_audit_owner_idx on public.control_audit_events (owner_id, created_at desc);

alter table public.control_profiles enable row level security;
alter table public.control_projects enable row level security;
alter table public.control_items enable row level security;
alter table public.control_preferences enable row level security;
alter table public.control_connections enable row level security;
alter table public.control_audit_events enable row level security;

-- Explicit least privilege for the browser's publishable key.
revoke all on public.control_profiles, public.control_projects, public.control_items, public.control_preferences, public.control_connections, public.control_audit_events from anon;
revoke all on public.control_profiles, public.control_projects, public.control_items, public.control_preferences, public.control_connections, public.control_audit_events from public;
grant select, insert, update, delete on public.control_profiles, public.control_projects, public.control_items, public.control_preferences, public.control_connections to authenticated;
grant select, insert on public.control_audit_events to authenticated;

create policy control_profiles_owner on public.control_profiles for all to authenticated
 using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy control_projects_owner on public.control_projects for all to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy control_items_owner on public.control_items for all to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy control_preferences_owner on public.control_preferences for all to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy control_connections_owner on public.control_connections for all to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy control_audit_select on public.control_audit_events for select to authenticated
 using (owner_id = (select auth.uid()));
create policy control_audit_insert on public.control_audit_events for insert to authenticated
 with check (owner_id = (select auth.uid()));

comment on table public.control_items is 'Tenant-owned user content; never store OAuth, ChatGPT, Claude or Gemini access tokens here.';
comment on table public.control_connections is 'Public metadata for links only, not authenticated OAuth credentials.';
