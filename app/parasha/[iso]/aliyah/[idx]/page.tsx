// app/parasha/[iso]/aliyah/[idx]/page.tsx
import dynamic from 'next/dynamic'
import { getBibleServer, getLangFromCookie } from '../../../../../lib/bibleServer'
import { uiStrings } from '../../../../../lib/i18n'
import { getLeyningForDate } from '../../../../../lib/api/hebcal'
import { BOOK_NAMES_EN } from '../../../../../lib/data/books'
import ZoomStyle from '../../../../../components/ZoomStyle'

// Load the client toolbar safely (avoids server onChange errors)
const AliyahToolbar = dynamic(
  () => import('../../../../../components/AliyahToolbar'),
  { ssr: false }
)

type Ref = { bnum: number; c: number; v: number }
type Range = { start: Ref; end: Ref; label: string }
type Verse = { c: number; v: number; text: string }

// Map Hebcal English book -> bnumber
function enToBnum(en: string): number {
  const norm = (s: string | null | undefined) =>
    (s ?? '')
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
    '1 samuel': 8,
    '2 samuel': 9,
    '1 kings': 10,
    '2 kings': 11,
  }

  return rev[target] ?? fallback[target] ?? 0
}

function parseCV(cv?: string | null): { c: number; v: number } {
  if (!cv) return { c: 0, v: 0 }
  const [c, v] = cv.split(':').map(Number)
  return { c, v }
}

function toRange(enBook: string, b: string, e: string, label?: string): Range {
  const bnum = enToBnum(enBook)
  const bs = parseCV(b)
  const es = parseCV(e)
  return {
    start: { bnum, c: bs.c, v: bs.v },
    end: { bnum, c: es.c, v: es.v },
    label: label ?? `${enBook} ${b} - ${e}`,
  }
}

async function sliceVerses(r: Range, bible: any): Promise<Verse[]> {
  const book = (bible as any).books.find((x: any) => x.bnumber === r.start.bnum)
  if (!book) return []

  const out: Verse[] = []

  const startChapter = Math.max(r.start.c, 1)
  const requestedEndChapter = r.end.c || r.start.c
  const endChapter = Math.max(requestedEndChapter, startChapter)

  for (let c = startChapter; c <= endChapter; c++) {
    const chap = book.chapters.find((ch: any) => ch.cnumber === c)
    if (!chap) continue

    const chapterLast = chap.verses.at(-1)?.vnumber ?? Number.MAX_SAFE_INTEGER
    const vStart = c === startChapter ? Math.max(r.start.v || 1, 1) : 1
    const requestedEnd = c === endChapter && r.end.v ? r.end.v : chapterLast
    const vEnd = Math.min(requestedEnd || chapterLast, chapterLast)

    for (const v of chap.verses) {
      if (v.vnumber >= vStart && v.vnumber <= vEnd)
        out.push({ c, v: v.vnumber, text: v.text })
    }
  }

  return out
}

export default async function AliyahPage({
  params,
}: {
  params: { iso: string; idx: string }
}) {
  const bible = await getBibleServer()
  const lang = getLangFromCookie()
  const UI = uiStrings(lang)
  const iso = decodeURIComponent(params.iso)
  const idxStr = params.idx // "1".."7" or "H"
  const upperIdx = idxStr.toUpperCase()
  const data = await getLeyningForDate(iso)

  if (!data || !data.aliyot.length) {
    return <div className="card">No data for this date.</div>
  }

  const aliyot = data.aliyot
  const isHaft = upperIdx === 'H'
  const isMaftir = upperIdx === 'M'
  const idxNum = Number(upperIdx)

  const aliyahLabel = Number.isNaN(idxNum) ? idxStr : idxNum

  type Section = { range: Range; verses: Verse[] }

  const sections: Section[] = []

  if (isHaft) {
    const segments = (data.haftaraSegments && data.haftaraSegments.length)
      ? data.haftaraSegments
      : data.haftara
        ? [data.haftara]
        : []

    for (const seg of segments) {
      if (!seg) continue
      const range = toRange(seg.k, seg.b, seg.e, seg.label)
      if (!range.start.bnum) continue
      sections.push({ range, verses: await sliceVerses(range, bible) })
    }
  } else if (isMaftir && data.maftir) {
    const range = toRange(data.maftir.k, data.maftir.b, data.maftir.e, data.maftir.label)
    if (range.start.bnum) sections.push({ range, verses: await sliceVerses(range, bible) })
  } else if (!Number.isNaN(idxNum) && idxNum >= 1 && idxNum <= aliyot.length) {
    const a = aliyot[idxNum - 1]
    const range = toRange(a.k, a.b, a.e)
    if (range.start.bnum) sections.push({ range, verses: await sliceVerses(range, bible) })
  }

  if (!sections.length) return <div className="card">Invalid aliyah.</div>

  const baseTitle = isHaft ? UI.haftarah : isMaftir ? UI.maftir : `${UI.aliyah} ${aliyahLabel}`
  const rangeSummary = sections.map((s) => s.range.label).filter(Boolean).join(' + ')
  const title = rangeSummary ? `${baseTitle} - ${rangeSummary}` : baseTitle

  // order: 1..7 then M/H (if exists)
  const order: string[] = [
    ...aliyot.map((_, i) => String(i + 1)),
    ...(data.maftir ? ['M'] : []),
    ...(data.haftara ? ['H'] : []),
  ]
  const pos = order.indexOf(upperIdx)
  const prev = pos > 0 ? order[pos - 1] : null
  const next = pos < order.length - 1 ? order[pos + 1] : null

  const backHref = `/parasha/${data.shabbatDateISO}`

  const options = [
    ...aliyot.map((_, i) => ({ value: String(i + 1), label: `${UI.aliyah} ${i + 1}` })),
    ...(data.maftir ? [{ value: 'M', label: UI.maftir }] : []),
    ...(data.haftara ? [{ value: 'H', label: UI.haftarah }] : []),
  ]

  return (
    <div className="space-y-4">
      {/* apply zoom CSS var on client */}
      <ZoomStyle />
      {/* Client toolbar (no server onChange errors) */}
      <AliyahToolbar
        iso={data.shabbatDateISO}
        value={upperIdx}
        options={options}
        backHref={backHref}
        prev={prev}
        next={next}
      />

      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="space-y-4">
        {sections.map((section, sectionIdx) => {
          const multipleChapters = new Set(section.verses.map((v) => v.c)).size > 1
          const badgeLabel = (v: Verse) => (multipleChapters ? `${v.c}:${v.v}` : `${v.v}`)

          return (
            <div key={`${section.range.start.bnum}-${sectionIdx}`} className="space-y-2">
              {sections.length > 1 && (
                <div className="text-sm font-semibold opacity-80">
                  {section.range.label}
                </div>
              )}

              {section.verses.length ? (
                section.verses.map((v, verseIdx) => (
                  <div key={`${sectionIdx}-${verseIdx}`} className="card">
                    <div className={`flex items-start gap-3 ${lang === 'he' ? 'flex-row-reverse' : ''}`}>
                      <span className="badge">{badgeLabel(v)}</span>
                      <div className={`leading-relaxed ${lang === 'he' ? 'text-right' : ''}`} dir={lang === 'he' ? 'rtl' : undefined} style={{ fontSize: 'calc(1em + var(--chapter-zoom, 0px))' }}>{v.text}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-sm opacity-70">
                  Verses unavailable in local text for this segment.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

