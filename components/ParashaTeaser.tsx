// components/ParashaTeaser.tsx
import { Calendar, AlertCircle } from 'lucide-react'
import { getUpcomingShabbatLeyning } from '../lib/api/hebcal'

export default async function ParashaTeaser() {
  const data = await getUpcomingShabbatLeyning()

  // If API is down, show a tiny diagnostic card only in dev
  if (!data || data.aliyot.length === 0) {
    if (process.env.NODE_ENV !== 'production' && data) {
      return (
        <section className="card">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
            <div className="text-sm">
              <div className="font-medium">Hebcal unavailable</div>
              <div className="opacity-70">status: {data._status} • {data._error}</div>
              <div className="opacity-70 break-all">{data._url}</div>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  const dateLabel = new Date(data.shabbatDateISO).toLocaleDateString('te-IN', {
    year: 'numeric', month: 'short', day: 'numeric', weekday: 'short',
  })

  return (
    <section className="card">
      <div className="flex items-start gap-3">
        <Calendar className="w-6 h-6 opacity-80 mt-1" />
        <div className="flex-1 space-y-1">
          <div className="text-sm opacity-70">
            {dateLabel}{data.shabbatHebrew ? ` • ${data.shabbatHebrew}` : ''}
          </div>
          <h3 className="text-lg font-semibold">
            {data.parashaEn}{data.parashaHe ? ` / ${data.parashaHe}` : ''}
          </h3>

          {/* Aliyot & Haftarah chips → point to the new reader routes */}
          <div className="mt-2 flex flex-wrap gap-2">
            {data.aliyot.map(a => {
              const href = `/parasha/${data.shabbatDateISO}/aliyah/${a.n}`
              const title = `${a.k} ${a.b}-${a.e}`
              return (
                <a key={a.n} href={href} className="btn btn-chip" title={title}>
                  Aliyah {a.n}
                </a>
              )
            })}
            {data.haftara && (
              <a
                className="btn btn-chip"
                href={`/parasha/${data.shabbatDateISO}/haftarah`}
                title={data.haftara.label}
              >
                Haftarah
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
