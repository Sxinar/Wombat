create extension if not exists "pgcrypto";
create extension if not exists "pg_net";

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

create or replace function public.notify_comment_webhook()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text := current_setting('app.settings.comment_webhook_url', true);
begin
  if webhook_url is null or webhook_url = '' then
    return new;
  end if;

  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'event', 'comment.created',
      'id', new.id,
      'page_id', new.page_id,
      'name', new.name,
      'email', new.email,
      'comment', new.comment,
      'parent_id', new.parent_id,
      'is_approved', new.is_approved,
      'created_at', new.created_at
    )
  );

  return new;
end;
$$;

drop trigger if exists comments_notify_webhook on public.comments;
create trigger comments_notify_webhook
after insert on public.comments
for each row
execute function public.notify_comment_webhook();

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
