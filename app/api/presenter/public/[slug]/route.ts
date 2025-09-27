import { NextResponse, type NextRequest } from 'next/server'
import {
  hasSupabaseEnv,
  createSupabaseServiceRoleClient,
} from '../../../../../lib/supabase/server'
import type { Database } from '../../../../../lib/supabase/types'

export const dynamic = 'force-dynamic'

type ProjectPublicRow = Pick<
  Database['public']['Tables']['projects']['Row'],
  'id' | 'slug' | 'title' | 'settings'
>

type ProjectItemPublicRow = Pick<
  Database['public']['Tables']['project_items']['Row'],
  'order' | 'book' | 'chapter' | 'verse' | 'note'
>

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { data: projectData, error } = await supabase
    .from('projects')
    .select('id, slug, title, settings')
    .eq('slug', params.slug)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const projectRow = projectData as ProjectPublicRow | null

  if (!projectRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from('project_items')
    .select('order, book, chapter, verse, note')
    .eq('project_id', projectRow.id)
    .order('order', { ascending: true })

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const items = (itemRows ?? []) as ProjectItemPublicRow[]

  return NextResponse.json({
    project: projectRow,
    items,
  })
}
