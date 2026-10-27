import sevenLaws from './seven-noahide-laws.json'
import ninetyLaws from './90-noahide-laws.json'
import orchotChaim from './orchot-chaim.json'
import iggeretHaRamban from './iggeret-haramban.json'
import type { LangCode } from '../../lang'

export type StudyLanguageText = Record<LangCode, string>

export type StudyEntry = {
  number: number
} & StudyLanguageText

export type SevenLaw = {
  number: number
  positive: StudyLanguageText
  negative: StudyLanguageText
}

export type StudyChapter = {
  number: number
  items: StudyEntry[]
}

type StudyBookBase = {
  slug: string
  title: string
  subtitle: string
  subtitleLanguage?: 'te' | 'he'
  description: string
  source?: { label: string; href: string }
}

export type StudyBook =
  | (StudyBookBase & {
      kind: 'seven-laws'
      titleByLanguage: StudyLanguageText
      laws: SevenLaw[]
    })
  | (StudyBookBase & {
      kind: 'list'
      entries: StudyEntry[]
    })
  | (StudyBookBase & {
      kind: 'chapters'
      chapters: StudyChapter[]
    })

export const studyBooks: StudyBook[] = [
  {
    slug: 'seven-noahide-laws',
    kind: 'seven-laws',
    title: 'Seven Noahide Laws',
    subtitle: sevenLaws.title.te,
    titleByLanguage: sevenLaws.title,
    description:
      'Seven universal principles for living with reverence for God, respect for human life and property, and care for society and living creatures.',
    laws: sevenLaws.laws,
  },
  {
    slug: '90-noahide-laws',
    kind: 'list',
    title: '90 Noahide Laws',
    subtitle: 'నోవాహీయ తొంబై ఆజ్ఞలు',
    description:
      'A detailed collection of beliefs, responsibilities, and practical guidance for Noahides, presented in English and Telugu.',
    entries: ninetyLaws,
  },
  {
    slug: 'orchot-chaim',
    kind: 'chapters',
    title: 'Orchot Chaim',
    subtitle: 'జీవన మార్గము',
    description:
      "Orchot Chaim L'HaRosh (or Orchos Chaim) is a famous Jewish ethical work written as a letter of guidance by Rabbeinu Asher ben Yechiel (known as the Rosh, 1250–1327) to his sons.",
    source: {
      label: 'Research source: Orchot Chaim is a set of instructions for living an ethical life.',
      href: "https://www.sefaria.org/Orchot_Chaim_L'HaRosh",
    },
    chapters: orchotChaim,
  },
  {
    slug: 'iggeret-haramban',
    kind: 'list',
    title: 'Igeret HaRamban',
    subtitle: 'రాంబాన్ యొక్క లేఖ',
    subtitleLanguage: 'he',
    description:
      'An ethical letter attributed to Ramban (Rabbi Moses ben Nachman), offering guidance on calm speech, humility, reverence, and self-examination.',
    source: {
      label: 'Read Igeret HaRamban on Sefaria',
      href: 'https://www.sefaria.org/Iggeret_HaRamban',
    },
    entries: iggeretHaRamban,
  },
]

export function getStudyBook(slug: string) {
  return studyBooks.find((book) => book.slug === slug)
}

export function hasStudyTranslation(book: StudyBook, language: LangCode) {
  if (language === 'en' || language === 'te') return true
  const content =
    book.kind === 'seven-laws'
      ? book.laws
      : book.kind === 'chapters'
        ? book.chapters
        : book.entries

  const containsText = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false
    return Object.entries(value).some(([key, child]) =>
      key === language && typeof child === 'string' && child.trim().length > 0
        ? true
        : containsText(child),
    )
  }

  return containsText(content)
}
