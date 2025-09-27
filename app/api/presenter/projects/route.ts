export const dynamic = 'force-dynamic'

import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabaseEnv, createSupabaseRouteHandlerClient } from '../../../../lib/supabase/server'
import { getPresenterBootstrap, getProjectWithItems } from '../../../../lib/presenter/queries'
import { upsertProjectSchema } from '../../../../lib/presenter/schema'
import { applyRateLimit } from '../../../../lib/utils/rateLimit'

const WRITE_LIMIT = 10
const WRITE_WINDOW_MS = 60_000
const PROJECT_COLUMNS = 'id, slug, title, owner_user_id, settings, created_at, updated_at'

function missingConfigResponse() {
  return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
}

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv) {
    return missingConfigResponse()
  }

  const supabase = createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams.get('search')?.trim()

  let query = supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('owner_user_id', session.user.id)
    .order('updated_at', { ascending: false })

  if (search) {
    const sanitized = search.replace(/%/g, '')
    const pattern = `%${sanitized}%`
    query = query.or(`title.ilike.${pattern},slug.ilike.${pattern}`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const projects = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    ownerUserId: row.owner_user_id,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv) {
    return missingConfigResponse()
  }

  const supabase = createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const rate = applyRateLimit('presenter:write:' + session.user.id, WRITE_LIMIT, WRITE_WINDOW_MS)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } },
    )
  }

  const body = await request.json().catch(() => null)
  const parseResult = upsertProjectSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 })
  }

  const payload = parseResult.data

  const bootstrap = await getPresenterBootstrap(supabase)
  if (!bootstrap) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (bootstrap.quota.limit !== null && bootstrap.quota.used >= bootstrap.quota.limit) {
    return NextResponse.json({ error: 'Project limit reached' }, { status: 403 })
  }

  const { data: projectRow, error: insertError } = await supabase
    .from('projects')
    .insert({
      title: payload.title,
      slug: payload.slug,
      owner_user_id: session.user.id,
      settings: payload.settings,
    })
    .select('id')
    .single()

  if (insertError || !projectRow) {
    const status = insertError?.code === '23505' ? 409 : 500
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create project' }, { status })
  }

  const itemsPayload = payload.items.map((item, index) => ({
    project_id: projectRow.id,
    order: index,
    book: item.book,
    chapter: item.chapter,
    verse: item.verse,
    note: item.note ?? null,
  }))

  if (itemsPayload.length) {
    const { error: itemsError } = await supabase.from('project_items').insert(itemsPayload)
    if (itemsError) {
      await supabase.from('projects').delete().eq('id', projectRow.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
  }

  const fullProject = await getProjectWithItems(projectRow.id, supabase)

  return NextResponse.json(fullProject, { status: 201 })
}



