// app/parasha/[iso]/head.tsx
export default function Head({ params }: { params: { iso: string } }) {
  const iso = decodeURIComponent(params.iso);
  const title = `ఈ వారపు పరాషా – ${iso} | తెలుగు తనాఖ్`;
  const description =
    `ఈ వారపు శబ్ధ్/పండుగ టోరా పఠనం (Parasha & Haftarah) – ${iso} తేదీకి. అలియోత్‌ను తెలుగులో సులభంగా చదవండి.`;

  const canonical = `/parasha/${iso}`;

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
