// app/book/[bnumber]/chapter/[cnumber]/head.tsx
import { BOOK_NAMES } from '../../../../../lib/data/books'

export default function Head({
  params,
}: {
  params: { bnumber: string; cnumber: string }
}) {
  const bnum = Number(params.bnumber)
  const cnum = Number(params.cnumber)

  const teName = BOOK_NAMES[bnum] ?? `Book ${bnum}`
  const title = `తెలుగు తనాఖ్ – ${teName} ${cnum} అధ్యాయం`
  const description = `${teName} ${cnum} అధ్యాయం – తెలుగు తనాఖ్ (Tanach | Telugu). వచనాలు స్పష్టంగా, మొబైల్-ఫ్రెండ్లీగా చదవండి.`

  // relative canonical is fine; change to absolute if you have a custom domain
  const canonical = `/book/${bnum}/chapter/${cnum}`

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      <meta name="robots" content="index,follow" />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {/* <meta property="og:image" content="/og-default.png" /> */}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {/* <meta name="twitter:image" content="/og-default.png" /> */}
    </>
  )
}
