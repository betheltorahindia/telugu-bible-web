// app/parasha/[iso]/page.tsx
import Link from 'next/link'
import { getLeyningForDate } from '../../../lib/api/hebcal'      // -> relative import
import { BOOK_NAMES } from '../../../lib/data/books'              // -> relative import

export default async function ParashaWeekPage({ params }: { params: { iso: string } }) {
  const iso = decodeURIComponent(params.iso)
  const data = await getLeyningForDate(iso)

  // If API failed, show a small notice (quietly)
  if (!data || (data._status && data._status !== 200)) {
    return (
      <div className="card">
        <div className="font-medium mb-1">Hebcal unavailable</div>
        <div className="text-sm opacity-70">Try again later.</div>
      </div>
    )
  }

  const title =
    data.parashaEn
      ? `${data.parashaEn}${data.parashaHe ? ` / ${data.parashaHe}` : ''}`
      : 'Parasha'

  const dateLabel = new Date(data.shabbatDateISO).toLocaleDateString('te-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="opacity-70">
        {dateLabel}
        {data.shabbatHebrew ? ` - ${data.shabbatHebrew}` : ''}
      </div>

      <div className="card">
        <div className="font-medium mb-2">Aliyot</div>

        {/* Chips -> go to our new reader routes */}
        <div className="flex flex-wrap gap-2">
          {data.aliyot.map((_, idx) => (
            <Link
              key={idx}
              href={`/parasha/${data.shabbatDateISO}/aliyah/${idx + 1}`}
              className="btn btn-chip"
            >
              Aliyah {idx + 1}
            </Link>
          ))}

          {data.maftir && (
            <Link
              href={`/parasha/${data.shabbatDateISO}/aliyah/M`}
              className="btn btn-chip"
            >
              Maftir
            </Link>
          )}

          {data.haftara && data.haftara.k && (
            <Link
              href={`/parasha/${data.shabbatDateISO}/aliyah/H`}
              className="btn btn-chip"
            >
              Haftarah
            </Link>
          )}
        </div>

        {/* Tiny summary line of ranges */}
        <div className="text-xs opacity-70 mt-2">
          {data.aliyot.map((a, i) => {
            const label = `${a.k} ${a.b}-${a.e}`
            return <span key={i}>{i ? ' - ' : ''}{label}</span>
          })}
          {data.maftir && <> - {data.maftir.label}</>}
          {data.haftaraSegments && data.haftaraSegments.length > 1 && (
            <>
              {' - '}
              {data.haftaraSegments.map((seg, idx) => (
                <span key={`${seg.k}-${idx}`}>
                  {idx ? ' + ' : ''}
                  {seg.label}
                </span>
              ))}
            </>
          )}
          {data.haftara && (!data.haftaraSegments || data.haftaraSegments.length <= 1) && (
            <> - {data.haftara.label}</>
          )}
        </div>
      </div>
    </div>
  )
}
