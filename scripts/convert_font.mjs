#!/usr/bin/env node
import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

// Use process.cwd() to locate repository root (works reliably on Windows)
const repoRoot = process.cwd()
const fontDir = join(repoRoot, 'public', 'fonts')
const ttf = join(fontDir, 'Dhurjati-Regular.ttf')
const woff2 = join(fontDir, 'Dhurjati-Regular.woff2')
const woff = join(fontDir, 'Dhurjati-Regular.woff')

if (!existsSync(ttf)) {
  console.error('TTF font not found at', ttf)
  process.exit(1)
}

try {
  console.log('Generating woff2...')
  execSync(`npx ttf2woff2 "${ttf}" "${woff2}"`, { stdio: 'inherit' })
} catch (e) {
  console.error('ttf2woff2 failed or not installed; try `npm i -D ttf2woff2 ttf2woff`')
}

try {
  console.log('Generating woff...')
  execSync(`npx ttf2woff "${ttf}" "${woff}"`, { stdio: 'inherit' })
} catch (e) {
  console.error('ttf2woff failed or not installed; try `npm i -D ttf2woff2 ttf2woff`')
}

console.log('Done. Check public/fonts for generated files.')
