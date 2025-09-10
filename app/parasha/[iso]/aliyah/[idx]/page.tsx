// app/parasha/[iso]/aliyah/[idx]/page.tsx
import dynamic from 'next/dynamic'
import bible from '../../../../../data/bible.json'
import { getLeyningForDate } from '../../../../../lib/api/hebcal'
import { BOOK_NAMES_EN } from '../../../../../lib/data/books'

// Load the client toolbar safely (avoids server onChange errors)
const AliyahToolbar = dynamic(
  () => import('../../../../../components/AliyahToolbar'),
  { ssr: false }
)

type Ref = { bnum: number; c: number; v: number }
type Range = { start: Ref; end: Ref; label: string }

// Map Hebcal English book -> bnumber
function enToBnum(en: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(i{1,3}|iv|v|vi|vii|viii|ix|x|1|2|3)\b/g, (m) =>
        (
          {
            i: '1',
            ii: '2',
            iii: '3',
            iv: '4',
            v: '5',
            vi: '6',
            vii: '7',
            viii: '8',
            ix: '9',
            x: '10',
            '1': '1',
            '2': '2',
            '3': '3',
          } as any
        )[m] || m
      )
      .trim()

  const target = norm(en)
  const EN = (BOOK_NAMES_EN || {}) as Record<string, string>
  const rev: Record<string, number> = {}
  for (const [bnumStr, name] of Object.entries(EN)) {
    if (!name) continue
    rev[norm(name)] = Number(bnumStr)
  }

  const fallback: Record<string, number> = {
    genesis: 1,
    exodus: 2,
    leviticus: 3,
    numbers: 4,
    deuteronomy: 5,
    isaiah: 12,
    jeremiah: 13,
    ezekiel: 14,
    hosea: 15,
    joel: 16,
    amos: 17,
    obadiah: 18,
    jonah: 19,
    micah: 20,
    nahum: 21,
    habakkuk: 22,
    zephaniah: 23,
    haggai: 24,
    zechariah: 25,
    malachi: 26,
    joshua: 6,
    judges: 7,
    'i samuel': 8,
    'ii samuel': 9,
    'i kings': 10,
    'ii kings': 11,
  }

  return rev[target] ?? fallback[target] ?? 0
}

function parseCV(cv: string): { c: number; v: number } {
  const [c, v] = cv.split(':').map(Number)
  return { c, v }
}

function toRange(enBook: string, b: string, e: string): Range {
  const bnum = enToBnum(enBook)
  const bs = parseCV(b)
  const es = parseCV(e)
  return {
    start: { bnum, c: bs.c, v: bs.v },
    end: { bnum, c: es.c, v: es.v },
    label: `${enBook} ${b}–${e}`,
  }
}

function sliceVerses(r: Range) {
  const book = (bible as any).books.find((x: any) => x.bnumber === r.start.bnum)
  if (!book) return [] as { v: number; text: string }[]
  const out: { v: number; text: string }[] = []
  for (let c = r.start.c; c <= r.end.c; c++) {
    const chap = book.chapters.find((ch: any) => ch.cnumber === c)
    if (!chap) continue
    const vStart = c === r.start.c ? r.start.v : 1
    const vEnd =
      c === r.end.c
        ? r.end.v
        : (chap.verses.at(-1)?.vnumber ?? Number.MAX_SAFE_INTEGER)
    for (const v of chap.verses) {
      if (v.vnumber >= vStart && v.vnumber <= vEnd)
        out.push({ v: v.vnumber, text: v.text })
    }
  }
  return out
}

export default async function AliyahPage({
  params,
}: {
  params: { iso: string; idx: string }
}) {
  const iso = decodeURIComponent(params.iso)
  const idxStr = params.idx // "1".."7" or "H"
  const data = await getLeyningForDate(iso)

  if (!data || !data.aliyot.length) {
    return <div className="card">No data for this date.</div>
  }

  const aliyot = data.aliyot
  const isHaft = idxStr.toUpperCase() === 'H'
  const idx = isHaft ? -1 : Number(idxStr)

  let range: Range | null = null
  if (isHaft && data.haftara) {
    range = toRange(data.haftara.k, data.haftara.b, data.haftara.e)
  } else if (idx >= 1 && idx <= aliyot.length) {
    const a = aliyot[idx - 1]
    range = toRange(a.k, a.b, a.e)
  }
  if (!range || !range.start.bnum) return <div className="card">Invalid aliyah.</div>

  const title = isHaft
    ? `Haftarah — ${range.label}`
    : `అలియా ${idx} — ${range.label}`

  const verses = sliceVerses(range)

  // order: 1..7 then H (if exists)
  const order: string[] = [
    ...aliyot.map((_, i) => String(i + 1)),
    ...(data.haftara ? ['H'] : []),
  ]
  const pos = order.indexOf(idxStr.toUpperCase())
  const prev = pos > 0 ? order[pos - 1] : null
  const next = pos < order.length - 1 ? order[pos + 1] : null

  const backHref = `/parasha/${data.shabbatDateISO}`

  const options = [
    ...aliyot.map((_, i) => ({ value: String(i + 1), label: `Aliyah ${i + 1}` })),
    ...(data.haftara ? [{ value: 'H', label: 'Haftarah' }] : []),
  ]

  return (
    <div className="space-y-4">
      {/* Client toolbar (no server onChange errors) */}
      <AliyahToolbar
        iso={data.shabbatDateISO}
        value={idxStr.toUpperCase()}
        options={options}
        backHref={backHref}
        prev={prev}
        next={next}
      />

      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="space-y-2">
        {verses.map((v) => (
          <div key={v.v} className="card">
            <div className="flex items-start gap-3">
              <span className="badge">{v.v}</span>
              <div className="leading-relaxed">{v.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
