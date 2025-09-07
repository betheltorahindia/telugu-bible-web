import fs from 'node:fs/promises'

// Usage:
//   node scripts/build_verses.mjs data/bible.json data/verses.json
const [,, biblePath, outPath] = process.argv
if (!biblePath || !outPath) {
  console.error('Usage: node scripts/build_verses.mjs <bible.json> <out verses.json>')
  process.exit(1)
}

const bible = JSON.parse(await fs.readFile(biblePath, 'utf8'))
const verses = []
for (const b of bible.books) {
  for (const ch of b.chapters) {
    for (const v of ch.verses) {
      verses.push({
        id: `b${b.bnumber}-c${ch.cnumber}-v${v.vnumber}`,
        bnumber: b.bnumber,
        cnumber: ch.cnumber,
        vnumber: v.vnumber,
        bname: b.bname,
        text: v.text,
        textLower: String(v.text ?? '').toLowerCase()
      })
    }
  }
}

await fs.writeFile(outPath, JSON.stringify(verses, null, 2), 'utf8')
console.log('Wrote', outPath, 'with', verses.length, 'verses')
