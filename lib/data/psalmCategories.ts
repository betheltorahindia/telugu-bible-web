// lib/data/psalmCategories.ts

export type PsalmCategoryKey =
  | 'faith'
  | 'thanks'
  | 'praise'
  | 'deliverance'
  | 'trouble'
  | 'healing'
  | 'spouse'
  | 'newlyweds'
  | 'conception'
  | 'labor'
  | 'grave'
  | 'livelihood'
  | 'journey'
  | 'israel'
  | 'jerusalem'
  | 'peace'
  | 'success'

export type PsalmCategory = {
  key: PsalmCategoryKey
  label: string
  order: number[]   // list of Psalm numbers in the exact order you want
}

/**
 * 👉 Replace the numbers in `order: []` with the real Psalm numbers you want.
 * The order in each array is the navigation order when user is in that category.
 */
export const PSALM_CATEGORIES: PsalmCategory[] = [
  { key: 'faith',       label: 'దేవునియందు నమ్మికయుంచుట',          order: [6, 26, 27, 28, 40, 44, 61, 127, 130, 139] },
  { key: 'thanks',      label: 'దేవునికి కృతజ్ఞత తెలిపే కీర్తనలు',   order: [67, 75, 86, 100, 103, 107, 118, 124, 136, 145] },
  { key: 'praise',      label: 'దేవునిని స్తుతియించే కీర్తనలు',        order: [33, 47, 105, 106, 113, 114, 115, 116, 117, 118] },
  { key: 'deliverance', label: 'విడుదల కొరకు కీర్తనలు',               order: [20, 25, 57, 60, 62, 68, 98, 116, 124, 141] },
  { key: 'trouble',     label: 'ఆపత్కాలమందు చదివే కీర్తనలు',          order: [6, 13, 22, 38, 39, 69, 77, 88, 102, 142] },
  { key: 'healing',     label: 'స్వస్థత కొరకు కీర్తనలు',               order: [6, 9, 13, 16, 17, 18, 20, 22, 23, 28, 30, 31, 32, 33, 37, 38, 39, 41, 49, 55, 56, 86, 88, 89, 90, 91, 102, 103, 104, 107, 116, 118, 142, 143, 148] },
  { key: 'spouse',      label: 'జీవిత భాగస్వామి కొరకు',               order: [32, 38, 70, 71, 72, 82, 92, 121, 124, 126] },
  { key: 'newlyweds',   label: 'నూతన వధూవరుల కొరకు',                  order: [19] },
  { key: 'conception',  label: 'గర్భము ధరించుట కొరకు',                 order: [8, 19, 29, 36, 45, 57, 62, 93, 103, 128] },
  { key: 'labor',       label: 'గర్భవేదనలో ఉన్న స్త్రీ కొరకు',          order: [4, 5, 8, 20, 57, 93, 100, 108, 139, 142] },
  { key: 'grave',       label: 'సమాధిని దర్శించినప్పుడు',               order: [1, 15, 16, 17, 33, 49, 72, 91, 104, 130] },
  { key: 'livelihood',  label: 'జీవనోపాధి కొరకు కీర్తనలు',             order: [4, 20, 21, 23, 24, 29, 36, 41, 91, 104] },
  { key: 'journey',     label: 'క్షేమకరమైన ప్రయాణము కొరకు',            order: [91, 121] },
  { key: 'israel & jerusalem',      label: 'ఇశ్రాయేలు/యెరూషలేము కొరకును',              order: [48, 79, 80, 87, 122, 125, 126, 132, 134, 137] },
  { key: 'peace',       label: 'సమాధానము కొరకు',                       order: [46] },
  { key: 'success',     label: 'విజయం / కార్యసిద్ధి కొరకు',             order: [112] },
  { key: 'elul',       label: 'ఎలుల్ నెల కీర్తన',                    order: [27] },
]

// Fast lookup
export const PSALM_CAT_BY_KEY = Object.fromEntries(
  PSALM_CATEGORIES.map(c => [c.key, c] as const)
)

export function getPsalmCategoryOrder(key?: string | null): number[] | null {
  if (!key) return null
  const cat = PSALM_CAT_BY_KEY[key as PsalmCategoryKey]
  return cat ? cat.order : null
}
