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
}: {
  iso: string
  value: string              // current value: "1".."7" or "H"
  options: Option[]          // dropdown options
  backHref: string           // link back to /parasha/[iso]
  prev?: string | null       // "1".."7" or "H" | null
  next?: string | null
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
          <Link href={backHref} className="btn btn-chip" title="Back to Parasha">
            ⟵
          </Link>

          {/* Aliyah / Haftarah picker */}
          <select
            className="px-2 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
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
            className={`btn btn-chip ${prev ? '' : 'opacity-50 pointer-events-none'}`}
            title="Previous"
          >
            ‹
          </Link>
          <Link
            href={next ? `/parasha/${iso}/aliyah/${next}` : '#'}
            className={`btn btn-chip ${next ? '' : 'opacity-50 pointer-events-none'}`}
            title="Next"
          >
            ›
          </Link>
        </div>
      </div>
    </div>
  )
}
