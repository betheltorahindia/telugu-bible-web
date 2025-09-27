export const dynamic = 'force-dynamic'

import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabaseEnv, createSupabaseRouteHandlerClient } from '../../../../../lib/supabase/server'
import { getProjectWithItems } from '../../../../../lib/presenter/queries'
import { upsertProjectSchema } from '../../../../../lib/presenter/schema'
import { applyRateLimit } from '../../../../../lib/utils/rateLimit'

type RouteContext = {
  params: { id: string }
}

const WRITE_LIMIT = 10
const WRITE_WINDOW_MS = 60_000

function missingConfigResponse() {
  return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!hasSupabaseEnv) {
    return missingConfigResponse()
  }

  const supabase = createSupabaseRouteHandlerClient()
  const project = await getProjectWithItems(context.params.id, supabase)
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(project)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!hasSupabaseEnv) {
    return missingConfigResponse()
  }

  const supabase = createSupabaseRouteHandlerClient()
  const projectId = context.params.id

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id) {
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

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      title: payload.title,
      slug: payload.slug,
      settings: payload.settings,
    })
    .eq('id', projectId)

  if (updateError) {
    const status = updateError.code === '23505' ? 409 : 500
    return NextResponse.json({ error: updateError.message }, { status })
  }

  const { error: deleteError } = await supabase.from('project_items').delete().eq('project_id', projectId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const itemsPayload = payload.items.map((item, index) => ({
    project_id: projectId,
    order: index,
    book: item.book,
    chapter: item.chapter,
    verse: item.verse,
    note: item.note ?? null,
  }))

  if (itemsPayload.length) {
    const { error: insertError } = await supabase.from('project_items').insert(itemsPayload)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  const project = await getProjectWithItems(projectId, supabase)
  return NextResponse.json(project)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!hasSupabaseEnv) {
    return missingConfigResponse()
  }

  const supabase = createSupabaseRouteHandlerClient()
  const projectId = context.params.id

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const rate = applyRateLimit('presenter:write:' + session.user.id, WRITE_LIMIT, WRITE_WINDOW_MS)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } },
    )
  }

  const { error: deleteItemsError } = await supabase.from('project_items').delete().eq('project_id', projectId)
  if (deleteItemsError) {
    return NextResponse.json({ error: deleteItemsError.message }, { status: 500 })
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}



