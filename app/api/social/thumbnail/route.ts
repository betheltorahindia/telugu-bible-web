import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function isAllowedImageUrl(url: URL) {
  if (url.protocol !== 'https:' || url.username || url.password) return false

  const hostname = url.hostname.toLowerCase()
  const youtubeHost = hostname === 'i.ytimg.com' || hostname === 'img.youtube.com'
  if (youtubeHost) {
    return /^\/(?:vi|vi_webp)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname)
  }

  const spotifyHost = hostname === 'i.scdn.co' ||
    hostname === 'image-cdn-fa.spotifycdn.com' ||
    hostname === 'image-cdn-ak.spotifycdn.com'
  return spotifyHost && /^\/image\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9._-]+)*$/i.test(url.pathname)
}

async function readLimitedBody(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Thumbnail response was empty.')

  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel()
      throw new Error('Thumbnail response exceeded the size limit.')
    }
    chunks.push(value)
  }

  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

async function fetchAllowedImage(initialUrl: URL) {
  let url = initialUrl
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(url, {
      headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8' },
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      cache: 'force-cache',
    })
    if (![301, 302, 303, 307, 308].includes(response.status)) return response

    const location = response.headers.get('location')
    if (!location || redirectCount === 3) {
      await response.body?.cancel()
      throw new Error('Thumbnail provider returned an unsupported redirect.')
    }
    const nextUrl = new URL(location, url)
    if (!isAllowedImageUrl(nextUrl)) {
      await response.body?.cancel()
      throw new Error('Thumbnail provider redirected to an unsupported host.')
    }
    await response.body?.cancel()
    url = nextUrl
  }
  throw new Error('Thumbnail provider returned too many redirects.')
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('url')
  if (!source || source.length > 2048) {
    return NextResponse.json({ error: 'A valid thumbnail URL is required.' }, { status: 400 })
  }

  let imageUrl: URL
  try {
    imageUrl = new URL(source)
  } catch {
    return NextResponse.json({ error: 'A valid thumbnail URL is required.' }, { status: 400 })
  }
  if (!isAllowedImageUrl(imageUrl)) {
    return NextResponse.json({ error: 'This thumbnail host is not supported.' }, { status: 400 })
  }

  try {
    const response = await fetchAllowedImage(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'The thumbnail provider could not return this image.' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
    const contentLength = Number(response.headers.get('content-length'))
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType) ||
      (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES)) {
      return NextResponse.json({ error: 'The thumbnail response was not a supported image.' }, { status: 502 })
    }

    const body = await readLimitedBody(response)
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Social thumbnail proxy request failed.', error)
    return NextResponse.json({ error: 'The thumbnail could not be loaded right now.' }, { status: 502 })
  }
}