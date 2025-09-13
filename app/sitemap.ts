// app/sitemap.ts
import type { MetadataRoute } from 'next'
import bible from '../data/bible.json' assert { type: 'json' }

// Public site URL (no trailing slash). Set this in Vercel → Settings → Environment Variables.
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
  'https://telugu-bible-web.vercel.app/' // fallback (please set the env var!)

function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function nextSaturday(from = new Date()) {
  const d = new Date(from)
  const delta = (6 - d.getDay() + 7) % 7 // days until Saturday
  d.setDate(d.getDate() + delta)
  d.setHours(12, 0, 0, 0) // avoid DST weirdness
  return d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Core routes
  const now = new Date()
  entries.push(
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE}/search`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  )

  // Books + Chapters from your bundled JSON
  const books: any[] = (bible as any).books ?? []
  for (const b of books) {
    const bnum = b.bnumber
    // Book page
    entries.push({
      url: `${SITE}/book/${bnum}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
    // Each chapter page
    for (const ch of b.chapters ?? []) {
      entries.push({
        url: `${SITE}/book/${bnum}/chapter/${ch.cnumber}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  // Parasha: next 52 Shabbat dates (week page + aliyot 1..7 + Haftarah “H”)
  let shabbat = nextSaturday()
  for (let i = 0; i < 52; i++) {
    const iso = toISO(shabbat)
    entries.push({
      url: `${SITE}/parasha/${iso}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
    for (let n = 1; n <= 7; n++) {
      entries.push({
        url: `${SITE}/parasha/${iso}/aliyah/${n}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.55,
      })
    }
    entries.push({
      url: `${SITE}/parasha/${iso}/aliyah/H`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.55,
    })

    // move to next week
    const next = new Date(shabbat)
    next.setDate(next.getDate() + 7)
    shabbat = next
  }

  return entries
}
