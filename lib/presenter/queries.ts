import {
  createSupabaseServerClient,
  hasSupabaseEnv,
  type TypedSupabaseClient,
} from '../supabase/server'
import type { PresenterBootstrap, PresenterItem, PresenterProject, PresenterProjectWithItems } from './types'

const PROJECT_COLUMNS = 'id, slug, title, owner_user_id, settings, created_at, updated_at'

function mapProject(row: {
  id: string
  slug: string
  title: string
  owner_user_id: string
  settings: any
  created_at: string
  updated_at: string
}): PresenterProject {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    ownerUserId: row.owner_user_id,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItem(row: {
  id: string
  project_id: string
  order: number
  book: number
  chapter: number
  verse: number
  note: string | null
}): PresenterItem {
  return {
    id: row.id,
    projectId: row.project_id,
    order: row.order,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    note: row.note,
  }
}

async function getClient(client?: TypedSupabaseClient) {
  if (client) return client
  if (!hasSupabaseEnv) {
    throw new Error('Supabase is not configured')
  }
  return createSupabaseServerClient()
}

export async function getPresenterBootstrap(client?: TypedSupabaseClient): Promise<PresenterBootstrap | null> {
  const supabase = await getClient(client)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id || !session.user.email) {
    return null
  }

  const userId = session.user.id
  const email = session.user.email

  const [{ data: adminRow }, { data: premiumRow }] = await Promise.all([
    supabase.from('admin_users').select('email').eq('email', email).maybeSingle(),
    supabase.from('premium_users').select('email').eq('email', email).maybeSingle(),
  ])

  const { data: projectRows, error: projectError } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('owner_user_id', userId)
    .order('updated_at', { ascending: false })

  if (projectError) {
    throw projectError
  }

  const projects = (projectRows ?? []).map(mapProject)
  const isAdmin = Boolean(adminRow)
  const isPremium = Boolean(premiumRow)
  const limit = isAdmin || isPremium ? null : 5

  return {
    sessionUserId: userId,
    email,
    isAdmin,
    isPremium,
    quota: {
      limit,
      used: projects.length,
    },
    projects,
  }
}

export async function getProjectWithItems(projectId: string, client?: TypedSupabaseClient): Promise<PresenterProjectWithItems | null> {
  const supabase = await getClient(client)
  const { data: projectRow, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw error
  if (!projectRow) return null

  const project = mapProject(projectRow)

  const { data: itemRows, error: itemError } = await supabase
    .from('project_items')
    .select('id, project_id, order, book, chapter, verse, note')
    .eq('project_id', projectId)
    .order('order', { ascending: true })

  if (itemError) throw itemError

  const items = (itemRows ?? []).map(mapItem)

  return { ...project, items }
}

export async function getProjectBySlug(slug: string, client?: TypedSupabaseClient): Promise<PresenterProjectWithItems | null> {
  const supabase = await getClient(client)
  const { data: projectRow, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!projectRow) return null

  const project = mapProject(projectRow)

  const { data: itemRows, error: itemError } = await supabase
    .from('project_items')
    .select('id, project_id, order, book, chapter, verse, note')
    .eq('project_id', project.id)
    .order('order', { ascending: true })

  if (itemError) throw itemError

  const items = (itemRows ?? []).map(mapItem)
  return { ...project, items }
}

export async function getProjectMetaBySlug(slug: string, client?: TypedSupabaseClient) {
  const supabase = await getClient(client)
  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, title, owner_user_id, settings, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    ownerUserId: data.owner_user_id,
    settings: data.settings,
    updatedAt: data.updated_at,
  }
}
