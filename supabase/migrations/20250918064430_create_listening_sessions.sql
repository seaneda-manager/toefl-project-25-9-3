-- listening_passages 가 아직 없다면 최소 형태로 만들어 FK를 만족시킵니다.
create extension if not exists pgcrypto;

create table if not exists public.listening_passages (
  id uuid primary key default gen_random_uuid()
);

-- listening_sessions 테이블
create table if not exists public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  passage_id uuid not null references public.listening_passages(id) on delete cascade,
  mode text not null check (mode in ('test','study')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  plays int not null default 0,
  consumed boolean not null default false
);

-- RLS
alter table public.listening_sessions enable row level security;

create policy "ls_select_own" on public.listening_sessions
  for select using (auth.uid() = user_id);
create policy "ls_insert_own" on public.listening_sessions
  for insert with check (auth.uid() = user_id);
create policy "ls_update_own" on public.listening_sessions
  for update using (auth.uid() = user_id);

-- 재생수 증가용 RPC
create or replace function public.inc_listening_plays(_id uuid)
returns void
language sql
security definer
as $$
  update public.listening_sessions
  set plays = plays + 1
  where id = _id and user_id = auth.uid();
$$;

grant execute on function public.inc_listening_plays(uuid) to authenticated;
