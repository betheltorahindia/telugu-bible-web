import React from 'react'
import { useLanguage } from '../providers/LanguageProvider'
import type { ThemeSettings } from '../../lib/supabase/types'

type ReadSlideProps = {
  verses: Array<{
    text: string
    number: number
  }>
  bookName?: string
  chapterNumber: number
  theme: ThemeSettings
    fontSize: number
}

export default function ReadSlide({ verses, bookName, chapterNumber, theme, fontSize = 65 }: ReadSlideProps) {
  const { lang } = useLanguage()
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        position: 'relative',
        overflow: 'hidden',
        background: theme.gradient.style === 'radial'
          ? `radial-gradient(circle, ${theme.gradient.colors.join(', ')})`
          : `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.colors.join(', ')})`,
      }}
    >
      {/* Chapter badge (top-left corner) */}
      {bookName && (
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
          <div style={{
            background: '#fff3c4',
            color: '#000',
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 999,
            boxShadow: '0 6px 0 rgba(0,0,0,0.2)',
            fontWeight: 600,
            fontSize: 20
          }}>
            {bookName} {chapterNumber}
          </div>
        </div>
      )}
      {/* Verses Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 24px 56px',
        color: 'white',
        gap: 24
      }}>
          {/* Verses (card layout like fullscreen) - no chapter header here */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            overflowY: 'hidden',
            justifyContent: 'center',
            paddingTop: 24,
            paddingBottom: 24
          }}>
          {verses.map(verse => (
            <div
              key={verse.number}
              style={{
                position: 'relative',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                borderRadius: 16,
                padding: '24px 32px',
                paddingLeft: 80,
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
            
              {/* Verse Number Badge */}
              <div style={{
                position: 'absolute',
                left: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#fff3c4',
                color: '#000',
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 600,
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
              }}>
                {verse.number}
              </div>

              {/* Verse Text */}
              <div style={{
                fontSize: `${fontSize + (lang === 'he' ? 4 : 0)}px`,
                lineHeight: theme.lineHeight ?? 1.35,
                fontFamily: lang === 'te' ? 'Dhurjati, system-ui, -apple-system' : undefined,
                fontWeight: 600,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
                textAlign: theme.textAlign ?? 'left',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}>
                {verse.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
