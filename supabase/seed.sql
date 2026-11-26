-- Seed 6 System Roles
insert into public.roles (key, name, description, is_system) values
  ('super_admin', 'Super Admin', 'Platform-wide administration across organizations', true),
  ('org_admin', 'Organization Admin', 'Manage organization, practices, users, and templates', true),
  ('manager', 'Manager', 'Manage teams, claims, escalations, and reporting', true),
  ('ar_1', 'AR 1', 'Initial claim investigation and follow-ups', true),
  ('ar_2', 'AR 2', 'Advanced investigation and escalations', true),
  ('viewer', 'Viewer', 'Read-only access', true)
on conflict (key) do nothing;

-- Seed Granular Permissions
insert into public.permissions (key, module, description) values
  ('claims.read', 'worklist', 'View claims and worklist'),
  ('claims.write', 'worklist', 'Update claim statuses, actions, and comments'),
  ('claims.import', 'upload-claims', 'Upload and import claim/paid spreadsheets'),
  ('claims.assign', 'ar-management', 'Assign and reassign AR 1 / AR 2 specialists'),
  ('practices.manage', 'settings', 'Create, edit, and delete practices'),
  ('denial_codes.manage', 'settings', 'Manage CARC/RARC denial codes'),
  ('templates.manage', 'settings', 'Manage upload templates and custom fields'),
  ('users.manage', 'settings', 'Invite, activate, deactivate, and assign roles to users'),
  ('helpdesk.manage', 'helpdesk', 'Add, edit, and delete HelpDesk contacts'),
  ('documents.read', 'knowledge-center', 'View and download Knowledge Center documents'),
  ('documents.manage', 'knowledge-center', 'Upload, edit, and delete Knowledge Center documents'),
  ('reports.view', 'reporting', 'View dashboards and export reports'),
  ('audit.read', 'security', 'View organization audit logs')
on conflict (key) do nothing;

-- Map default permissions to roles
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  r.key in ('super_admin', 'org_admin')
  or (r.key = 'manager' and p.key not in ('users.manage', 'practices.manage'))
  or (r.key in ('ar_1', 'ar_2') and p.key in ('claims.read', 'claims.write', 'claims.import', 'documents.read', 'documents.manage'))
  or (r.key = 'viewer' and p.key in ('claims.read', 'documents.read', 'reports.view'))
)
on conflict do nothing;
