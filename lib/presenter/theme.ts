import type { ThemeSettings } from '../supabase/types'

export const DEFAULT_THEME: ThemeSettings = {
  gradient: {
    colors: ['#0f172a', '#1e293b'],
    angle: 135,
    style: 'linear',
  },
  fontSize: 48,
  lineHeight: 1.3,
  textAlign: 'center',
  referenceAlign: 'center',
}

export type GradientPreset = {
  id: string
  label: string
  colors: string[]
  angle: number
  style?: 'linear' | 'radial'
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunrise', label: 'Sunrise', colors: ['#ff9a9e', '#fad0c4'], angle: 120 },
  { id: 'ocean', label: 'Ocean', colors: ['#2193b0', '#6dd5ed'], angle: 135 },
  { id: 'violet-sky', label: 'Violet Sky', colors: ['#a18cd1', '#fbc2eb'], angle: 140 },
  { id: 'forest', label: 'Forest', colors: ['#134e5e', '#71b280'], angle: 150 },
  { id: 'ember', label: 'Ember', colors: ['#ff4e50', '#f9d423'], angle: 135 },
  { id: 'dusk', label: 'Dusk', colors: ['#0f2027', '#203a43', '#2c5364'], angle: 160 },
]

export function normalizeTheme(partial?: Partial<ThemeSettings>): ThemeSettings {
  return {
    gradient: {
      colors: partial?.gradient?.colors?.length ? partial.gradient.colors : DEFAULT_THEME.gradient.colors,
      angle: partial?.gradient?.angle ?? DEFAULT_THEME.gradient.angle,
      style: partial?.gradient?.style ?? DEFAULT_THEME.gradient.style,
    },
    fontSize: partial?.fontSize ?? DEFAULT_THEME.fontSize,
    lineHeight: partial?.lineHeight ?? DEFAULT_THEME.lineHeight,
    textAlign: partial?.textAlign ?? DEFAULT_THEME.textAlign,
    referenceAlign: partial?.referenceAlign ?? DEFAULT_THEME.referenceAlign,
  }
}


