import { cookies } from 'next/headers'
import { DEFAULT_LANG, isLang, type LangCode } from './lang'

export type BibleJSON = { books: Array<{ bnumber: number; bname: string; chapters: Array<{ cnumber: number; verses?: any[] }> }> }

export async function getBibleServer(lang?: LangCode): Promise<BibleJSON> {
  const code: LangCode = lang || getLangFromCookie()
  switch (code) {
    case 'te': return (await import('../data/te.json')).default as any
    case 'en': return (await import('../data/en.json')).default as any
    case 'ta': return (await import('../data/ta.json')).default as any
    case 'hi': return (await import('../data/hi.json')).default as any
    case 'he': return (await import('../data/he.json')).default as any
    default:   return (await import('../data/te.json')).default as any
  }
}

export function getLangFromCookie(): LangCode {
  const c = cookies()
  const v = c.get('lang')?.value
  return isLang(v) ? v : DEFAULT_LANG
}

