import '../styles/globals.css'
import Header from '../components/Header'
import { Noto_Sans_Telugu } from 'next/font/google'

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'తెలుగు తనాఖ్',
  description: 'Telugu Tanakh Bible',
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
