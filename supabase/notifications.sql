create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.push_subscriptions
  add column if not exists timezone text not null default 'UTC';

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;

create table if not exists public.youtube_live_notifications (
  video_id text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.youtube_live_notifications enable row level security;
revoke all on public.youtube_live_notifications from anon, authenticated;
grant all on public.youtube_live_notifications to service_role;
