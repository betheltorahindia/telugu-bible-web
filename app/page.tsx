// app/page.tsx
import Link from 'next/link'
import { HOME_SECTIONS, BOOK_NAMES, getLocalizedBookName } from '../lib/data/books'
import Footer from '../components/footer'
import InstallFAB from '../components/InstallFAB'
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { getBibleServer } from '../lib/bibleServer'
import SocialEntryCard from '../components/SocialEntryCard'

// ✅ Weekly Parasha teaser
import ParashaTeaser from '../components/ParashaTeaser'
import { getLangFromCookie } from '../lib/bibleServer'
import { uiStrings } from '../lib/i18n'

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
    'Bethel',
    'Bethel India',
    'Bible Telugu',
    'Beth-El Torah India',
    'Beth-El',
    'Bethel films',
    'Bethel India films',
    'Jewish Bible Telugu',
    'Bible',
    'Old Testament',
    'Telugu Bible',
    'Telugu Jewish Bible',
    'Telugu Old Testament',
    'Telugu Scriptures',
    'Telugu Torah',
    'Telugu Neviim',
    'Telugu Ketuvim',
    'Telugu Parasha',
    'Telugu Haftarah',
    'Telugu Bible App',
    'బైబిల్',
    'హోలీ బైబిల్',
    'బైబిల్ స్టడీ',
    'బైబిల్ తెలుగు',
    'బేతేల్',
    'బేతేల్ తోరా ఇండియా',
    'ఆదికాండము',
    'నిర్గమకాండము',
    'లేవీయకాండము',
    'సంఖ్యాకాండము',
    'ద్వితీయోపదేశకాండము',
    'యెహోషువ',
    'న్యాయాధిపతులు',
    'రూతు',
    'సమూయేలు',
    'రాజులు',
    'దినవృత్తాంతములు',
    'ఎజ్రా',
    'నెహెమ్యా',
    'ఏస్తేరు',
    'యోబు',
    'కీర్తనలు',
    'సామెతలు',
    'ప్రసంగి',
    'పరమగీతము',
    'యెషయా',
    'యిర్మీయా',
    'విలాపవాక్యములు',
    'యెహెజ్కేలు',
    'దానియేలు',
    'హోషేయ',
    'యోవేలు',
    'ఆమోసు',
    'ఓబద్యా',
    'యోనా',
    'మీకా',
    'నాహూము',
    'హబక్కూకు',
    'జెఫన్యా',
    'హగ్గయి',
    'జెకర్యా',
    'మలాకీ',
  ],
  alternates: { canonical: '/' },
}

export default async function Home() {
  const bible = await getBibleServer()
  const lang = getLangFromCookie()
  const UI = uiStrings(lang)
  return (
    <div className="space-y-8 pb-12">
      {/* Weekly Parasha / Haftarah teaser */}
      <SocialEntryCard />
      <ParashaTeaser />

      {/* --- Sections of books --- */}
      {HOME_SECTIONS.map((sec) => (
        <section key={sec.key} id={sec.label}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">{UI.divisions[sec.key as keyof typeof UI.divisions]}</h2>
          </div>
          <div className="card">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {sec.order.map((bnum) => {
                const bname = getLocalizedBookName(bnum, lang, (bible as any)?.books?.find((b:any)=>b.bnumber===bnum)?.bname)
                return (
                  <Link key={bnum} href={`/book/${bnum}`} className="btn btn-book">
                    {bname ?? BOOK_NAMES[bnum] ?? `Book ${bnum}`}
                  </Link>
                )
              })}
          </div>
        </div>
      </section>
      ))}

      <Footer />
      <InstallFAB />
    </div>
  )
}
