-- Enable required extensions
create extension if not exists "pgcrypto";

-- Reusable updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Organizations (Multi-tenancy root)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  npi text,
  address text,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Suspended')),
  retention_days integer not null default 2555, -- ~7 years HIPAA default
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

-- 2. Roles (6 recommended roles)
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in (
    'super_admin', 'org_admin', 'manager', 'ar_1', 'ar_2', 'viewer'
  )),
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Granular Permissions
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  module text not null,
  description text
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 4. User Profiles (linked 1:1 to Supabase auth.users)
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  full_name text not null,
  email text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Suspended')),
  color_index integer not null default 0,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_user_profiles_org on public.user_profiles(organization_id) where deleted_at is null;

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- 5. Invitations
create table public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles(id),
  practice_ids uuid[] not null default '{}',
  invited_by uuid references public.user_profiles(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
