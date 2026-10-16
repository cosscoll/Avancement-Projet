-- CONTROL — Schéma privé prévu, NON APPLIQUÉ.
-- Installation UNIQUEMENT dans un projet Supabase DÉDIÉ après accord explicite
-- sur l'organisation et vérification du tarif 0 €.
-- Aucune donnée réelle ou identifiant utilisateur dans ce fichier public.
-- Les tableaux ci-dessous NE DOIVENT JAMAIS être exposés par politique anon.

create table if not exists public.control_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.control_instructions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null check (project_id in ('pack-pro','banque-ia','ucp','iagile','tcg')),
  author_id uuid not null references auth.users(id),
  body text not null check (char_length(body) between 1 and 20000),
  state text not null default 'new' check (state in ('new','acknowledged','in_progress','completed','blocked')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  completed_at timestamptz,
  sprint_ref text,
  response text,
  constraint completed_requires_date check (state <> 'completed' or completed_at is not null)
);

create index if not exists control_instructions_project_state_idx
  on public.control_instructions(project_id,state,created_at desc);

create table if not exists public.control_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null check (project_id in ('pack-pro','banque-ia','ucp','iagile','tcg')),
  question text not null check (char_length(question) between 1 and 12000),
  options jsonb not null default '[]'::jsonb,
  state text not null default 'pending' check (state in ('pending','accepted','rejected','deferred','blocked')),
  decision_note text,
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists control_decisions_project_idx
  on public.control_decisions(project_id,state,created_at desc);

create table if not exists public.control_alerts (
  id uuid primary key default gen_random_uuid(),
  project_id text not null check (project_id in ('pack-pro','banque-ia','ucp','iagile','tcg')),
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  title text not null check (char_length(title) between 1 and 200),
  details text,
  resolved boolean not null default false,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists control_alerts_project_idx
  on public.control_alerts(project_id,resolved,created_at desc);

create table if not exists public.control_sprints (
  id uuid primary key default gen_random_uuid(),
  public_sprint_id text unique,
  project_id text not null check (project_id in ('pack-pro','banque-ia','ucp','iagile','tcg')),
  started_at timestamptz not null,
  ended_at timestamptz,
  summary text,
  done jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  next_step text,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists control_sprints_project_idx
  on public.control_sprints(project_id,started_at desc);

-- Fail closed : RLS active sur toutes les tables.
alter table public.control_owners enable row level security;
alter table public.control_instructions enable row level security;
alter table public.control_decisions enable row level security;
alter table public.control_alerts enable row level security;
alter table public.control_sprints enable row level security;

-- Ne permettre à personne de s'ajouter comme propriétaire depuis le navigateur.
revoke all on public.control_owners from anon,authenticated;
grant select on public.control_owners to authenticated;
create policy "control owner self only" on public.control_owners
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Les permissions explicites ne donnent RIEN à anon.
revoke all on public.control_instructions from anon,authenticated;
revoke all on public.control_decisions from anon,authenticated;
revoke all on public.control_alerts from anon,authenticated;
revoke all on public.control_sprints from anon,authenticated;
grant select,insert,update on public.control_instructions to authenticated;
grant select,insert,update on public.control_decisions to authenticated;
grant select,update on public.control_alerts to authenticated;
grant select on public.control_sprints to authenticated;

-- L'utilisateur doit d'abord avoir été ajouté à control_owners par une
-- opération d'administration server-side EXPLICITEMENT approuvée.
create policy "owner reads instructions" on public.control_instructions
  for select to authenticated using
  (exists(select 1 from public.control_owners where user_id=(select auth.uid())));
create policy "owner creates own instructions" on public.control_instructions
  for insert to authenticated with check
  (author_id=(select auth.uid()) and
   exists(select 1 from public.control_owners where user_id=(select auth.uid())));
create policy "owner updates instructions" on public.control_instructions
  for update to authenticated using
  (exists(select 1 from public.control_owners where user_id=(select auth.uid())))
  with check (exists(select 1 from public.control_owners where user_id=(select auth.uid())));

create policy "owner reads decisions" on public.control_decisions
  for select to authenticated using
  (exists(select 1 from public.control_owners where user_id=(select auth.uid())));
create policy "owner creates decisions" on public.control_decisions
  for insert to authenticated with check (
    exists(select 1 from public.control_owners where user_id=(select auth.uid()))
    and (decided_by is null or decided_by=(select auth.uid()))
  );
create policy "owner updates decisions" on public.control_decisions
  for update to authenticated using
  (exists(select 1 from public.control_owners where user_id=(select auth.uid())))
  with check (
    exists(select 1 from public.control_owners where user_id=(select auth.uid()))
    and (decided_by is null or decided_by=(select auth.uid()))
  );

create policy "owner reads alerts" on public.control_alerts
  for select to authenticated using
  (exists(select 1 from public.control_owners where user_id=(select auth.uid())));
create policy "owner acknowledges alerts" on public.control_alerts
  for update to authenticated using
  (exists(select 1 from public.control_owners where user_id=(select auth.uid())))
  with check (exists(select 1 from public.control_owners where user_id=(select auth.uid())));

create policy "owner reads private sprint reports" on public.control_sprints
  for select to authenticated using
  (exists(select 1 from public.control_owners where user_id=(select auth.uid())));

-- Administration initiale, après connexion d'un compte Auth autorisé :
-- INSÉRER L'ID EXACT auth.users.id du propriétaire UNIQUEMENT via
-- le tableau de bord Supabase/SQL privilégié, PAS dans ce dépôt public.
-- Ne JAMAIS donner service_role au navigateur.
