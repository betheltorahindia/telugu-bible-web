import type { LangCode } from './lang'

type UI = {
  chapters: string
  parashiyot: string
  categories: string
  aliyah: string
  home: string
  search: string
  presenter: string
  language: string
  reading: string
  haftarah: string
  maftir: string
  divisions: { Torah: string; Neviim: string; Ketuvim: string }
}

const STRINGS: Record<LangCode, UI> = {
  en: {
    chapters: 'Chapters',
    parashiyot: 'Parashiyot',
    categories: 'Categories',
    aliyah: 'Aliyah',
    home: 'Home',
    search: 'Search',
    presenter: 'Presenter',
    language: 'Language',
    reading: 'Reading',
    haftarah: 'Haftarah',
    maftir: 'Maftir',
    divisions: { Torah: 'Torah', Neviim: 'Neviim', Ketuvim: 'Ketuvim' },
  },
  te: {
    chapters: 'అధ్యాయాలు',
    parashiyot: 'పరాషోత్',
    categories: 'వివిధ సందర్భాలు',
    aliyah: 'అలియా',
    home: 'Home',
    search: 'శోధన',
    presenter: 'Presenter',
    language: 'భాష',
    reading: 'వచనం',
    haftarah: 'హాఫ్తారా',
    maftir: 'మప్తీర్',
    divisions: { Torah: 'తోరా', Neviim: 'నెవీయీం', Ketuvim: 'కేతువీం' },
  },
  hi: {
    chapters: 'अध्याय',
    parashiyot: 'पार्शियोट',
    categories: 'श्रेणियाँ',
    aliyah: 'अलियाह',
    home: 'Home',
    search: 'खोज',
    presenter: 'Presenter',
    language: 'भाषा',
    reading: 'पाठ',
    haftarah: 'हफ्तारा',
    maftir: 'मफ़्तिर',
    divisions: { Torah: 'तोरा', Neviim: 'नवीईम', Ketuvim: 'केतुवीम' },
  },
  ta: {
    chapters: 'அத்தியாயங்கள்',
    parashiyot: 'பராஷியோத்',
    categories: 'வகைகள்',
    aliyah: 'அலியா',
    home: 'Home',
    search: 'தேடல்',
    presenter: 'Presenter',
    language: 'மொழி',
    reading: 'வாசிப்பு',
    haftarah: 'ஹப்தாரா',
    maftir: 'மாப்திர்',
    divisions: { Torah: 'தோரா', Neviim: 'நவீஈம்', Ketuvim: 'கேதுவிம்' },
  },
  he: {
    chapters: 'פרקים',
    parashiyot: 'פרשיות',
    categories: 'קטגוריות',
    aliyah: 'עלייה',
    home: 'בית',
    search: 'חיפוש',
    presenter: 'מציג',
    language: 'שפה',
    reading: 'קריאה',
    haftarah: 'הפטרה',
    maftir: 'מפטיר',
    divisions: { Torah: 'תורה', Neviim: 'נביאים', Ketuvim: 'כתובים' },
  },
}

export function uiStrings(lang: LangCode): UI {
  return STRINGS[lang] || STRINGS.en
}
