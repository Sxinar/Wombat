-- Enable the uuid-ossp extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  is_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to handle new user signup and create a profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

grant execute on function public.check_abuse_limit(text, integer, integer) to anon, authenticated;
grant execute on function public.set_admin_status(text, boolean) to authenticated;

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Projects Table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 3. Threads Table
create table public.threads (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  page_id text not null,
  page_title text,
  page_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, page_id)
);


-- 4. Comments Table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  author_name text not null,
  author_email text,
  author_url text,
  status text not null check (status in ('pending', 'approved', 'spam')),
  is_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.comment_reactions (
  id uuid default uuid_generate_v4() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  emoji text not null,
  reactor_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(comment_id, emoji, reactor_key)
);

create table public.abuse_limits (
  scope text primary key,
  count integer not null default 0,
  window_started_at timestamp with time zone not null default timezone('utc'::text, now())
);

create or replace function public.check_abuse_limit(
  p_scope text,
  p_max_count integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  window_started timestamp with time zone;
begin
  insert into public.abuse_limits(scope, count, window_started_at)
  values (p_scope, 0, timezone('utc'::text, now()))
  on conflict (scope) do nothing;

  select count, window_started_at
    into current_count, window_started
  from public.abuse_limits
  where scope = p_scope
  for update;

  if window_started < timezone('utc'::text, now()) - make_interval(secs => p_window_seconds) then
    update public.abuse_limits
      set count = 1,
          window_started_at = timezone('utc'::text, now())
    where scope = p_scope;
    return true;
  end if;

  if current_count >= p_max_count then
    return false;
  end if;

  update public.abuse_limits
    set count = count + 1
  where scope = p_scope;

  return true;
end;
$$;

create or replace function public.set_admin_status(
  target_email text,
  make_admin boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  select coalesce(is_admin, false)
    into caller_is_admin
  from public.profiles
  where id = auth.uid();

  if caller_is_admin is not true then
    raise exception 'not authorized';
  end if;

  update public.profiles
    set is_admin = make_admin
  where lower(email) = lower(target_email);
end;
$$;

-- Index for querying comments efficiently
create index comments_thread_id_idx on public.comments(thread_id);
create index comments_parent_id_idx on public.comments(parent_id);
create index comment_reactions_comment_id_idx on public.comment_reactions(comment_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.abuse_limits enable row level security;


-- RLS Policies

-- Profiles: Users can only see and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Projects: Only owners can manage their projects
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Threads: Owners can manage, anyone can view (if they have the project_id/page_id)
create policy "Anyone can insert threads (for automatic creation)" on public.threads
  for insert with check (true);

create policy "Anyone can read threads" on public.threads
  for select using (true);

create policy "Owners can update threads" on public.threads
  for update using (
    exists (
      select 1 from public.projects where projects.id = threads.project_id and projects.user_id = auth.uid()
    )
  );

create policy "Owners can delete threads" on public.threads
  for delete using (
    exists (
      select 1 from public.projects where projects.id = threads.project_id and projects.user_id = auth.uid()
    )
  );

-- Comments: Anons can insert and read approved, Owners can do everything
create policy "Anons can read approved comments" on public.comments
  for select using (status = 'approved');

create policy "Owners can read all comments on their projects" on public.comments
  for select using (
    exists (
      select 1 from public.threads
      join public.projects on projects.id = threads.project_id
      where threads.id = comments.thread_id and projects.user_id = auth.uid()
    )
  );

create policy "Anyone can insert comments" on public.comments
  for insert with check (true);

create policy "Owners can update comments on their projects" on public.comments
  for update using (
    exists (
      select 1 from public.threads
      join public.projects on projects.id = threads.project_id
      where threads.id = comments.thread_id and projects.user_id = auth.uid()
    )
  );

create policy "Owners can delete comments on their projects" on public.comments
  for delete using (
    exists (
      select 1 from public.threads
      join public.projects on projects.id = threads.project_id
      where threads.id = comments.thread_id and projects.user_id = auth.uid()
    )
  );

-- Reactions: everyone can read and add reactions, project owners can manage via comment ownership
create policy "Anyone can read reactions" on public.comment_reactions
  for select using (true);

create policy "Anyone can insert reactions" on public.comment_reactions
  for insert with check (true);

create policy "Owners can delete reactions on their projects" on public.comment_reactions
  for delete using (
    exists (
      select 1 from public.comments
      join public.threads on threads.id = comments.thread_id
      join public.projects on projects.id = threads.project_id
      where comments.id = comment_reactions.comment_id and projects.user_id = auth.uid()
    )
  );

-- abuse_limits is only managed through security definer functions
