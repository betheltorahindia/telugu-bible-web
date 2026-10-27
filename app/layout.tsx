import '../styles/globals.css'
import Header from '../components/Header'
import LaunchAnimation from '../components/LaunchAnimation'
import { SupabaseProvider } from '../components/providers/SupabaseProvider'
import { QueryProvider } from '../components/providers/QueryProvider'
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
    default: 'BETHEL TORAH INDIA',
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
}

export const viewport = {
  themeColor: '#ffffff',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialSession: Session | null = null
  const lang: LangCode = getLangFromCookie()

  return (
    <html lang={lang} data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const root = document.documentElement;
              const saved = localStorage.getItem('theme-v2');
              if (saved === 'light' || saved === 'dark') {
                root.setAttribute('data-theme', saved);
                root.classList.toggle('dark', saved === 'dark');
              }
            })();`,
          }}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-icon-180x180.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
        <link
          rel="manifest"
          href="/site.webmanifest"
        />

        {/* Windows tiles (optional) */}
        <meta name="google-site-verification" content="Qch3vbS6pWUtPJ887_ypRFKjFxfUas7mDoSkUy6A-4Q" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta
          name="msapplication-TileImage"
          content="/android-icon-192x192.png"
        />
      </head>
      <body>
        <LaunchAnimation />
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
