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
  { key: 'faith',       label: 'దేవునియందు నమ్మికయుంచుట',          order: [6, 27, 31, 37] },
  { key: 'thanks',      label: 'దేవునికి కృతజ్ఞతలు తెలిపే కీర్తనలు',   order: [30, 92, 118] },
  { key: 'praise',      label: 'దేవునిని స్తుతియించే కీర్తనలు',        order: [8, 19, 145, 150] },
  { key: 'deliverance', label: 'విడుదల కొరకు కీర్తనలు',               order: [34, 40, 124] },
  { key: 'trouble',     label: 'ఆపత్కాలమందు చదివే కీర్తనలు',          order: [3, 4, 5, 7] },
  { key: 'healing',     label: 'స్వస్థత కొరకు కీర్తనలు',               order: [6, 41] },
  { key: 'spouse',      label: 'జీవిత భాగస్వామి కొరకు',               order: [128, 127] },
  { key: 'newlyweds',   label: 'నూతన వధూవరుల కొరకు',                  order: [45, 128] },
  { key: 'conception',  label: 'గర్భము ధరించుట కొరకు',                 order: [113, 115] },
  { key: 'labor',       label: 'గర్భవేదనలో ఉన్న స్త్రీ కొరకు',          order: [20, 121] },
  { key: 'grave',       label: 'సమాధిని దర్శించినప్పుడు',               order: [90, 39] },
  { key: 'livelihood',  label: 'జీవనోపాధి కొరకు కీర్తనలు',             order: [90, 127, 128] },
  { key: 'journey',     label: 'క్షేమకరమైన ప్రయాణము కొరకు',            order: [121, 122] },
  { key: 'israel',      label: 'ఇశ్రాయేలు దేశము కొరకును',              order: [122, 124] },
  { key: 'jerusalem',   label: 'యెరూషలేము కొరకును కీర్తనలు',          order: [122, 137] },
  { key: 'peace',       label: 'సమాధానము కొరకు',                       order: [29, 122] },
  { key: 'success',     label: 'విజయం / కార్యసిద్ధి కొరకు',             order: [20, 67] },
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
