// app/book/[bnumber]/head.tsx
import type { Metadata } from 'next'
import { BOOK_NAMES } from '../../../lib/data/books'

// This "Head" file runs on the server and is used only for SEO/head tags.
// It won't affect your client UI logic in page.tsx.
export default function Head({ params }: { params: { bnumber: string } }) {
  const bnum = Number(params.bnumber)
  const teName = BOOK_NAMES[bnum] ?? `Book ${bnum}`

  const title = `తెలుగు తనాఖ్ – ${teName}`
  const description = `${teName} గ్రంథం – తెలుగు తనాఖ్ (Tanach | Telugu). అధ్యాయాల వారీగా చదవండి, శోధించండి, ఆన్‌లైన్/ఆఫ్‌లైన్ సపోర్ట్.`

  // NOTE: If you have a custom domain (e.g., https://tanach.example.com),
  // you can change canonical to an absolute URL. Relative is fine, too.
  const canonical = `/book/${bnum}`

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      <meta name="robots" content="index,follow" />

      {/* Open Graph / Social */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {/* If you have a share image in /public, uncomment & point to it */}
      {/* <meta property="og:image" content="/og-default.png" /> */}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {/* <meta name="twitter:image" content="/og-default.png" /> */}
    </>
  )
}
