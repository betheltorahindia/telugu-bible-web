import type { ThemeSettings } from '../supabase/types'

export type VerseRef = {
  book: number
  chapter: number
  verse: number
  note?: string | null
}

export type PresenterProject = {
  id: string
  slug: string
  title: string
  ownerUserId: string
  settings: ThemeSettings
  createdAt: string
  updatedAt: string
}

export type PresenterItem = VerseRef & {
  id: string
  projectId: string
  order: number
}

export type PresenterProjectWithItems = PresenterProject & {
  items: PresenterItem[]
}

export type UpsertProjectPayload = {
  title: string
  slug: string
  settings: ThemeSettings
  items: Array<VerseRef>
}

export type PresenterQuota = {
  limit: number | null
  used: number
}

export type PresenterBootstrap = {
  sessionUserId: string
  email: string
  isAdmin: boolean
  isPremium: boolean
  quota: PresenterQuota
  projects: PresenterProject[]
}
