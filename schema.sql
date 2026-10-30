-- Student Placement and Career Portal
-- Run this file in Supabase Dashboard > SQL Editor > New query.
-- This schema is for the classroom MVP. Before production, enable Supabase Auth
-- and scope every profile/application query to the authenticated user's ID.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 1 and 80),
  email text not null unique,
  course text,
  graduation_year integer check (graduation_year is null or graduation_year between 2020 and 2100),
  skills text[] not null default '{}',
  linkedin text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 120),
  company text not null check (char_length(trim(company)) between 2 and 120),
  location text not null default 'Remote',
  job_type text not null check (job_type in ('Full-time','Internship','Part-time')),
  salary text,
  skills text[] not null default '{}',
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  cover_note text not null default '',
  status text not null default 'Applied' check (status in ('Applied','Under Review','Interview','Rejected','Offer')),
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(student_id, job_id)
);

create index if not exists jobs_active_created_idx on public.jobs(is_active, created_at desc);
create index if not exists applications_student_applied_idx on public.applications(student_id, applied_at desc);
create index if not exists applications_job_idx on public.applications(job_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs
for each row execute function public.set_updated_at();

-- API access is through the Node server using a server-only service-role key.
-- Do not expose that key to the browser. RLS is enabled as a defense-in-depth
-- measure; the service role bypasses RLS, so the API must enforce permissions.
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- Public read access for active job listings via anon key is optional. The provided
-- backend uses the service role, so these policies are not needed for that API.
-- No anon write policies are created intentionally.

-- Seed six demo opportunities. Re-running the script won't create duplicates.
insert into public.jobs(title,company,location,job_type,salary,skills,description)
select v.title,v.company,v.location,v.job_type,v.salary,v.skills,v.description
from (values
 ('Frontend Developer Intern','PixelCraft','Hyderabad','Internship','₹15k–20k/mo',array['HTML','CSS','JavaScript'],'Help create delightful and accessible web experiences with a product-focused team.'),
 ('Graduate Software Engineer','Nexora Technologies','Bengaluru','Full-time','₹6–8 LPA',array['JavaScript','SQL','Problem solving'],'Build and maintain reliable software products while learning from experienced engineers.'),
 ('Data Analyst Intern','InsightLoop','Remote','Internship','₹12k–18k/mo',array['SQL','Excel','Python'],'Turn business data into clear insights and help teams make better decisions.'),
 ('UI/UX Design Intern','Northstar Studio','Hyderabad','Internship','₹10k–15k/mo',array['Figma','Wireframes','Research'],'Support user research and design intuitive interfaces for real customer problems.'),
 ('Backend Developer','CloudHarbor','Pune','Full-time','₹5–7 LPA',array['Node.js','REST APIs','PostgreSQL'],'Develop secure APIs and database-backed features for a growing SaaS platform.'),
 ('Campus Marketing Associate','BrightPath','Remote','Part-time','₹8k–12k/mo',array['Communication','Content','Planning'],'Help student communities discover career resources and early-career opportunities.')
) as v(title,company,location,job_type,salary,skills,description)
where not exists (select 1 from public.jobs j where j.title=v.title and j.company=v.company);
