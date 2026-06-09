create extension if not exists "pgcrypto";

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  page_id text not null,
  name text not null,
  email text not null,
  comment text not null,
  is_approved boolean not null default false,
  parent_id uuid null references public.comments (id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

alter table public.comments enable row level security;

create policy "Anon can read approved comments"
on public.comments for select
to anon
using (is_approved = true);

create policy "Authenticated can read all comments"
on public.comments for select
to authenticated
using (true);

create policy "Anon can insert only unapproved comments"
on public.comments for insert
to anon
with check (is_approved = false);

create policy "Authenticated can insert comments"
on public.comments for insert
to authenticated
with check (true);

create policy "Authenticated can update comments"
on public.comments for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete comments"
on public.comments for delete
to authenticated
using (true);
