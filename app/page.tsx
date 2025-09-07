import Link from 'next/link'
import { HOME_SECTIONS, BOOK_NAMES } from '../lib/data/books'
import Footer from '../components/Footer' // remove this line if you didn't add Footer

export default function Home() {
  return (
    <div className="space-y-8 pb-12">
      {HOME_SECTIONS.map((sec) => (
        <section key={sec.key} id={sec.label}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">{sec.label}</h2>
          </div>
          <div className="card">
            {/* Responsive grid: 2 cols (mobile), 3 (sm), 4 (lg) */}
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

      {/* Footer strip on Home only */}
      <Footer />
    </div>
  )
}
