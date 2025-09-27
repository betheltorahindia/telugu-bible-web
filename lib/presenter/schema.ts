import { z } from 'zod'

export const gradientSchema = z.object({
  colors: z.array(z.string().regex(/^#([0-9a-fA-F]{6})$/)).min(2).max(3),
  angle: z.number().min(0).max(360),
  style: z.enum(['linear', 'radial']).default('linear'),
})

export const themeSettingsSchema = z.object({
  gradient: gradientSchema,
  fontSize: z.number().min(20).max(96),
  lineHeight: z.number().min(1).max(2.5),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  referenceAlign: z.enum(['left', 'center', 'right']).default('center'),
})

export const verseRefSchema = z.object({
  book: z.number().int().min(1).max(66),
  chapter: z.number().int().min(1),
  verse: z.number().int().min(1),
  note: z.string().max(280).optional().nullable(),
})

export const upsertProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphen only'),
  settings: themeSettingsSchema,
  items: z.array(verseRefSchema).min(1).max(200),
})

export type UpsertProjectInput = z.infer<typeof upsertProjectSchema>
