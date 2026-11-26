-- Seed Organization, Default Practice, and 6 Role-Based Test Users
insert into public.organizations (id, name, status)
values ('11111111-1111-1111-1111-111111111111', 'ClaimFlow Medical Group', 'Active')
on conflict (id) do nothing;

insert into public.practices (id, organization_id, code, name, npi, status)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'PR-1001', 'Lakeshore Medical Practice', '1234567890', 'Active')
on conflict (id) do nothing;

insert into public.user_profiles (id, organization_id, role_id, full_name, email, status, color_index)
select u.uid, '11111111-1111-1111-1111-111111111111', r.id, u.full_name, u.email, 'Active', u.color_idx
from (values
  ('752945cd-6637-43d6-a6d1-a3fa8d511e9a'::uuid, 'super_admin', 'Super Admin User', 'super@teat.com', 0),
  ('60a5c884-2796-49f1-bd9a-4a3640547924'::uuid, 'org_admin',   'Org Admin User',   'admin@test.com', 1),
  ('e483b333-76fd-492e-847d-c6aa3dc9d558'::uuid, 'manager',     'Manager User',     'manager@test.com', 2),
  ('be6c8ad4-b501-469d-bb99-cf195db15576'::uuid, 'ar_1',        'AR Agent 1',       'ar1@test.com', 3),
  ('b97ccbd6-3580-4592-8880-93461c723b90'::uuid, 'ar_2',        'AR Agent 2',       'ar2@test.com', 4),
  ('ba0b05e5-6229-49bf-b587-3ed067436ce7'::uuid, 'viewer',      'Viewer User',      'viewer@test.com', 5)
) as u(uid, role_key, full_name, email, color_idx)
join public.roles r on r.key = u.role_key
on conflict (id) do update
set role_id = excluded.role_id,
    organization_id = excluded.organization_id,
    full_name = excluded.full_name,
    email = excluded.email,
    status = 'Active';

-- Assign AR Agent 1, AR Agent 2, and Viewer to the default practice for practice-level RLS
insert into public.user_practices (user_id, practice_id)
values
  ('be6c8ad4-b501-469d-bb99-cf195db15576', '22222222-2222-2222-2222-222222222222'),
  ('b97ccbd6-3580-4592-8880-93461c723b90', '22222222-2222-2222-2222-222222222222'),
  ('ba0b05e5-6229-49bf-b587-3ed067436ce7', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;
