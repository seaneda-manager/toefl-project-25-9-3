-- Create individual test tables for each skill
create table if not exists public.speaking_tests (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  is_locked boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.listening_tests (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  is_locked boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.reading_tests (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  is_locked boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.writing_tests (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  is_locked boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Check if test_assignments already has the new columns, if not add them
do $$
begin
  -- Add new columns if they don't exist
  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='speaking_test_id') then
    alter table public.test_assignments add column speaking_test_id uuid references speaking_tests(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='listening_test_id') then
    alter table public.test_assignments add column listening_test_id uuid references listening_tests(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='reading_test_id') then
    alter table public.test_assignments add column reading_test_id uuid references reading_tests(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='writing_test_id') then
    alter table public.test_assignments add column writing_test_id uuid references writing_tests(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='assigned_by') then
    alter table public.test_assignments add column assigned_by uuid references auth.users(id);
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='sections') then
    alter table public.test_assignments add column sections text[] default '{}';
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='due_date') then
    alter table public.test_assignments add column due_date timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='assigned_at') then
    alter table public.test_assignments add column assigned_at timestamptz default now();
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='started_at') then
    alter table public.test_assignments add column started_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='completed_at') then
    alter table public.test_assignments add column completed_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='test_assignments' and column_name='updated_at') then
    alter table public.test_assignments add column updated_at timestamptz default now();
  end if;
end $$;

-- Create indexes for common queries if they don't exist
create index if not exists test_assignments_speaking_test_id_idx on test_assignments(speaking_test_id);
create index if not exists test_assignments_listening_test_id_idx on test_assignments(listening_test_id);
create index if not exists test_assignments_reading_test_id_idx on test_assignments(reading_test_id);
create index if not exists test_assignments_writing_test_id_idx on test_assignments(writing_test_id);
create index if not exists test_assignments_assigned_by_idx on test_assignments(assigned_by);

-- Enable RLS for new test tables if not already enabled
alter table public.speaking_tests enable row level security;
alter table public.listening_tests enable row level security;
alter table public.reading_tests enable row level security;
alter table public.writing_tests enable row level security;

-- Drop old policies if they exist and recreate them
drop policy if exists "speaking_tests_select" on public.speaking_tests;
drop policy if exists "speaking_tests_insert" on public.speaking_tests;
drop policy if exists "speaking_tests_update" on public.speaking_tests;
drop policy if exists "listening_tests_select" on public.listening_tests;
drop policy if exists "listening_tests_insert" on public.listening_tests;
drop policy if exists "listening_tests_update" on public.listening_tests;
drop policy if exists "reading_tests_select" on public.reading_tests;
drop policy if exists "reading_tests_insert" on public.reading_tests;
drop policy if exists "reading_tests_update" on public.reading_tests;
drop policy if exists "writing_tests_select" on public.writing_tests;
drop policy if exists "writing_tests_insert" on public.writing_tests;
drop policy if exists "writing_tests_update" on public.writing_tests;

-- RLS Policies for test tables (teachers/admins can view/create/edit)
create policy "speaking_tests_select" on public.speaking_tests for select using (true);
create policy "speaking_tests_insert" on public.speaking_tests for insert with check (auth.jwt() ->> 'role' = 'authenticated');
create policy "speaking_tests_update" on public.speaking_tests for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "listening_tests_select" on public.listening_tests for select using (true);
create policy "listening_tests_insert" on public.listening_tests for insert with check (auth.jwt() ->> 'role' = 'authenticated');
create policy "listening_tests_update" on public.listening_tests for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "reading_tests_select" on public.reading_tests for select using (true);
create policy "reading_tests_insert" on public.reading_tests for insert with check (auth.jwt() ->> 'role' = 'authenticated');
create policy "reading_tests_update" on public.reading_tests for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "writing_tests_select" on public.writing_tests for select using (true);
create policy "writing_tests_insert" on public.writing_tests for insert with check (auth.jwt() ->> 'role' = 'authenticated');
create policy "writing_tests_update" on public.writing_tests for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
