-- Create a view for listing listening sets visible to the current user
create or replace view public.v_user_listening_sets
with (security_invoker = on) as
select
  ls.id,
  ls.slug,          -- 있으면 사용, 없으면 이 줄 삭제
  ls.title,
  ls.level,         -- 없으면 이 줄 삭제
  ls.num_tracks,    -- 없으면 이 줄 삭제
  ls.created_at,
  ls.updated_at
from public.listening_sets as ls;

grant select on public.v_user_listening_sets to anon, authenticated;
