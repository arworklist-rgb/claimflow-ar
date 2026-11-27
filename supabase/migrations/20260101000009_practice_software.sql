-- Tie each practice to a billing software template
alter table public.practices
  add column if not exists software_template_id uuid references public.software_templates(id) on delete set null;
