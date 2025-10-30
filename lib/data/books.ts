// ONE place to control book names + orders everywhere

export type DivisionKey = "Torah" | "Neviim" | "Ketuvim";

/**
 * TELUGU NAMES — keyed by your actual XML bnumber (1..39).
 * I filled all 39 so nothing falls back to “Book N”.
 */
export const BOOK_NAMES: Record<number, string> = {
  1: "ఆదికాండము",
  2: "నిర్గమకాండము",
  3: "లేవీయకాండము",
  4: "సంఖ్యాకాండము",
  5: "ద్వితీయోపదేశకాండము",
  6: "యెహోషువ",
  7: "న్యాయాధిపతులు",
  8: "రూతు",
  9: "1 సమూయేలు",
  10: "2 సమూయేలు",
  11: "1 రాజులు",
  12: "2 రాజులు",
  13: "1 దినవృత్తాంతములు",
  14: "2 దినవృత్తాంతములు",
  15: "ఎజ్రా",
  16: "నెహెమ్యా",
  17: "ఏస్తేరు",
  18: "యోబు",
  19: "కీర్తనలు",
  20: "సామెతలు",
  21: "ప్రసంగి",
  22: "పరమగీతము",
  23: "యెషయా",
  24: "యిర్మీయా",
  25: "విలాపవాక్యములు",
  26: "యెహెజ్కేలు",
  27: "దానియేలు",
  28: "హోషేయ",
  29: "యోవేలు",
  30: "ఆమోసు",
  31: "ఓబద్యా",
  32: "యోనా",
  33: "మీకా",
  34: "నాహూము",
  35: "హబక్కూకు",
  36: "జెఫన్యా",
  37: "హగ్గయి",
  38: "జెకర్యా",
  39: "మలాకీ",
};

/**
 * (OPTIONAL) ENGLISH names — only used in header dropdown if present.
 * I included all 39 so your “English – Telugu” label works for every book.
 */
export const BOOK_NAMES_EN: Record<number, string> = {
  1: "Genesis",
  2: "Exodus",
  3: "Leviticus",
  4: "Numbers",
  5: "Deuteronomy",
  6: "Joshua",
  7: "Judges",
  8: "Ruth",
  9: "1 Samuel",
  10: "2 Samuel",
  11: "1 Kings",
  12: "2 Kings",
  13: "1 Chronicles",
  14: "2 Chronicles",
  15: "Ezra",
  16: "Nehemiah",
  17: "Esther",
  18: "Job",
  19: "Psalms",
  20: "Proverbs",
  21: "Ecclesiastes",
  22: "Song of Songs",
  23: "Isaiah",
  24: "Jeremiah",
  25: "Lamentations",
  26: "Ezekiel",
  27: "Daniel",
  28: "Hosea",
  29: "Joel",
  30: "Amos",
  31: "Obadiah",
  32: "Jonah",
  33: "Micah",
  34: "Nahum",
  35: "Habakkuk",
  36: "Zephaniah",
  37: "Haggai",
  38: "Zechariah",
  39: "Malachi",
};

// Hindi names (standard OT book names)
export const BOOK_NAMES_HI: Record<number, string> = {
  1: "उत्पत्ति",
  2: "निर्गमन",
  3: "लैव्यव्यवस्था",
  4: "गिनती",
  5: "व्यवस्थाविवरण",
  6: "यहोशू",
  7: "न्यायियों",
  8: "रूत",
  9: "1 शमूएल",
  10: "2 शमूएल",
  11: "1 राजा",
  12: "2 राजा",
  13: "1 इतिहास",
  14: "2 इतिहास",
  15: "एज्रा",
  16: "नहेमायाह",
  17: "एस्तेर",
  18: "अय्यूब",
  19: "भजन संहिता",
  20: "नीतिवचन",
  21: "सभोपदेशक",
  22: "श्रेष्ठगीत",
  23: "यशायाह",
  24: "यिर्मयाह",
  25: "विलापगीत",
  26: "यहेजकेल",
  27: "दानिय्येल",
  28: "होशे",
  29: "योएल",
  30: "आमोस",
  31: "ओबद्याह",
  32: "योना",
  33: "मीका",
  34: "नहूम",
  35: "हबक्कूक",
  36: "सपन्याह",
  37: "हाग्गै",
  38: "जकर्याह",
  39: "मलाकी",
};

// Hebrew names (Tanakh)
export const BOOK_NAMES_HE: Record<number, string> = {
  1: "בראשית",
  2: "שמות",
  3: "ויקרא",
  4: "במדבר",
  5: "דברים",
  6: "יהושע",
  7: "שופטים",
  8: "רות",
  9: "שמואל א",
  10: "שמואל ב",
  11: "מלכים א",
  12: "מלכים ב",
  13: "דברי הימים א",
  14: "דברי הימים ב",
  15: "עזרא",
  16: "נחמיה",
  17: "אסתר",
  18: "איוב",
  19: "תהילים",
  20: "משלי",
  21: "קהלת",
  22: "שיר השירים",
  23: "ישעיהו",
  24: "ירמיהו",
  25: "איכה",
  26: "יחזקאל",
  27: "דניאל",
  28: "הושע",
  29: "יואל",
  30: "עמוס",
  31: "עובדיה",
  32: "יונה",
  33: "מיכה",
  34: "נחום",
  35: "חבקוק",
  36: "צפניה",
  37: "חגי",
  38: "זכריה",
  39: "מלאכי",
};

import type { LangCode } from '../lang'

export function getLocalizedBookName(bn: number, lang: LangCode, jsonName?: string): string {
  if (lang === 'te') return BOOK_NAMES[bn] ?? jsonName ?? `Book ${bn}`
  if (lang === 'hi') return BOOK_NAMES_HI[bn] ?? jsonName ?? `Book ${bn}`
  if (lang === 'he') return BOOK_NAMES_HE[bn] ?? jsonName ?? `Book ${bn}`
  // Tamil/English: prefer JSON then fallback maps
  if (lang === 'en') return BOOK_NAMES_EN[bn] ?? jsonName ?? `Book ${bn}`
  return jsonName ?? BOOK_NAMES_EN[bn] ?? `Book ${bn}`
}

/** Build “English - Telugu” label for header dropdown (falls back to Telugu). */
export function combinedBookLabel(bn: number, localName?: string, englishOnly?: boolean) {
  const en = BOOK_NAMES_EN[bn]
  const local = localName ?? BOOK_NAMES[bn] ?? `Book ${bn}`
  if (englishOnly) return en ?? local
  return en ? `${en} - ${local}` : local
}

/**
 * GLOBAL DROPDOWN ORDER (header)
 * EXACT order you gave me (39-book order).
 */
export const BOOK_ORDER_DROPDOWN: number[] = [
  1, 2, 3, 4, 5,    // Torah
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
  36, 37, 38, 39,
];

/**
 * HOME PAGE GROUPS + ORDER (independent of dropdown)
 * EXACT grouping/order you wrote.
 */
export const HOME_SECTIONS: { key: DivisionKey; label: string; order: number[] }[] = [
  { key: "Torah",   label: "తోరా",   order: [1, 2, 3, 4, 5] },
  { key: "Neviim",  label: "నెవియీం", order: [6, 7, 9, 10, 11, 12, 23, 24, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39] },
  { key: "Ketuvim", label: "కెతూవీం", order: [19, 20, 18, 22, 8, 25, 21, 17, 27, 15, 16, 13, 14] },
];

// Back-compat exports:
export type Division = DivisionKey;
export const DIVISIONS = HOME_SECTIONS.map(s => ({ key: s.key, label: s.label }));
export const DIVISION_BOOKS: Record<DivisionKey, number[]> = {
  Torah:   HOME_SECTIONS.find(s => s.key === "Torah")!.order,
  Neviim:  HOME_SECTIONS.find(s => s.key === "Neviim")!.order,
  Ketuvim: HOME_SECTIONS.find(s => s.key === "Ketuvim")!.order,
};
