import bible from '../../data/bible.json'
import { BOOK_NAMES, BOOK_NAMES_EN } from '../data/books'

type BibleVerse = {
  bnumber: number
  cnumber: number
  vnumber: number
  text: string
}

type BibleChapter = {
  cnumber: number
  verses: BibleVerse[]
}

type BibleBook = {
  bnumber: number
  bname: string
  chapters: BibleChapter[]
}

const bibleData = bible as { books: BibleBook[] }
const bookIndex: Record<number, BibleBook> = {}
for (const book of bibleData.books) {
  bookIndex[book.bnumber] = book
}

export function getBook(bnumber: number) {
  return bookIndex[bnumber]
}

export function getChapter(bnumber: number, cnumber: number): BibleChapter | undefined {
  return bookIndex[bnumber]?.chapters.find((chapter) => chapter.cnumber === cnumber)
}

export function getVerse(bnumber: number, cnumber: number, vnumber: number): BibleVerse | undefined {
  return getChapter(bnumber, cnumber)?.verses.find((verse) => verse.vnumber === vnumber)
}

export function getVerseText(bnumber: number, cnumber: number, vnumber: number) {
  return getVerse(bnumber, cnumber, vnumber)?.text ?? ''
}

export function getChapterCount(bnumber: number) {
  return bookIndex[bnumber]?.chapters.length ?? 0
}

export function getVerseCount(bnumber: number, cnumber: number) {
  return getChapter(bnumber, cnumber)?.verses.length ?? 0
}

export function formatReference(bnumber: number, cnumber: number, vnumber: number) {
  const telugu = BOOK_NAMES[bnumber] ?? `Book ${bnumber}`
  const english = BOOK_NAMES_EN[bnumber]
  const label = english ? `${english} - ${telugu}` : telugu
  return `${label} ${cnumber}:${vnumber}`
}

export function getNextVerse(bnumber: number, cnumber: number, vnumber: number) {
  const chapter = getChapter(bnumber, cnumber)
  if (!chapter) return null
  const verseCount = chapter.verses.length
  if (vnumber < verseCount) {
    return { bnumber, cnumber, vnumber: vnumber + 1 }
  }

  const book = getBook(bnumber)
  if (!book) return null
  const chapterIndex = book.chapters.findIndex((c) => c.cnumber === cnumber)
  const nextChapter = book.chapters[chapterIndex + 1]
  if (nextChapter) {
    return { bnumber, cnumber: nextChapter.cnumber, vnumber: 1 }
  }

  const bookNumbers = bibleData.books.map((bk) => bk.bnumber)
  const currentBookIndex = bookNumbers.indexOf(bnumber)
  const nextBook = bibleData.books[currentBookIndex + 1]
  if (!nextBook) return null
  return { bnumber: nextBook.bnumber, cnumber: 1, vnumber: 1 }
}

export function getPreviousVerse(bnumber: number, cnumber: number, vnumber: number) {
  if (vnumber > 1) {
    return { bnumber, cnumber, vnumber: vnumber - 1 }
  }

  const book = getBook(bnumber)
  if (!book) return null
  const chapterIndex = book.chapters.findIndex((c) => c.cnumber === cnumber)
  const prevChapter = book.chapters[chapterIndex - 1]
  if (prevChapter) {
    const lastVerse = prevChapter.verses[prevChapter.verses.length - 1]
    if (lastVerse) {
      return { bnumber, cnumber: prevChapter.cnumber, vnumber: lastVerse.vnumber }
    }
  }

  const bookNumbers = bibleData.books.map((bk) => bk.bnumber)
  const currentBookIndex = bookNumbers.indexOf(bnumber)
  const prevBook = bibleData.books[currentBookIndex - 1]
  if (!prevBook) return null
  const lastChapter = prevBook.chapters[prevBook.chapters.length - 1]
  const lastVerse = lastChapter?.verses[lastChapter.verses.length - 1]
  if (!lastChapter || !lastVerse) return null
  return { bnumber: prevBook.bnumber, cnumber: lastChapter.cnumber, vnumber: lastVerse.vnumber }
}

export function listChapters(bnumber: number) {
  return bookIndex[bnumber]?.chapters.map((chapter) => chapter.cnumber) ?? []
}

export function listVerses(bnumber: number, cnumber: number) {
  return getChapter(bnumber, cnumber)?.verses.map((verse) => verse.vnumber) ?? []
}
