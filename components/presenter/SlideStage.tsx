import React from 'react'

type Theme = {
  gradient: { colors: string[]; angle: number; style?: string }
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  referenceAlign?: 'left' | 'center' | 'right'
  fontFamily?: string
}

type Props = {
  text: string
  reference?: string | null
  theme: Theme
  fontSize: number
  containerRef?: React.RefObject<HTMLDivElement>
  contentRef?: React.RefObject<HTMLDivElement>
  className?: string
  style?: React.CSSProperties
}

// Fixed internal design size 1920x1080. All paddings are defined in px so
// the layout is identical between fullscreen and the scaled preview.
import { useLanguage } from '../providers/LanguageProvider'

export default function SlideStage({ text, reference, theme, fontSize, containerRef, contentRef, className, style }: Props) {
  const { lang } = useLanguage()
  const gradientStyle = theme.gradient.style === 'radial'
    ? `radial-gradient(circle, ${theme.gradient.colors.join(', ')})`
    : `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.colors.join(', ')})`

  // Internal paddings chosen to match previous layout (converted from Tailwind defaults)
  const paddingLeft = 24 // px (approx. px-6)
  const paddingRight = 24
  const paddingTop = 32 // px (approx. pt-8)
  const paddingBottom = 56 // px (approx. pb-14)

  const defaultTextAlign = theme.textAlign ?? (lang === 'he' ? 'right' : 'left')
  return (
    <div
      className={className}
      style={{
        width: 1920,
        height: 1080,
        position: 'relative',
        overflow: 'hidden',
        background: gradientStyle,
        ...style,
      }}
      data-slide-stage
    >
      <div style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
      <div style={{ position: 'relative', zIndex: 10, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', paddingLeft, paddingRight, paddingTop, paddingBottom, color: 'white' }}>
        <div ref={containerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: defaultTextAlign === 'center' ? 'center' : defaultTextAlign === 'right' ? 'flex-end' : 'flex-start', width: '100%' }}>
          <div ref={contentRef} style={{ width: '100%', fontWeight: 600, textAlign: defaultTextAlign, whiteSpace: 'pre-wrap', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))', fontSize: `${fontSize + (lang === 'he' ? 4 : 0)}px`, lineHeight: theme.lineHeight ?? 1.35, fontFamily: lang === 'te' ? (theme.fontFamily ?? "Dhurjati, system-ui, -apple-system") : theme.fontFamily }} dir={lang === 'he' ? 'rtl' : undefined}>
            {text}
          </div>
        </div>

        <div style={{ textAlign: theme.referenceAlign ?? 'center', marginTop: 12 }}>
          <div style={{ background: '#fff3c4', color: '#000', display: 'inline-block', padding: '8px 24px', borderRadius: 6, boxShadow: '0 6px 0 rgba(0,0,0,0.2)', fontWeight: 600, fontSize: 18 }}>
            {reference}
          </div>
        </div>
      </div>
    </div>
  )
}
