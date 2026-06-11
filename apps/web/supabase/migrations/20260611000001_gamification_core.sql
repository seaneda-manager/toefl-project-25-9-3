-- ─────────────────────────────────────────────────────────────
-- Gamification core: points, levels, streaks, daily tasks
-- ─────────────────────────────────────────────────────────────

-- ── 1. 포인트 규칙 테이블 ──────────────────────────────────────
create table if not exists point_rules (
  id              text primary key,
  label           text not null,
  category        text not null,
  base_points     integer not null default 0,
  first_try_bonus integer not null default 0,
  description     text,
  is_active       boolean not null default true,
  updated_at      timestamptz not null default now()
);

insert into point_rules (id, label, category, base_points, first_try_bonus) values
  ('vocab_prescreen',        '단어 사전확인',      'vocab',        1,  0),
  ('vocab_spelling',         '단어 스펠링',        'vocab',        3,  2),
  ('vocab_speed',            '단어 스피드 드릴',   'vocab',        5,  3),
  ('vocab_exam',             '단어 시험 완료',     'vocab',       15,  5),
  ('reading_correct',        '리딩 문항 정답',     'reading',      2,  1),
  ('reading_session',        '리딩 세션 완료',     'reading',     20,  0),
  ('listening_correct',      '리스닝 문항 정답',   'listening',    2,  1),
  ('listening_session',      '리스닝 세션 완료',   'listening',   20,  0),
  ('grammar_drill_correct',  '문법 드릴 정답',     'grammar',      3,  2),
  ('grammar_unit',           '문법 유닛 완료',     'grammar',     30,  0),
  ('naesin_stage',           '내신 드릴 스테이지', 'naesin',      10,  0),
  ('homework_submit',        '숙제 제출',          'homework',    15,  0),
  ('homework_correction',    '오답 교정',          'homework',     5,  3),
  ('writing_submit',         '라이팅 제출',        'writing',     20,  0),
  ('speaking_submit',        '스피킹 제출',        'speaking',    20,  0),
  ('daily_task_complete',    '데일리 태스크 완료', 'daily_task',  50,  0)
on conflict (id) do nothing;

-- ── 2. 학생 게임화 상태 ────────────────────────────────────────
create table if not exists student_gamification (
  student_id         uuid primary key references auth.users(id) on delete cascade,
  total_points       integer not null default 0,
  level              integer not null default 1,
  current_streak     integer not null default 0,
  longest_streak     integer not null default 0,
  last_activity_date date,
  updated_at         timestamptz not null default now()
);

-- ── 3. 포인트 적립 내역 ────────────────────────────────────────
create table if not exists student_point_ledger (
  id           bigserial primary key,
  student_id   uuid not null references auth.users(id) on delete cascade,
  rule_id      text not null references point_rules(id),
  points       integer not null,
  bonus_points integer not null default 0,
  source_ref   text,
  metadata     jsonb,
  earned_at    timestamptz not null default now()
);

create index if not exists idx_ledger_student on student_point_ledger(student_id);
create index if not exists idx_ledger_time    on student_point_ledger(earned_at desc);

-- ── 4. 데일리 태스크 (text 컬럼, ENUM 없음) ────────────────────
create table if not exists daily_tasks (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references auth.users(id) on delete cascade,
  task_date     date not null default current_date,
  task_type     text not null check (task_type in (
                  'current_events_q','email_writing','listen_repeat',
                  'writing','random_interview','mock_lecturing'
                )),
  prompt        text not null,
  context       jsonb,
  completed_at  timestamptz,
  response      text,
  ai_feedback   text,
  points_earned integer not null default 0,
  unique (student_id, task_date)
);

create index if not exists idx_daily_tasks_student on daily_tasks(student_id, task_date desc);

-- ── 5. Perk 카탈로그 ──────────────────────────────────────────
create table if not exists perk_catalog (
  id          uuid primary key default gen_random_uuid(),
  perk_type   text not null check (perk_type in ('avatar_item','theme','physical')),
  name        text not null,
  description text,
  point_cost  integer not null,
  image_url   text,
  metadata    jsonb,
  stock       integer,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── 6. Perk 교환 내역 ─────────────────────────────────────────
create table if not exists perk_redemptions (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references auth.users(id) on delete cascade,
  perk_id      uuid not null references perk_catalog(id),
  points_spent integer not null,
  status       text not null default 'pending'
                 check (status in ('pending','approved','fulfilled','rejected')),
  admin_note   text,
  requested_at timestamptz not null default now(),
  resolved_at  timestamptz
);

-- ── 7. 아바타 ─────────────────────────────────────────────────
create table if not exists student_avatars (
  student_id      uuid primary key references auth.users(id) on delete cascade,
  evolution_stage integer not null default 1,
  equipped_items  jsonb not null default '{}',
  active_theme_id uuid references perk_catalog(id),
  updated_at      timestamptz not null default now()
);

-- ── 8. RLS ────────────────────────────────────────────────────
alter table student_gamification  enable row level security;
alter table student_point_ledger  enable row level security;
alter table daily_tasks           enable row level security;
alter table perk_catalog          enable row level security;
alter table perk_redemptions      enable row level security;
alter table student_avatars       enable row level security;

do $$ begin
  create policy "student_own_gamification" on student_gamification
    for all using ((select auth.uid()) = student_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "student_own_ledger" on student_point_ledger
    for select using ((select auth.uid()) = student_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "student_own_daily_task" on daily_tasks
    for all using ((select auth.uid()) = student_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "perk_catalog_read" on perk_catalog
    for select using (is_active = true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "student_own_redemptions" on perk_redemptions
    for all using ((select auth.uid()) = student_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "student_own_avatar" on student_avatars
    for all using ((select auth.uid()) = student_id);
exception when duplicate_object then null;
end $$;

-- ── 9. 레벨 계산 함수 ────────────────────────────────────────
create or replace function calc_level(pts integer) returns integer
language sql immutable as $$
  select case
    when pts <    100 then 1
    when pts <    300 then 2
    when pts <    600 then 3
    when pts <   1000 then 4
    when pts <   2000 then 5
    when pts <   4000 then 6
    when pts <   8000 then 7
    when pts <  15000 then 8
    when pts <  30000 then 9
    else 10
  end;
$$;

-- ── 10. 포인트 적립 함수 ─────────────────────────────────────
create or replace function award_points(
  p_student_id uuid,
  p_rule_id    text,
  p_bonus      integer default 0,
  p_source_ref text    default null,
  p_metadata   jsonb   default null
) returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_base         integer;
  v_streak       integer;
  v_streak_bonus integer;
  v_total        integer;
begin
  select base_points into v_base
  from point_rules
  where id = p_rule_id and is_active = true;

  if v_base is null then return 0; end if;

  select current_streak into v_streak
  from student_gamification
  where student_gamification.student_id = p_student_id;

  v_streak       := coalesce(v_streak, 0);
  v_streak_bonus := (v_base * least(v_streak, 5) * 10) / 100;
  v_total        := v_base + p_bonus + v_streak_bonus;

  insert into student_point_ledger
    (student_id, rule_id, points, bonus_points, source_ref, metadata)
  values
    (p_student_id, p_rule_id, v_base + v_streak_bonus, p_bonus, p_source_ref, p_metadata);

  insert into student_gamification
    (student_id, total_points, level, current_streak, longest_streak, last_activity_date)
  values
    (p_student_id, v_total, calc_level(v_total), 1, 1, current_date)
  on conflict on constraint student_gamification_pkey do update set
    total_points       = student_gamification.total_points + v_total,
    level              = calc_level(student_gamification.total_points + v_total),
    current_streak     = case
                           when student_gamification.last_activity_date = current_date - 1
                             then student_gamification.current_streak + 1
                           when student_gamification.last_activity_date = current_date
                             then student_gamification.current_streak
                           else 1
                         end,
    longest_streak     = greatest(
                           student_gamification.longest_streak,
                           case
                             when student_gamification.last_activity_date = current_date - 1
                               then student_gamification.current_streak + 1
                             else 1
                           end
                         ),
    last_activity_date = current_date,
    updated_at         = now();

  return v_total;
end;
$$;
