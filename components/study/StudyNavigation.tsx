'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getStudyBook, studyBooks } from '../../lib/data/study/books'

export default function StudyNavigation() {
  const pathname = usePathname() || '/study'
  const router = useRouter()
  const [, , selectedSlug, chapterSegment] = pathname.split('/')
  const book = selectedSlug ? getStudyBook(selectedSlug) : undefined
  const chapterNumber = chapterSegment ? Number(chapterSegment) : undefined
  const chapters = book?.kind === 'chapters' ? book.chapters : []
  const currentChapter = chapters.find((chapter) => chapter.number === chapterNumber)
  const currentIndex = currentChapter
    ? chapters.findIndex((chapter) => chapter.number === currentChapter.number)
    : -1

  const changeBook = (slug: string) => {
    if (slug) router.push(`/study/${slug}`)
    else router.push('/study')
  }

  const changeChapter = (value: string) => {
    const nextChapter = Number(value)
    if (Number.isInteger(nextChapter) && nextChapter > 0 && book) {
      router.push(`/study/${book.slug}/${nextChapter}`)
    }
  }

  const navigateChapter = (direction: -1 | 1) => {
    const next = chapters[currentIndex + direction]
    if (next && book) router.push(`/study/${book.slug}/${next.number}`)
  }

  return (
    <nav className="study-navigation" aria-label="Study book and chapter navigation">
      <label className="study-navigation-select study-navigation-book">
        <span className="sr-only">Select study book</span>
        <select value={book?.slug ?? ''} onChange={(event) => changeBook(event.target.value)}>
          <option value="">Select a study book</option>
          {studyBooks.map((studyBook) => (
            <option key={studyBook.slug} value={studyBook.slug}>{studyBook.title}</option>
          ))}
        </select>
      </label>
      {chapters.length > 0 && (
        <div className="study-navigation-chapters">
          <button
            type="button"
            className="study-navigation-arrow"
            onClick={() => navigateChapter(-1)}
            disabled={currentIndex <= 0}
            aria-label="Previous chapter"
            title="Previous chapter"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <label className="study-navigation-select study-navigation-chapter">
            <span className="sr-only">Select chapter</span>
            <select
              value={currentChapter?.number ?? ''}
              onChange={(event) => changeChapter(event.target.value)}
            >
              <option value="">Select chapter</option>
              {chapters.map((chapter) => (
                <option key={chapter.number} value={chapter.number}>Chapter {chapter.number}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="study-navigation-arrow"
            onClick={() => navigateChapter(1)}
            disabled={currentIndex < 0 || currentIndex >= chapters.length - 1}
            aria-label="Next chapter"
            title="Next chapter"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  )
}
