'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPrayer, prayers } from '../../lib/data/prayers'

export default function PrayerNavigation() {
  const pathname = usePathname() || '/prayers'
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, , prayerSlug, sectionSlug] = pathname.split('/')
  const prayer = prayerSlug ? getPrayer(prayerSlug) : undefined
  const sections = prayer?.sections ?? []
  const currentIndex = sections.findIndex((section) => section.slug === sectionSlug)
  const currentSection = currentIndex >= 0 ? sections[currentIndex] : undefined

  const hrefFor = (path: string) => {
    const query = searchParams.toString()
    return query ? `${path}?${query}` : path
  }

  const selectPrayer = (slug: string) => {
    router.push(hrefFor(slug ? `/prayers/${slug}` : '/prayers'))
  }

  const selectSection = (slug: string) => {
    if (!prayer || !slug) {
      if (prayer) router.push(hrefFor(`/prayers/${prayer.slug}`))
      return
    }
    router.push(hrefFor(`/prayers/${prayer.slug}/${slug}`))
  }

  const navigateSection = (direction: -1 | 1) => {
    if (!prayer) return
    const nextSection = sections[currentIndex + direction]
    if (nextSection) router.push(hrefFor(`/prayers/${prayer.slug}/${nextSection.slug}`))
  }

  return (
    <nav className="prayer-navigation" aria-label="Prayer and section navigation">
      <label className="prayer-navigation-select prayer-navigation-prayer">
        <span className="sr-only">Select prayer</span>
        <select value={prayer?.slug ?? ''} onChange={(event) => selectPrayer(event.target.value)}>
          <option value="">Select a prayer</option>
          {prayers.map((item) => (
            <option key={item.slug} value={item.slug}>{item.title.en || item.slug}</option>
          ))}
        </select>
      </label>
      {prayer && sections.length > 0 && (
        <div className="prayer-navigation-sections">
          <button
            type="button"
            className="prayer-navigation-arrow"
            onClick={() => navigateSection(-1)}
            disabled={currentIndex <= 0}
            aria-label="Previous prayer section"
            title="Previous section"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <label className="prayer-navigation-select prayer-navigation-section">
            <span className="sr-only">Select prayer section</span>
            <select value={currentSection?.slug ?? ''} onChange={(event) => selectSection(event.target.value)}>
              <option value="">All sections</option>
              {sections.map((section) => (
                <option key={section.slug} value={section.slug}>
                  {section.title.en || section.slug}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="prayer-navigation-arrow"
            onClick={() => navigateSection(1)}
            disabled={currentIndex >= sections.length - 1}
            aria-label="Next prayer section"
            title="Next section"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  )
}
