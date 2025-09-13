// app/parasha/[iso]/aliyah/[idx]/head.tsx
export default function Head({
  params,
}: {
  params: { iso: string; idx: string };
}) {
  const iso = decodeURIComponent(params.iso);
  const idx = params.idx?.toUpperCase() === 'H' ? 'Haftarah' : `Aliyah ${params.idx}`;
  const title = `${idx} – ${iso} | తెలుగు తనాఖ్`;
  const description =
    `${iso} తేదీకి ${idx} పఠనం. అలియోత్/హాఫ్తారాను తెలుగులో స్పష్టంగా చదవండి.`;

  const canonical = `/parasha/${iso}/aliyah/${params.idx}`;

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
  );
}
