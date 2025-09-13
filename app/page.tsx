// app/page.tsx
import Link from 'next/link'
import { HOME_SECTIONS, BOOK_NAMES } from '../lib/data/books'
import Footer from '../components/footer'
import InstallFAB from '../components/InstallFAB'

// ✅ Weekly Parasha teaser
import ParashaTeaser from '../components/ParashaTeaser'

// ✅ Home page SEO metadata
export const metadata = {
  title: 'Home',
  description:
    'Telugu Tanakh / పరిశుద్ధ గ్రంథం – Read the Holy Bible (Tanach) in Telugu: Torah (ఆదికాండము–ద్వితీయోపదేశకాండము), ప్రవక్తలు, కీర్తనలు, వారాంత Parasha & Haftarah పఠనాలు.',
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
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <div className="space-y-8 pb-12">
      {/* Weekly Parasha / Haftarah teaser */}
      <ParashaTeaser />

      {/* --- Sections of books --- */}
      {HOME_SECTIONS.map((sec) => (
        <section key={sec.key} id={sec.label}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">{sec.label}</h2>
          </div>
          <div className="card">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {sec.order.map((bnum) => (
                <Link key={bnum} href={`/book/${bnum}`} className="btn btn-book">
                  {BOOK_NAMES[bnum] ?? `Book ${bnum}`}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      <Footer />
      <InstallFAB />
    </div>
  )
}
