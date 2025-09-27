# Verse Presenter Setup

## 1. Supabase tables and policies

1. Open the Supabase SQL editor for your project.
2. Paste the contents of `supabase/presenter.sql` and run it once. This creates:
   - `admin_users`, `premium_users`
   - `projects`, `project_items` with indexes
   - triggers for `updated_at` and quota enforcement
   - RLS policies that restrict access to owners (service role bypass only)

## 2. Seed admin and premium users

Run the following SQL statements (replace the emails with yours):

```sql
-- Add an admin (unlimited projects, full access in app UI)
insert into public.admin_users (email) values ('you@example.com')
  on conflict (email) do nothing;

-- Add a premium user (unlimited projects)
insert into public.premium_users (email) values ('premium@example.com')
  on conflict (email) do nothing;
```

You can rerun or delete rows later to change quotas.

## 3. Environment variables

Set the following in your `.env.local` (and hosting platform):

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

`SUPABASE_SERVICE_ROLE_KEY` is only used by Next.js API routes and never sent to the browser.

## 4. Local development

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Visit `/presenter` to sign in and create projects.
4. Share links use `/present/<slug>`; viewers can navigate with arrow keys or tap zones in the public presenter.

## 5. Production checklist

- Run `npm run build` (requires the Supabase env vars above).
- Deploy after confirming `/presenter` workflows and `/present/<slug>` navigation.
- Keep `supabase/presenter.sql` handy for future environments (staging, production).

