import '../styles/globals.css'
import Header from '../components/Header'
import { SupabaseProvider } from '../components/providers/SupabaseProvider'
import { QueryProvider } from '../components/providers/QueryProvider'
import { Noto_Sans_Telugu, Noto_Sans_Tamil, Tiro_Devanagari_Hindi, Frank_Ruhl_Libre } from 'next/font/google'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { LanguageProvider } from '../components/providers/LanguageProvider'
import { ZoomProvider } from '../components/providers/ZoomProvider'
import { ParallelProvider } from '../components/providers/ParallelProvider'
import { getLangFromCookie } from '../lib/bibleServer'
import type { LangCode } from '../lib/lang'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://betheltelugubible.org/'),
  title: {
    default: 'Telugu Tanakh - Bethel Torah India',
    template: '%s - Bethel Torah India',
  },
  description:
    'Read the Holy Bible / Tanakh in Telugu: Torah, Prophets, Writings, Psalms, plus weekly Parasha and Haftarah readings.',
  keywords: [
    'Telugu Bible',
    'Telugu Tanakh',
    'Tanakh',
    'Torah',
    'Parasha',
    'Haftarah',
    'Bethel Torah India',
  ],
  applicationName: 'Bethel Torah India',
  openGraph: {
    type: 'website',
    locale: 'te_IN',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://betheltelugubible.org/',
    siteName: 'Bethel Torah India',
    title: 'Telugu Tanakh',
    description:
      'Read the Holy Bible / Tanakh in Telugu: Torah, Prophets, Writings, Psalms, plus weekly Parasha and Haftarah readings.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Telugu Tanakh' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Telugu Tanakh',
    description:
      'Read the Holy Bible / Tanakh in Telugu: Torah, Prophets, Writings, Psalms, plus weekly Parasha and Haftarah readings.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport = {
  themeColor: '#000000',
}

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

const tiroHindi = Tiro_Devanagari_Hindi({
  subsets: ['devanagari'],
  weight: ['400'],
  display: 'swap',
})

const frankHebrew = Frank_Ruhl_Libre({
  subsets: ['hebrew'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialSession: Session | null = null
  const lang: LangCode = getLangFromCookie()

  // Fonts: Telugu + English keep current (Telugu font class).
  // Hindi/Tamil use Noto Sans; Hebrew uses Frank Ruhl Libre globally.
  const fontClass =
    lang === 'hi' ? tiroHindi.className :
    lang === 'ta' ? notoTamil.className :
    lang === 'he' ? frankHebrew.className :
    notoTelugu.className

  return (
    <html lang={lang} className={fontClass}>
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
      </head>
      <body>
        <SupabaseProvider initialSession={initialSession}>
          <QueryProvider>
            <LanguageProvider initialLang={lang}>
              <ZoomProvider>
                <ParallelProvider>
                  <Header />
                  {/* keep content below the fixed header */}
                  <main className="container mt-20 pb-6">{children}</main>
                </ParallelProvider>
              </ZoomProvider>
            </LanguageProvider>
          </QueryProvider>
        </SupabaseProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
