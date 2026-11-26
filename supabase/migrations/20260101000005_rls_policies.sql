-- Security helper functions (evaluated via auth.uid())
create or replace function public.auth_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id from public.user_profiles where id = auth.uid() and deleted_at is null;
$$;

create or replace function public.auth_role_key()
returns text
language sql
stable
security definer
as $$
  select r.key
  from public.user_profiles u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid() and u.deleted_at is null;
$$;

create or replace function public.has_practice_access(p_practice_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select
    public.auth_role_key() in ('super_admin', 'org_admin', 'manager')
    or exists (
      select 1 from public.user_practices up
      where up.user_id = auth.uid() and up.practice_id = p_practice_id
    );
$$;

-- Enable RLS across all tenant tables
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.practices enable row level security;
alter table public.claims enable row level security;
alter table public.claim_events enable row level security;
alter table public.denial_codes enable row level security;
alter table public.documents enable row level security;
alter table public.help_contacts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.payers enable row level security;
alter table public.import_jobs enable row level security;
alter table public.notifications enable row level security;

-- Organization isolation + Practice-level isolation on Claims
create policy "claims_select_policy" on public.claims
for select using (
  deleted_at is null
  and (
    public.auth_role_key() = 'super_admin'
    or (organization_id = public.auth_org_id() and public.has_practice_access(practice_id))
  )
);

create policy "claims_modify_policy" on public.claims
for all using (
  organization_id = public.auth_org_id()
  and public.auth_role_key() in ('super_admin', 'org_admin', 'manager', 'ar_1', 'ar_2')
  and public.has_practice_access(practice_id)
)
with check (
  organization_id = public.auth_org_id()
  and public.has_practice_access(practice_id)
);

-- Organization isolation on Practices, Denial Codes, Documents, Help Contacts, Payers, Import Jobs
create policy "org_isolation_practices" on public.practices
for all using (deleted_at is null and organization_id = public.auth_org_id());

create policy "org_isolation_denial_codes" on public.denial_codes
for all using (deleted_at is null and organization_id = public.auth_org_id());

create policy "org_isolation_documents" on public.documents
for all using (deleted_at is null and organization_id = public.auth_org_id());

create policy "org_isolation_help_contacts" on public.help_contacts
for all using (deleted_at is null and organization_id = public.auth_org_id());

create policy "org_isolation_payers" on public.payers
for all using (deleted_at is null and organization_id = public.auth_org_id());

create policy "org_isolation_import_jobs" on public.import_jobs
for all using (organization_id = public.auth_org_id());

create policy "user_notifications" on public.notifications
for all using (organization_id = public.auth_org_id() and user_id = auth.uid());

-- Audit logs: append-only for authenticated users, read-only for Admins/Managers
create policy "audit_logs_insert" on public.audit_logs
for insert with check (organization_id = public.auth_org_id());

create policy "audit_logs_select" on public.audit_logs
for select using (
  organization_id = public.auth_org_id()
  and public.auth_role_key() in ('super_admin', 'org_admin', 'manager')
);
