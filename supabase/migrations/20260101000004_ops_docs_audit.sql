-- 1. Import Jobs & Failed-Row Reporting (Files stored in Cloudinary as authenticated raw assets)
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  practice_id uuid references public.practices(id),
  uploaded_by uuid references public.user_profiles(id),
  job_type text not null check (job_type in ('new_claims', 'paid_claims', 'denial_codes')),
  file_name text not null,
  file_hash text not null,
  cloudinary_public_id text not null,
  cloudinary_resource_type text not null default 'raw',
  status text not null default 'Queued' check (status in ('Queued', 'Processing', 'Completed', 'Failed')),
  total_rows integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.import_job_errors (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  row_number integer not null,
  error_message text not null,
  raw_row jsonb not null
);

-- 2. Knowledge Center Documents (Metadata in PostgreSQL; binary stored in Cloudinary)
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid references public.user_profiles(id),
  title text not null,
  category text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  cloudinary_public_id text not null,
  cloudinary_asset_id text,
  cloudinary_resource_type text not null default 'raw',
  cloudinary_delivery_type text not null default 'authenticated' check (cloudinary_delivery_type in ('authenticated', 'private')),
  retain_until date,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3. HelpDesk Contacts
create table public.help_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  practice_id uuid references public.practices(id) on delete set null,
  category text not null,
  name text not null,
  phones jsonb not null default '[]'::jsonb,
  email text,
  website text,
  hours text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 4. Notifications & Preferences
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  email_assignments boolean not null default true,
  email_followups boolean not null default true,
  email_imports boolean not null default true,
  in_app_enabled boolean not null default true
);

-- 5. Immutable Audit Logs (HIPAA Compliance)
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.user_profiles(id),
  action text not null,
  resource_type text not null,
  resource_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_org_time on public.audit_logs(organization_id, created_at desc);
