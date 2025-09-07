import fs from 'node:fs/promises'
import { parseStringPromise } from 'xml2js'
import path from 'node:path'

// Usage:
//   npm i xml2js
//   node scripts/convert_xml_to_json.mjs path/to/source.xml data/bible.json

const [,, src, out] = process.argv
if (!src || !out) {
  console.error('Usage: node scripts/convert_xml_to_json.mjs <source.xml> <out.json>')
  process.exit(1)
}

const xml = await fs.readFile(src, 'utf8')
// Parse XML -> JS object
const parsed = await parseStringPromise(xml, { explicitArray: false, mergeAttrs: true })

// Expect structure: XMLBIBLE > BIBLEBOOK[] > CHAPTER[] > VERS[]
const rawBooks = Array.isArray(parsed.XMLBIBLE.BIBLEBOOK)
  ? parsed.XMLBIBLE.BIBLEBOOK
  : [parsed.XMLBIBLE.BIBLEBOOK]

const books = rawBooks.map(b => {
  const chaptersRaw = Array.isArray(b.CHAPTER) ? b.CHAPTER : [b.CHAPTER]
  const chapters = chaptersRaw.map(ch => {
    const versesRaw = Array.isArray(ch.VERS) ? ch.VERS : [ch.VERS]
    const verses = versesRaw.map(v => ({
      bnumber: Number(b.bnumber),
      cnumber: Number(ch.cnumber),
      vnumber: Number(v.vnumber),
      text: (typeof v === 'string' ? v : v._) ?? v
    }))
    return { cnumber: Number(ch.cnumber), verses }
  })
  return { bnumber: Number(b.bnumber), bname: b.bname, chapters }
})

const bible = { books }
await fs.mkdir(path.dirname(out), { recursive: true })
await fs.writeFile(out, JSON.stringify(bible, null, 2), 'utf8')
console.log('Wrote', out, 'books:', books.length)
