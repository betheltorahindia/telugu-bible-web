'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type UIEvent } from 'react'
import { BookOpen, CalendarDays, Heart, Info, Settings, Sparkles, Users } from 'lucide-react'

const destinations = [
  { label: 'Settings', href: '/settings', icon: Settings, color: '#5e4799', available: true },
  { label: 'Social', href: '/social', icon: Users, color: '#916b00', available: true },
  { label: 'Prayers', href: '/prayers', icon: Heart, color: '#b52b39', available: true },
  { label: 'Tanach', href: '/tanach', icon: BookOpen, color: '#b64a12', available: true },
  { label: 'Study', href: '/study', icon: Sparkles, color: '#28733f', available: true },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays, color: '#24659d', available: true },
  { label: 'About', href: '/settings/about', icon: Info, color: '#9d3f79', available: true },
]

export default function HomeNavigationCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(3)

  const centerItem = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const carousel = carouselRef.current
    const item = carousel?.querySelector<HTMLElement>(`[data-carousel-index="${index}"]`)
    if (!carousel || !item) return
    const itemLeft = item.getBoundingClientRect().left - carousel.getBoundingClientRect().left + carousel.scrollLeft
    const left = itemLeft - (carousel.clientWidth - item.offsetWidth) / 2
    carousel.scrollTo({ left, behavior })
    setActiveIndex(index)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => centerItem(3, 'instant'))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const updateActiveItem = (event: UIEvent<HTMLDivElement>) => {
    const carousel = event.currentTarget
    const center = carousel.getBoundingClientRect().left + carousel.clientWidth / 2
    let closestIndex = activeIndex
    let closestDistance = Number.POSITIVE_INFINITY

    carousel.querySelectorAll<HTMLElement>('[data-carousel-index]').forEach((item) => {
      const itemCenter = item.getBoundingClientRect().left + item.offsetWidth / 2
      const distance = Math.abs(center - itemCenter)
      if (distance < closestDistance) {
        closestIndex = Number(item.dataset.carouselIndex)
        closestDistance = distance
      }
    })
    setActiveIndex(closestIndex)
  }

  return (
    <div className="home-carousel-wrap">
      <nav
        ref={carouselRef}
        className="home-navigation-carousel"
        aria-label="Explore Bethel Torah India"
        onScroll={updateActiveItem}
        onWheel={(event) => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.currentTarget.scrollLeft += event.deltaY
          }
        }}
      >
        <div className="home-carousel-track">
          {destinations.map(({ label, href, icon: Icon, color, available }, index) => {
            const distance = Math.abs(index - activeIndex)
            const itemStyle = {
              '--carousel-accent': color,
              '--carousel-offset': `${Math.min(distance, 3) * 11}px`,
              '--carousel-scale': distance === 0 ? '1' : distance === 1 ? '0.94' : '0.88',
            } as React.CSSProperties
            const itemClassName = [
              'home-carousel-item',
              index === activeIndex && 'is-centered',
              !available && 'is-coming-soon',
            ].filter(Boolean).join(' ')

            return index === activeIndex && available ? (
              <Link
                key={label}
                href={href}
                className={itemClassName}
                style={itemStyle}
                data-carousel-index={index}
                aria-current="true"
              >
                <span className="home-carousel-icon"><Icon className="h-5 w-5" /></span>
                <span>{label}</span>
                <span className="home-carousel-shimmer" aria-hidden="true" />
              </Link>
            ) : (
              <div
                key={label}
                className={itemClassName}
                style={itemStyle}
                data-carousel-index={index}
                aria-disabled="true"
                aria-label={`${label}${available ? ', scroll to center to open' : ', coming soon'}`}
              >
                <span className="home-carousel-icon"><Icon className="h-5 w-5" /></span>
                <span>{label}</span>
                {!available && <small>Coming soon</small>}
              </div>
            )
          })}
        </div>
      </nav>
      <div className="home-carousel-indicators" aria-hidden="true">
        {destinations.map(({ color, label }, index) => (
          <span
            key={label}
            className={index === activeIndex ? 'is-active' : ''}
            style={{ '--carousel-accent': color } as React.CSSProperties}
          />
        ))}
        <i
          className="home-carousel-spark"
          style={{ '--carousel-accent': destinations[activeIndex].color } as React.CSSProperties}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {destinations[activeIndex].label} selected. Scroll to center a destination, then activate it.
      </span>
    </div>
  )
}
