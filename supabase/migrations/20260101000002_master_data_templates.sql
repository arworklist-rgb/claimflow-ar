-- 1. Practices
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  npi text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code)
);

create index idx_practices_org on public.practices(organization_id) where deleted_at is null;

create trigger trg_practices_updated_at
before update on public.practices
for each row execute function public.set_updated_at();

-- 2. Practice-level User Access
create table public.user_practices (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, practice_id)
);

-- 3. Payers
create table public.payers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payer_code text not null,
  name text not null,
  edi_payer_id text,
  timely_filing_days integer not null default 90,
  appeal_filing_days integer not null default 60,
  phone text,
  portal_url text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, payer_code)
);

-- 4. Denial Codes (CARC/RARC)
create table public.denial_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  code_type text not null default 'CARC' check (code_type in ('CARC', 'RARC', 'Internal')),
  description text not null,
  category text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, code)
);

-- 5. Claim Statuses & Aging Buckets
create table public.claim_status_buckets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('status', 'aging_bucket')),
  label text not null,
  min_days integer,
  max_days integer,
  sort_order integer not null default 0,
  is_closing boolean not null default false,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now()
);

-- 6. Upload Templates, Custom Fields & Worklist Columns
create table public.software_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  columns_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null check (field_type in ('text', 'number', 'date', 'select')),
  options jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, field_key)
);

create table public.worklist_columns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_key text not null,
  label text not null,
  visible boolean not null default true,
  sort_order integer not null default 0,
  unique (organization_id, field_key)
);
