-- Slay the Monstarz - Supabase Database Schema
-- 이 SQL 스크립트를 Supabase SQL Editor에 복사하여 붙여넣고 실행하세요.

-- 1. run_saves 테이블 생성 (진행중인 게임 저장)
create table if not exists public.run_saves (
  user_id text not null primary key,
  state jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS(Row Level Security) 활성화
alter table public.run_saves enable row level security;

-- 익명 유저가 자신의 user_id로 자유롭게 CRUD 할 수 있도록 정책 설정
create policy "Allow anonymous select run_saves" on public.run_saves for select using (true);
create policy "Allow anonymous insert run_saves" on public.run_saves for insert with check (true);
create policy "Allow anonymous update run_saves" on public.run_saves for update using (true);
create policy "Allow anonymous delete run_saves" on public.run_saves for delete using (true);


-- 2. meta_saves 테이블 생성 (메타 진행도/승천 해금 저장)
create table if not exists public.meta_saves (
  user_id text not null primary key,
  state jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.meta_saves enable row level security;

-- 익명 유저 CRUD 정책 설정
create policy "Allow anonymous select meta_saves" on public.meta_saves for select using (true);
create policy "Allow anonymous insert meta_saves" on public.meta_saves for insert with check (true);
create policy "Allow anonymous update meta_saves" on public.meta_saves for update using (true);
create policy "Allow anonymous delete meta_saves" on public.meta_saves for delete using (true);
