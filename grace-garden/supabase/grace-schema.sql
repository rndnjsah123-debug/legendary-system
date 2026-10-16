-- 은혜의 정원 (2026 특별새벽부흥회) — Supabase SQL Editor에서 그대로 실행하세요.
-- 퀴즈 앱과 같은 Supabase 프로젝트에서 실행해도 됩니다. (테이블 이름이 grace_ 로 시작해서 겹치지 않습니다)

create extension if not exists pgcrypto;

create table if not exists grace_posts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists grace_posts_created_at_idx on grace_posts (created_at desc);

-- 도배 방지(IP별 분당 횟수)용 임시 기록 테이블
create table if not exists grace_limits (
  key text primary key,
  count int not null,
  expires bigint not null
);

-- 보안: RLS를 켜두고 정책은 만들지 않습니다.
-- => 공개(anon) 키로는 접근할 수 없고, 서버(Secret Key)를 통해서만 접근합니다.
alter table grace_posts enable row level security;
alter table grace_limits enable row level security;

-- 호출 횟수를 1 올리고 현재 횟수를 돌려주는 함수 (만료된 기록은 함께 정리)
create or replace function grace_hit(p_key text, p_expires bigint, p_now bigint)
returns int
language plpgsql
as $$
declare
  c int;
begin
  delete from grace_limits where expires < p_now;
  insert into grace_limits (key, count, expires) values (p_key, 1, p_expires)
    on conflict (key) do update set count = grace_limits.count + 1
    returning count into c;
  return c;
end;
$$;

revoke all on function grace_hit(text, bigint, bigint) from public, anon, authenticated;
grant execute on function grace_hit(text, bigint, bigint) to service_role;

-- ==== 댓글 (v2) ====
create table if not exists grace_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references grace_posts(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists grace_comments_post_idx on grace_comments (post_id, created_at);
alter table grace_comments enable row level security;
