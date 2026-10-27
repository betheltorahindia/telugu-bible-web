import afternoon from './afternoon.json'
import evening from './evening.json'
import morning from './morning.json'
import type { LangCode } from '../../lang'

export type PrayerLanguageText = Record<LangCode, string>

export type PrayerParagraph = {
  text: PrayerLanguageText
  transliteration: PrayerLanguageText
}

export type PrayerSection = {
  slug: string
  title: PrayerLanguageText
  transliteration: PrayerLanguageText
  paragraphs: PrayerParagraph[]
}

export type Prayer = {
  schemaVersion: number
  slug: string
  title: PrayerLanguageText
  transliteration: PrayerLanguageText
  description: PrayerLanguageText
  sections: PrayerSection[]
}

export const prayers: Prayer[] = [morning, afternoon, evening]

export function getPrayer(slug: string) {
  return prayers.find((prayer) => prayer.slug === slug)
}

export function hasPrayerTranslation(
  prayer: Prayer,
  language: LangCode,
  sectionSlug?: string,
) {
  const sections = sectionSlug
    ? prayer.sections.filter((section) => section.slug === sectionSlug)
    : prayer.sections
  return sections.some((section) =>
    section.paragraphs.some((paragraph) => paragraph.text[language].trim().length > 0),
  )
}

export function hasPrayerTransliteration(
  prayer: Prayer,
  language: LangCode,
  sectionSlug?: string,
) {
  const sections = sectionSlug
    ? prayer.sections.filter((section) => section.slug === sectionSlug)
    : prayer.sections
  return sections.some((section) =>
    section.paragraphs.some((paragraph) => paragraph.transliteration[language].trim().length > 0),
  )
}
