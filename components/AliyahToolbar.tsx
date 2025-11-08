'use client'

import Link from 'next/link'

type Option = { value: string; label: string }

export default function AliyahToolbar({
  iso,
  value,
  options,
  backHref,
  prev,
  next,
  showTradToggle,
  trad,
  tradAshHref,
  tradSefHref,
}: {
  iso: string
  value: string              // current value: "1".."7" or "M"/"H"
  options: Option[]          // dropdown options
  backHref: string           // link back to /parasha/[iso]
  prev?: string | null       // "1".."7" or "M"/"H" | null
  next?: string | null
  showTradToggle?: boolean   // show Ash|Sef toggle (only on Haftarah)
  trad?: 'ash' | 'sef'       // current tradition
  tradAshHref?: string       // href to switch to ash
  tradSefHref?: string       // href to switch to sef
}) {
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // simple client-side navigation
    location.href = `/parasha/${iso}/aliyah/${e.target.value}`
  }

  return (
    <div className="sticky top-[64px] z-30">
      <div className="container">
        <div className="inline-flex gap-2">
          {/* Back (icon-only as requested) */}
          <Link href={backHref} className="btn-solid rounded-xl px-3 py-2" title="Back to Parasha">
            ⟵
          </Link>

          {/* Aliyah / Haftarah picker */}
          <select
            className="btn-solid rounded-xl px-3 py-2"
            value={value}
            onChange={onChange}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Prev / Next */}
          <Link
            href={prev ? `/parasha/${iso}/aliyah/${prev}` : '#'}
            className={`btn-solid rounded-xl px-3 py-2 ${prev ? '' : 'opacity-50 pointer-events-none'}`}
            title="Previous"
          >
            ‹
          </Link>
          <Link
            href={next ? `/parasha/${iso}/aliyah/${next}` : '#'}
            className={`btn-solid rounded-xl px-3 py-2 ${next ? '' : 'opacity-50 pointer-events-none'}`}
            title="Next"
          >
            ›
          </Link>

          {/* Ash | Sef toggle (match chapters-page segmented style; fixed labels) */}
          {showTradToggle && (
            <div className="flex items-center gap-2 overflow-x-auto flex-nowrap -mx-1 px-1">
              <div className="btn shrink-0">
                <a
                  href={tradAshHref || '#'}
                  className={trad === 'ash' ? 'font-semibold' : ''}
                  aria-pressed={trad === 'ash'}
                >
                  Ash
                </a>
                <span className="mx-1">|</span>
                <a
                  href={tradSefHref || '#'}
                  className={trad === 'sef' ? 'font-semibold' : ''}
                  aria-pressed={trad === 'sef'}
                >
                  Sef
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
