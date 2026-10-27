export type DailyQuote = {
  text: string
  author: string
}

const DAILY_QUOTES: DailyQuote[] = [
  {
    text: "If you don't know what you're living for, you haven't yet lived.",
    author: 'Rabbi Noah Weinberg',
  },
  {
    text: 'In Jewish history there are no coincidences.',
    author: 'Elie Wiesel',
  },
  {
    text: "Gam zu l'tova. This too is for the good.",
    author: 'Nachum Ish Gamzu',
  },
  {
    text: 'If you want to meet a princess, make yourself into a prince.',
    author: 'Rabbi Dov Heller',
  },
]

export async function getDailyQuote(date = new Date()): Promise<DailyQuote> {
  const dayOfYear = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), 0, 0)) /
      86_400_000,
  )
  return DAILY_QUOTES[(dayOfYear - 1) % DAILY_QUOTES.length]
}
