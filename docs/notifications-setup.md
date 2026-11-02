# Calendar and live-stream push notifications

Calendar reminders are opt-in and tied to the device/browser subscription, not a user account. To enable background delivery in production:

1. Run [`supabase/notifications.sql`](../supabase/notifications.sql) in the Supabase project used by the app. It creates the subscription preferences and delivery-deduplication columns/table used by calendar notifications.
2. Add these server environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY` — keep this secret and server-only.
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` — generate a matching pair with `npx web-push generate-vapid-keys`.
   - `VAPID_SUBJECT` — a `mailto:` contact or site URL.
   - `CRON_SECRET` — a long random secret used to authorize the daily delivery route.
   - `YOUTUBE_API_KEY` — an API key with YouTube Data API v3 enabled, used to look for scheduled live streams on the configured channel. The YouTube Data API has a free daily quota; keep this key server-only and restrict it to the YouTube Data API in Google Cloud.
3. Configure `CRON_SECRET` in the hosting environment. Vercel sends it as a bearer token to the daily route. The calendar/live-event job runs at 08:00 UTC.
4. Deploy over HTTPS. Users must enable notifications in their browser or installed PWA and grant the browser permission.

The daily job checks the Diaspora calendar using each device's saved time zone and sends a notification for events happening today and tomorrow. It also checks the configured YouTube channel once daily for upcoming scheduled live streams and sends one alert per stream, with the stream link and thumbnail when supported by the platform.

Vercel Hobby allows one Cron invocation per day. For that reason, the app currently offers only calendar and live-stream notifications, checked once daily. Time-specific prayer and Psalm reminders are not enabled. They could be added later with an external scheduler that calls a protected endpoint on a more frequent schedule, or with a hosting plan that supports frequent Cron jobs.

Push notifications use the browser/operating system's native notification UI. The app supplies its icon, title, message, tag, optional image, and vibration/action hints, but cannot force a particular design or guarantee image/action support across devices. Notification sound is controlled by the operating system/browser; web push does not expose a portable way for a website to select or play a custom background-notification sound.

The chatbot on the home page uses the Gemini API for online questions about Torah, Judaism, Jewish traditions, Noahide learning, and the app. In Vercel, open **Project Settings → Environment Variables**, add `GEMINI_API_KEY` for the Preview environment, and redeploy the Preview branch. Keep it server-only: never use a `NEXT_PUBLIC_` prefix or commit the key. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. After deployment, open `/api/chat`; `onlineAvailable` should be `true`. If chat still fails, inspect the Vercel function logs for the Gemini HTTP status and provider message, then check that the key belongs to a project with the Generative Language API enabled, that the selected model is available to that project, and that quota/billing is not blocking requests. Google may change model access, quotas, or terms. The chatbot is instructed to decline unrelated questions and distinguish disputed interpretations, but AI responses can still be mistaken and are not personal religious rulings. When unavailable or offline, a small local app guide remains available.

Device push endpoints and subscription keys are stored in the `push_subscriptions` table. Processed scheduled live video IDs are stored in `youtube_live_notifications` to prevent repeated alerts. Both tables have row-level security enabled and are accessible only to the server's Supabase service role.
