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

/** Build “English – Telugu” label for header dropdown (falls back to Telugu). */
export function combinedBookLabel(bn: number, fallback?: string) {
  const te = BOOK_NAMES[bn] ?? fallback ?? `Book ${bn}`;
  const en = BOOK_NAMES_EN[bn];
  return en ? `${en} - ${te}` : te;
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
