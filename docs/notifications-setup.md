# Calendar and live-stream push notifications

Calendar reminders are opt-in and tied to the device/browser subscription, not a user account. To enable background delivery in production:

1. Run [`supabase/notifications.sql`](../supabase/notifications.sql) in the Supabase project used by the app.
2. Add these server environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY` — keep this secret and server-only.
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` — generate a matching pair with `npx web-push generate-vapid-keys`.
   - `VAPID_SUBJECT` — a `mailto:` contact or site URL.
   - `CRON_SECRET` — a long random secret used to authorize the scheduled delivery route.
   - `YOUTUBE_API_KEY` — an API key with YouTube Data API v3 enabled, used to look for scheduled live streams on the configured channel. The YouTube Data API has a free daily quota; keep this key server-only and restrict it to the YouTube Data API in Google Cloud.
3. Configure `CRON_SECRET` in the hosting environment. On Vercel, the daily schedule in [`vercel.json`](../vercel.json) invokes the route at 08:00 UTC.
4. Deploy over HTTPS. Users must enable notifications in their browser or installed PWA and grant the browser permission.

The daily job checks the Diaspora calendar using each device's saved time zone and sends a notification for events happening today and tomorrow. It also checks the configured YouTube channel once daily for upcoming scheduled live streams and sends one alert per stream, with the stream link and thumbnail when supported by the platform.

Push notifications use the browser/operating system's native notification UI. The app supplies its icon, title, message, tag, optional image, and vibration/action hints, but cannot force a particular design or guarantee image/action support across devices. Notification sound is controlled by the operating system/browser; web push does not expose a portable way for a website to select or play a custom background-notification sound.

The chatbot on the home page uses the Gemini API for online questions about Torah, Judaism, Jewish traditions, Noahide learning, and the app. Add `GEMINI_API_KEY` as a server-only environment secret; never expose it through a `NEXT_PUBLIC_` variable or commit it. The API key is required for online answers, and Google may change its free-tier availability, quotas, or terms. The chatbot is instructed to decline unrelated questions and to distinguish disputed interpretations, but AI responses can still be mistaken and are not personal religious rulings. When the service is unavailable or the user is offline, a small local app guide remains available and invites the user online for broader answers.

Device push endpoints and subscription keys are stored in the `push_subscriptions` table. Processed scheduled live video IDs are stored in `youtube_live_notifications` to prevent repeated alerts. Both tables have row-level security enabled and are accessible only to the server's Supabase service role.
