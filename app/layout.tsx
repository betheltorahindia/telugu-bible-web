import '../styles/globals.css'
import Header from '../components/Header'
import { Noto_Sans_Telugu } from 'next/font/google'

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

// app/layout.tsx (add/replace this metadata export)
export const metadata = {
  metadataBase: new URL('https://telugu-bible-web.vercel.app/'), // ← change to your real domain once deployed
  title: {
    default: 'తెలుగు తనాఖ్ (Telugu Tanakh) – Bethel Torah India',
    template: '%s – Bethel Torah India',
  },
  description:
    'Read the Holy Bible / Tanakh in Telugu. Torah, Prophets, Writings, Psalms, weekly Parasha & Haftarah readings. పరిశుద్ధ గ్రంథం – Bethel Torah India.',
  keywords: [
    'Telugu Bible',
    'Telugu Tanakh',
    'పరిశుద్ధ గ్రంథం',
    'Holy Bible',
    'Tanach',
    'Torah',
    'Parasha',
    'Haftarah',
    'Bethel Torah India',
    'Jewish Bible Telugu',
  ],
  applicationName: 'Bethel Torah India',
  openGraph: {
    type: 'website',
    locale: 'te_IN',
    url: 'https://<YOUR_DOMAIN_HERE>/',
    siteName: 'Bethel Torah India',
    title: 'తెలుగు తనాఖ్ (Telugu Tanakh) – Bethel Torah India',
    description:
      'Read the Holy Bible / Tanakh in Telugu. Torah, Prophets, Writings, Psalms, weekly Parasha & Haftarah readings.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Telugu Tanakh' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'తెలుగు తనాఖ్ (Telugu Tanakh)',
    description:
      'Read the Holy Bible / Tanakh in Telugu. Torah, Prophets, Writings, Psalms, weekly Parasha & Haftarah readings.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  themeColor: '#ffffff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="te" className={notoTelugu.className}>
      <head>
        {/* Apple icons (optional but fine to keep) */}
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />

        {/* Android / Favicons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        {/* Generic shortcut icon (optional) */}
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Web App Manifest (critical for install) */}
        <link rel="manifest" href="/manifest.json" />

        {/* Windows tiles (optional) */}
        <meta name="google-site-verification" content="Qch3vbS6pWUtPJ887_ypRFKjFxfUas7mDoSkUy6A-4Q" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />

        {/* Theme color — match manifest (#000000) for consistent UI on Android */}
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <Header />
        {/* keep content below the fixed header */}
        <main className="container mt-20 pb-6">{children}</main>
      </body>
    </html>
  )
}
