// scripts/generate_warm_urls.mjs
import { promises as fs } from 'node:fs'
import path from 'node:path'

async function main() {
  const root = process.cwd()
  const biblePath = path.join(root, 'data', 'bible.json')
  const outPath = path.join(root, 'public', 'warm-urls.json')

  const raw = await fs.readFile(biblePath, 'utf8')
  const data = JSON.parse(raw)

  const urls = new Set()
  // Core routes
  urls.add('/')
  urls.add('/search') // remove if you don't want it

  // Books + chapters
  for (const b of data.books ?? []) {
    urls.add(`/book/${b.bnumber}`)
    for (const ch of b.chapters ?? []) {
      urls.add(`/book/${b.bnumber}/chapter/${ch.cnumber}`)
    }
  }

  // Write to public/warm-urls.json
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify([...urls], null, 2), 'utf8')

  console.log(`Wrote ${urls.size} URLs to public/warm-urls.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
