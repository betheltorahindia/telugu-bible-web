# Calendar, prayer, Psalm, and custom push notifications

Calendar reminders are opt-in and tied to the device/browser subscription, not a user account. To enable background delivery in production:

1. Run [`supabase/notifications.sql`](../supabase/notifications.sql) in the Supabase project used by the app. It creates the subscription preferences and delivery-deduplication columns/table used by calendar notifications.
2. Add these server environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY` — keep this secret and server-only.
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` — generate a matching pair with `npx web-push generate-vapid-keys`.
   - `VAPID_SUBJECT` — a `mailto:` contact or site URL.
   - `CRON_SECRET` — a long random secret used to authorize both notification delivery routes.
   - `YOUTUBE_API_KEY` — an API key with YouTube Data API v3 enabled, used to look for scheduled live streams on the configured channel. The YouTube Data API has a free daily quota; keep this key server-only and restrict it to the YouTube Data API in Google Cloud.
3. Configure `CRON_SECRET` in the Vercel environment used by the deployment. Vercel invokes the calendar/live-event route daily at 08:00 UTC.
4. Deploy over HTTPS. Users must enable notifications in their browser or installed PWA and grant the browser permission.
5. In [cron-job.org](https://cron-job.org/), create an enabled job for `https://YOUR-DEPLOYMENT/api/notifications/scheduled`, use **GET**, set the schedule to every 5 minutes, and add this request header: `Authorization: Bearer YOUR_CRON_SECRET`. Store the same secret in Vercel as `CRON_SECRET`; do not put it in the URL or in browser code. Use cron-job.org's test-run feature and confirm a `200` response with the delivery counts before relying on the schedule.

The daily job checks the Diaspora calendar using each device's saved time zone and sends a “Tomorrow” notification for events on the following local date. It also checks the configured YouTube channel once daily for upcoming scheduled live streams and sends one alert per stream.

The external scheduled route checks each subscribed device's local time for prayer reminders at 08:00, 14:00, 18:00, and 22:00. Psalm invitations are assigned three repeatable, varied times per device per local day. Delivery keys prevent duplicate notifications when the scheduler retries a call. Keep cron-job.org running every 5 minutes so a reminder has a short delivery window; the actual arrival time still depends on the external scheduler, Vercel, the push provider, and the user's device.

Custom one-time announcements are configured in [`lib/notifications/custom-notifications.ts`](../lib/notifications/custom-notifications.ts). Each entry has an ID, `enabled` flag, title, body, destination URL, and ISO-8601 `sendAt` timestamp. Edit or duplicate entries, set `enabled: true`, and redeploy. The two included examples are disabled so placeholder announcements will not be sent accidentally. Use an app-relative path (such as `/calendar`) or an HTTPS URL, and include a timezone offset in `sendAt`.

The notification permission UI lets each device opt in or out of calendar, prayer, Psalm, and custom notifications. Prayer notifications include **Open** and **Already done** actions. Push-notification buttons, icon rendering, and styling are controlled by the operating system/browser; some platforms, including iOS in some contexts, may not show action buttons or identical layouts. The app supplies its icon, text, tag, and supported actions but cannot force OS notification styling.

Vercel Hobby still supports the once-daily `vercel.json` job. The separate 5-minute scheduler is external; its requests consume Vercel Function usage and the third-party scheduler's free-tier limits apply. Keep `CRON_SECRET` private and rotate it in both services if it is exposed.

Push notifications use the browser/operating system's native notification UI. The app supplies its icon, title, message, tag, optional image, and vibration/action hints, but cannot force a particular design or guarantee image/action support across devices. Notification sound is controlled by the operating system/browser; web push does not expose a portable way for a website to select or play a custom background-notification sound.

The chatbot on the home page uses the Gemini API for online questions about Torah, Judaism, Jewish traditions, Noahide learning, and the app. In Vercel, open **Project Settings → Environment Variables**, add `GEMINI_API_KEY` for the Preview environment, and redeploy the Preview branch. Keep it server-only: never use a `NEXT_PUBLIC_` prefix or commit the key. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`; on HTTP 503 the API automatically tries `GEMINI_FALLBACK_MODEL`, which defaults to `gemini-3.6-flash`. After deployment, open `/api/chat`; `onlineAvailable` should be `true`. If chat still fails, inspect the Vercel function logs for the Gemini HTTP status and provider message, then check that the key belongs to a project with the Generative Language API enabled, that the selected models are available to that project, and that quota/billing is not blocking requests. Google may change model access, quotas, or terms. The chatbot is instructed to decline unrelated questions and distinguish disputed interpretations, but AI responses can still be mistaken and are not personal religious rulings. When unavailable or offline, a small local app guide remains available.

Device push endpoints and subscription keys are stored in the `push_subscriptions` table. Processed scheduled live video IDs are stored in `youtube_live_notifications` to prevent repeated alerts. Both tables have row-level security enabled and are accessible only to the server's Supabase service role.
