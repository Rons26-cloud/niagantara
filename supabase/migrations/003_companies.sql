create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) >= 2),
  legal_name text,
  status text not null default 'trial' check (status in ('active', 'trial', 'suspended', 'archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_created_by_idx on public.companies(created_by);
alter table public.companies enable row level security;
revoke all on table public.companies from anon, authenticated;
grant select, update on table public.companies to authenticated;
