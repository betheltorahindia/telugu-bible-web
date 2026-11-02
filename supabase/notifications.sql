create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.push_subscriptions
  add column if not exists timezone text not null default 'UTC';

alter table public.push_subscriptions
  add column if not exists preferences jsonb not null default '{"calendar":true}'::jsonb;

alter table public.push_subscriptions
  alter column preferences set default '{"calendar":true}'::jsonb;

update public.push_subscriptions
set preferences = jsonb_build_object(
  'calendar',
  coalesce(preferences -> 'calendar', 'true'::jsonb)
);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;

create table if not exists public.notification_deliveries (
  delivery_key text primary key,
  delivered_at timestamptz not null default timezone('utc', now())
);

alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from anon, authenticated;
grant all on public.notification_deliveries to service_role;

create table if not exists public.youtube_live_notifications (
  video_id text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.youtube_live_notifications enable row level security;
revoke all on public.youtube_live_notifications from anon, authenticated;
grant all on public.youtube_live_notifications to service_role;
