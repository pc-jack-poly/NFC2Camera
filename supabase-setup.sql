-- Run this once in your Supabase project's SQL Editor.

create table if not exists public.page_stats (
  page_key text primary key,
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.page_stats enable row level security;

-- Visitors never access the table directly. They can only execute the two
-- narrowly scoped functions below.
revoke all on table public.page_stats from anon, authenticated;

create or replace function public.increment_page_view(p_page_key text)
returns table (views bigint, likes bigint)
language sql
security definer
set search_path = public
as $$
  insert into public.page_stats (page_key, views)
  values (left(p_page_key, 500), 1)
  on conflict (page_key) do update
    set views = page_stats.views + 1,
        updated_at = now()
  returning page_stats.views, page_stats.likes;
$$;

create or replace function public.increment_page_like(p_page_key text)
returns table (views bigint, likes bigint)
language sql
security definer
set search_path = public
as $$
  insert into public.page_stats (page_key, likes)
  values (left(p_page_key, 500), 1)
  on conflict (page_key) do update
    set likes = page_stats.likes + 1,
        updated_at = now()
  returning page_stats.views, page_stats.likes;
$$;

revoke all on function public.increment_page_view(text) from public;
revoke all on function public.increment_page_like(text) from public;
grant execute on function public.increment_page_view(text) to anon, authenticated;
grant execute on function public.increment_page_like(text) to anon, authenticated;
