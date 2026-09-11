-- 2026년 하반기 교리학교 퀴즈·출석 시스템 DB 스키마
-- Supabase SQL Editor에서 그대로 실행하세요.

create extension if not exists pgcrypto;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists quizzes (
  quiz_date date primary key,
  session int not null check (session between 1 and 8),
  title text not null default '오늘의 퀴즈',
  questions jsonb not null default '[]'::jsonb,
  is_open boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_date date not null references quizzes(quiz_date) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  score int not null default 0,
  attended boolean not null default false,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz default now(),
  unique (quiz_date, student_id)
);

-- 보안: RLS를 켜두고 정책은 만들지 않습니다.
-- => anon(공개) 키로는 어떤 테이블도 직접 조회/수정할 수 없고,
--    서버(Service Role Key)를 통해서만 접근 가능합니다.
--    학생/관리자 화면은 모두 서버의 API 라우트를 거쳐서만 DB에 접근합니다.
alter table students enable row level security;
alter table quizzes enable row level security;
alter table submissions enable row level security;
