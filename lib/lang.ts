export type LangCode = 'te' | 'en' | 'ta' | 'hi' | 'he'

export const LANG_LABELS: Record<LangCode, { glyph: string; name: string; locale: string }> = {
  te: { glyph: 'తె', name: 'Telugu', locale: 'te-IN' },
  hi: { glyph: 'हि', name: 'Hindi', locale: 'hi-IN' },
  ta: { glyph: 'த',  name: 'Tamil',  locale: 'ta-IN' },
  en: { glyph: 'A',  name: 'English', locale: 'en-US' },
  he: { glyph: 'ע',  name: 'Hebrew', locale: 'he-IL' },
}

export const DEFAULT_LANG: LangCode = 'te'

export function isLang(x: any): x is LangCode {
  return x === 'te' || x === 'en' || x === 'ta' || x === 'hi' || x === 'he'
}

