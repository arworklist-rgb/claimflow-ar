-- Allow authenticated users to read their own profile and organization
create policy "user_profiles_self_or_org" on public.user_profiles
for select using (
  deleted_at is null
  and (id = auth.uid() or organization_id = public.auth_org_id() or public.auth_role_key() = 'super_admin')
);

create policy "organizations_member_select" on public.organizations
for select using (
  deleted_at is null
  and (id = public.auth_org_id() or public.auth_role_key() = 'super_admin')
);
