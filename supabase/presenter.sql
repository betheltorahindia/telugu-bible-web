-- Supabase schema for Verse Presenter
-- Run in the public schema of your Supabase project

create extension if not exists "pgcrypto" with schema public;

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.premium_users (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  "order" integer not null,
  book smallint not null,
  chapter smallint not null,
  verse smallint not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists projects_owner_idx on public.projects (owner_user_id);
create unique index if not exists projects_slug_unique on public.projects (lower(slug));
create index if not exists project_items_project_order_idx on public.project_items (project_id, "order");

create or replace function public.touch_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.enforce_project_quota()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_role text := coalesce(auth.role(), '');
  owner uuid := auth.uid();
  requester_email text := lower(coalesce(current_setting('request.jwt.claim.email', true), ''));
  existing_count integer;
  is_admin boolean;
  is_premium boolean;
begin
  if current_role = 'service_role' then
    return new;
  end if;

  if owner is null then
    return new;
  end if;

  if new.owner_user_id is distinct from owner then
    return new;
  end if;

  select exists(select 1 from public.admin_users where email = requester_email) into is_admin;
  if is_admin then
    return new;
  end if;

  select exists(select 1 from public.premium_users where email = requester_email) into is_premium;
  if is_premium then
    return new;
  end if;

  select count(*) into existing_count from public.projects where owner_user_id = owner;

  if existing_count >= 5 then
    raise exception 'Project limit reached (5 projects max).'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row
  execute function public.touch_projects_updated_at();

drop trigger if exists enforce_project_quota on public.projects;
create trigger enforce_project_quota
  before insert on public.projects
  for each row
  execute function public.enforce_project_quota();

alter table public.projects enable row level security;
alter table public.project_items enable row level security;

-- Projects policies

drop policy if exists "Projects service role access" on public.projects;
create policy "Projects service role access"
  on public.projects
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Projects are readable by owner" on public.projects;
create policy "Projects are readable by owner"
  on public.projects
  for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Projects are insertable by owner" on public.projects;
create policy "Projects are insertable by owner"
  on public.projects
  for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "Projects are updatable by owner" on public.projects;
create policy "Projects are updatable by owner"
  on public.projects
  for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "Projects are deletable by owner" on public.projects;
create policy "Projects are deletable by owner"
  on public.projects
  for delete
  using (auth.uid() = owner_user_id);

-- Project items policies

drop policy if exists "Project items service role access" on public.project_items;
create policy "Project items service role access"
  on public.project_items
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Project items are readable by owner" on public.project_items;
create policy "Project items are readable by owner"
  on public.project_items
  for select
  using (exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.owner_user_id = auth.uid()
  ));

drop policy if exists "Project items are insertable by owner" on public.project_items;
create policy "Project items are insertable by owner"
  on public.project_items
  for insert
  with check (exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.owner_user_id = auth.uid()
  ));

drop policy if exists "Project items are updatable by owner" on public.project_items;
create policy "Project items are updatable by owner"
  on public.project_items
  for update
  using (exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.owner_user_id = auth.uid()
  ));

drop policy if exists "Project items are deletable by owner" on public.project_items;
create policy "Project items are deletable by owner"
  on public.project_items
  for delete
  using (exists (
    select 1
    from public.projects p
    where p.id = project_items.project_id
      and p.owner_user_id = auth.uid()
  ));

