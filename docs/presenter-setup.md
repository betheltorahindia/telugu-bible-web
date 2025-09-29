# Verse Presenter Guide

The presenter no longer connects to Supabase or stores projects. Everything lives in the browser while the page is open.

## What it can do
- Pick any Book → Chapter → Verse combination.
- Build a local set list (playlist) of verses, reorder them, remove them, or clear the list.
- Adjust the background gradient, gradient angle, font size, and line-height.
- Step through slides with Prev/Next or use the arrow keys while in fullscreen.
- Enter fullscreen; the non-essential UI hides automatically and you can exit with Escape or the on-screen button.

## Tips
- The note field is optional and can be used for cues or reminders. Notes appear under the verse during presentation.
- "New slide" clears the current selection so you can queue another verse quickly. The set list is not saved after a refresh.
- Everything works without signing in. Authentication in the header only affects other signed-in features on the site.

## Environment variables
Only the client-side Supabase keys are required if you keep email sign-in elsewhere in the app:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

You can remove `SUPABASE_SERVICE_ROLE_KEY`; it is no longer used.

