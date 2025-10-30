"use client"

import { useMemo } from 'react'
import { useBible } from '../providers/LanguageProvider'
import { BOOK_NAMES_EN, getLocalizedBookName } from '../../lib/data/books'
import { useLanguage } from '../providers/LanguageProvider'

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

export function usePresenterBible() {
  const bible = useBible()
  const { lang } = useLanguage()

  const { bookIndex, bookNumbers } = useMemo(() => {
    const data = (bible as any)?.books as BibleBook[] | undefined
    const idx: Record<number, BibleBook> = {}
    if (data) {
      for (const book of data) idx[book.bnumber] = book
    }
    return { bookIndex: idx, bookNumbers: data ? data.map(b => b.bnumber) : [] }
  }, [bible])

  const getBook = (bnumber: number) => bookIndex[bnumber]

  const getChapter = (bnumber: number, cnumber: number): BibleChapter | undefined =>
    bookIndex[bnumber]?.chapters.find((chapter) => chapter.cnumber === cnumber)

  const getVerse = (bnumber: number, cnumber: number, vnumber: number): BibleVerse | undefined =>
    getChapter(bnumber, cnumber)?.verses.find((verse) => verse.vnumber === vnumber)

  const getVerseText = (bnumber: number, cnumber: number, vnumber: number) =>
    getVerse(bnumber, cnumber, vnumber)?.text ?? ''

  const getChapterCount = (bnumber: number) =>
    bookIndex[bnumber]?.chapters.length ?? 0

  const getVerseCount = (bnumber: number, cnumber: number) =>
    getChapter(bnumber, cnumber)?.verses.length ?? 0

  const formatReference = (bnumber: number, cnumber: number, vnumber: number) => {
    const local = getLocalizedBookName(bnumber, lang, bookIndex[bnumber]?.bname)
    const english = BOOK_NAMES_EN[bnumber]
    const label = lang === 'en' ? (english ?? local) : (english ? `${english} - ${local}` : local)
    return `${label} ${cnumber}:${vnumber}`
  }

  const getNextVerse = (bnumber: number, cnumber: number, vnumber: number) => {
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

    const idx = bookNumbers.indexOf(bnumber)
    const nextBookNumber = bookNumbers[idx + 1]
    if (!nextBookNumber) return null
    return { bnumber: nextBookNumber, cnumber: 1, vnumber: 1 }
  }

  const getPreviousVerse = (bnumber: number, cnumber: number, vnumber: number) => {
    if (vnumber > 1) return { bnumber, cnumber, vnumber: vnumber - 1 }

    const book = getBook(bnumber)
    if (!book) return null
    const chapterIndex = book.chapters.findIndex((c) => c.cnumber === cnumber)
    const prevChapter = book.chapters[chapterIndex - 1]
    if (prevChapter) {
      const lastVerse = prevChapter.verses[prevChapter.verses.length - 1]
      if (lastVerse) return { bnumber, cnumber: prevChapter.cnumber, vnumber: lastVerse.vnumber }
    }

    const idx = bookNumbers.indexOf(bnumber)
    const prevBookNumber = bookNumbers[idx - 1]
    if (!prevBookNumber) return null
    const lastChapter = getBook(prevBookNumber)?.chapters.at(-1)
    const lastVerse = lastChapter?.verses.at(-1)
    if (!lastChapter || !lastVerse) return null
    return { bnumber: prevBookNumber, cnumber: lastChapter.cnumber, vnumber: lastVerse.vnumber }
  }

  const listChapters = (bnumber: number) => getBook(bnumber)?.chapters.map((c) => c.cnumber) ?? []
  const listVerses = (bnumber: number, cnumber: number) => getChapter(bnumber, cnumber)?.verses.map((v) => v.vnumber) ?? []

  return {
    ready: !!(bible as any)?.books,
    getBook,
    getChapter,
    getVerse,
    getVerseText,
    getChapterCount,
    getVerseCount,
    formatReference,
    getNextVerse,
    getPreviousVerse,
    listChapters,
    listVerses,
  }
}
