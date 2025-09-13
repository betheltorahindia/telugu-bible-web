// app/robots.ts
import type { MetadataRoute } from 'next'

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
  'https://telugu-bible-web.vercel.app/' // ← set NEXT_PUBLIC_SITE_URL in Vercel!

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
