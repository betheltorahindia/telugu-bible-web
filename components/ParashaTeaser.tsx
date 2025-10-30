// components/ParashaTeaser.tsx
import { Calendar } from 'lucide-react'
import { getWeeklyLeyning } from '../lib/api/hebcal'
import { use } from 'react'
import { getLangFromCookie } from '../lib/bibleServer'
import { LANG_LABELS } from '../lib/lang'
import { uiStrings } from '../lib/i18n'

export default async function ParashaTeaser() {
  const lang = getLangFromCookie()
  const locale = LANG_LABELS[lang]?.locale || 'en-US'
  const UI = uiStrings(lang)
  // Get all leyning items in the next 7 days (festivals + shabbat)
  const items = await getWeeklyLeyning()

  // If API is down or nothing in the next week, show nothing (quietly)
  if (!items || items.length === 0) return null

  return (
    <>
      {items.map((it, idx) => {
        const dateLabel = new Date(it.isoDate).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        })

        // Use our Tailwind classes defined in globals.css
        const variant = it.kind === 'festival' ? 'card-festival' : 'card-shabbat'
        const hasHaftarah = Boolean(it.haftara) || Boolean(it.haftaraSegments?.length)

        return (
          <section key={`${it.isoDate}-${idx}`} className={`card ${variant}`}>
            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 opacity-80 mt-1" />
              <div className="flex-1 space-y-1">
                <div className="text-sm opacity-70">
                  {dateLabel}
                  {it.hebDate ? ` - ${it.hebDate}` : ''}
                </div>

                <h3 className="text-lg font-semibold">
                  {it.titleEn ?? UI.reading}
                  {it.titleHe ? ` / ${it.titleHe}` : ''}
                </h3>

                <div className="mt-2 flex flex-wrap gap-2">
                  {it.aliyot.map((a) => (
                    <a
                      key={a.n}
                      href={`/parasha/${it.isoDate}/aliyah/${a.n}`}
                      className="btn btn-chip"
                      title={`${a.k} ${a.b}-${a.e}`}
                    >
                      {UI.aliyah} {a.n}
                    </a>
                  ))}

                  {it.maftir && (
                    <a
                      className="btn btn-chip"
                      href={`/parasha/${it.isoDate}/aliyah/M`}
                      title={it.maftir.label}
                    >
                      {UI.maftir}
                    </a>
                  )}
                  {hasHaftarah && (
                    <a
                      className="btn btn-chip"
                      href={`/parasha/${it.isoDate}/aliyah/H`}
                      title={
                        it.haftaraSegments && it.haftaraSegments.length > 1
                          ? it.haftaraSegments.map((seg) => seg.label).join(' + ')
                          : it.haftara?.label ?? UI.haftarah
                      }
                    >
                      {UI.haftarah}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
