-- 1. Patients
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  patient_acct_no text,
  full_name text not null,
  dob date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_patients_lookup on public.patients(organization_id, practice_id, full_name);

-- 2. Claims
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete set null,
  payer_id uuid references public.payers(id) on delete set null,
  software_template_id uuid references public.software_templates(id) on delete set null,

  claim_no text not null,
  patient_name text not null,
  patient_acct_no text,
  service_date date not null,
  denial_date date,

  billed_amount numeric(12,2) not null default 0 check (billed_amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  balance_amount numeric(12,2) generated always as (greatest(billed_amount - paid_amount, 0)) stored,

  action text not null default 'New',
  submitted_status text check (submitted_status in ('First', 'Second', 'Third')),
  responsible text,
  denial_codes text[] not null default '{}',
  extra_fields jsonb not null default '{}'::jsonb,

  ar1_user_id uuid references public.user_profiles(id) on delete set null,
  ar2_user_id uuid references public.user_profiles(id) on delete set null,
  follow_up_date date,
  escalated boolean not null default false,
  closed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, practice_id, claim_no)
);

-- High-frequency worklist search & filter indexes
create index idx_claims_worklist on public.claims(organization_id, practice_id, action, service_date)
  where deleted_at is null;
create index idx_claims_ar_users on public.claims(organization_id, ar1_user_id, ar2_user_id)
  where deleted_at is null;
create index idx_claims_denial_codes on public.claims using gin(denial_codes);

create trigger trg_claims_updated_at
before update on public.claims
for each row execute function public.set_updated_at();

-- 3. Claim Activity History
create table public.claim_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  action text not null,
  action_date date not null default current_date,
  comment text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_claim_events_claim on public.claim_events(claim_id, created_at desc);

-- 4. AR Assignments & Follow-up Tasks
create table public.ar_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  slot text not null check (slot in ('ar1', 'ar2')),
  assigned_to uuid not null references public.user_profiles(id),
  assigned_by uuid references public.user_profiles(id),
  assigned_at timestamptz not null default now()
);

create table public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  assigned_to uuid not null references public.user_profiles(id),
  due_date date not null,
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Escalated')),
  status text not null default 'Open' check (status in ('Open', 'Completed', 'Cancelled')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. Remittances (ERA / 835) & Payments
create table public.remittances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payer_id uuid references public.payers(id),
  trace_number text not null,
  payment_date date not null,
  total_amount numeric(12,2) not null,
  raw_cloudinary_public_id text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  remittance_id uuid references public.remittances(id) on delete set null,
  patient_acct_no text,
  patient_name text not null,
  service_date date not null,
  payment_date date not null,
  transaction_by text,
  amount numeric(12,2) not null check (amount > 0),
  match_status text not null default 'Unmatched' check (
    match_status in ('Matched', 'Partial', 'Multiple_Match', 'Unmatched', 'Duplicate')
  ),
  created_at timestamptz not null default now()
);

create table public.payment_claim_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  applied_amount numeric(12,2) not null check (applied_amount > 0),
  matched_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now()
);
