import type { PresenterBootstrap, PresenterProjectWithItems } from './types'
import type { UpsertProjectInput } from './schema'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? 'Unexpected error')
  }
  return response.json() as Promise<T>
}

export async function fetchBootstrap() {
  return handleResponse<PresenterBootstrap>(
    await fetch('/api/presenter/bootstrap', { cache: 'no-store' }),
  )
}

export async function listProjects(search?: string) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`/api/presenter/projects${suffix}`, {
    cache: 'no-store',
  })
  return handleResponse<{ projects: PresenterBootstrap['projects'] }>(res)
}

export async function loadProject(projectId: string) {
  const res = await fetch(`/api/presenter/projects/${projectId}`, { cache: 'no-store' })
  return handleResponse<PresenterProjectWithItems>(res)
}

export async function createProject(payload: UpsertProjectInput) {
  const res = await fetch('/api/presenter/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<PresenterProjectWithItems>(res)
}

export async function updateProject(projectId: string, payload: UpsertProjectInput) {
  const res = await fetch(`/api/presenter/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<PresenterProjectWithItems>(res)
}

export async function deleteProject(projectId: string) {
  const res = await fetch(`/api/presenter/projects/${projectId}`, {
    method: 'DELETE',
  })
  return handleResponse<{ success: boolean }>(res)
}

