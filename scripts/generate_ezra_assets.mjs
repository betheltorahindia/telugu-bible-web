import { readFile, writeFile } from 'node:fs/promises'
import { inflateRawSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const source = new URL('../bolt-the-robot-robot.bexode', import.meta.url)
const svgOutput = new URL('../public/ezra.svg', import.meta.url)
const pngOutput = new URL('../public/ezra-notification.png', import.meta.url)
const bytes = await readFile(source)

if (bytes.subarray(0, 4).toString() !== 'BX01') {
  throw new Error('The Ezra mascot file has an unsupported Bexode header.')
}

const mascot = JSON.parse(inflateRawSync(bytes.subarray(4), { maxOutputLength: 2_000_000 }).toString())
if (mascot._fmt !== 'bexode_v2' || !Array.isArray(mascot.objects)) {
  throw new Error('The Ezra mascot file has an unsupported Bexode format.')
}

const objects = new Map(mascot.objects.map((object) => [object.id, object]))
const definitions = []

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function number(value) {
  return Number(value).toString()
}

function getTransform(object, skipRotation = false) {
  const [x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1] = object.t ?? []
  const parts = []
  if (x || y) parts.push(`translate(${number(x)} ${number(y)})`)
  if (!skipRotation && rotation) parts.push(`rotate(${number(rotation)})`)
  if (scaleX !== 1 || scaleY !== 1) parts.push(`scale(${number(scaleX)} ${number(scaleY)})`)
  return parts.join(' ')
}

function getPaint(object, index) {
  const styles = object.s ?? {}
  const fill = styles.fill
  const attributes = []

  if (fill?.type === 'Solid') {
    attributes.push(`fill="${escapeXml(fill.color)}"`)
    if (fill.opacity !== undefined && fill.opacity !== 1) {
      attributes.push(`fill-opacity="${number(fill.opacity)}"`)
    }
  } else if (fill?.type === 'RadialGradient') {
    const id = `ezra-gradient-${index}`
    const [cx = 0.5, cy = 0.5] = fill.center ?? []
    const stops = (fill.stops ?? []).map((stop) =>
      `<stop offset="${number(stop.offset * 100)}%" stop-color="${escapeXml(stop.color)}" stop-opacity="${number(stop.opacity ?? 1)}"/>`,
    ).join('')
    definitions.push(
      `<radialGradient id="${id}" cx="${number(cx)}" cy="${number(cy)}" r="${number(fill.radius ?? 0.5)}">${stops}</radialGradient>`,
    )
    attributes.push(`fill="url(#${id})"`)
    if (fill.opacity !== undefined && fill.opacity !== 1) {
      attributes.push(`fill-opacity="${number(fill.opacity)}"`)
    }
  } else {
    attributes.push('fill="none"')
  }

  const stroke = styles.stroke
  if (stroke?.isEnabled !== false) {
    if (stroke?.color) attributes.push(`stroke="${escapeXml(stroke.color)}"`)
    if (stroke?.width) attributes.push(`stroke-width="${number(stroke.width)}"`)
    if (stroke?.opacity !== undefined && stroke.opacity !== 1) {
      attributes.push(`stroke-opacity="${number(stroke.opacity)}"`)
    }
  }
  return attributes.join(' ')
}

function renderShape(object, index) {
  if (object.id === 'bg' || object.id === 'floor' || object.id === 'ground_shadow') return ''
  const geometry = object.g ?? {}
  const width = geometry.width ?? 0
  const height = geometry.height ?? 0
  const paint = getPaint(object, index)

  if (geometry.type === 'Rectangle') {
    const radius = Array.isArray(geometry.cornerRadius)
      ? Math.max(...geometry.cornerRadius)
      : geometry.cornerRadius ?? 0
    return `<rect x="${number(-width / 2)}" y="${number(-height / 2)}" width="${number(width)}" height="${number(height)}" rx="${number(radius)}" ${paint}/>`
  }
  if (geometry.type === 'Ellipse') {
    return `<ellipse cx="0" cy="0" rx="${number(width / 2)}" ry="${number(height / 2)}" ${paint}/>`
  }
  if (geometry.type === 'Path') {
    return `<path d="${escapeXml(geometry.data)}" transform="translate(${number(-width / 2)} ${number(-height / 2)})" ${paint}/>`
  }
  return ''
}

const wave = mascot.animations.find((animation) => animation.name === 'Wave bye')
const pawIndex = mascot.objects.findIndex((object) => object.id === 'paw')
const waveTrack = wave?.t?.find(([objectIndex, property]) => objectIndex === pawIndex && property === 2)
if (!wave || !waveTrack || wave.d <= 0) {
  throw new Error('The Ezra mascot wave animation could not be found.')
}

const waveFrames = waveTrack[2]
const waveKeyframes = waveFrames.map(([time, angle]) =>
  `${number((time / wave.d) * 100)}% { rotate: ${number(angle)}deg; }`,
).join('')

function renderObject(id, index) {
  const object = objects.get(id)
  if (!object) throw new Error(`Mascot object "${id}" is missing.`)

  const attributes = [`id="${escapeXml(id)}"`]
  const transform = getTransform(object, id === 'paw')
  if (transform) attributes.push(`transform="${transform}"`)

  if (object.type === 'Shape') {
    return `<g ${attributes.join(' ')}>${renderShape(object, index)}</g>`
  }

  const children = object.x?.children ?? []
  if (object.type === 'Group' && object.x?.clipContent) {
    const width = object.x.width ?? object.g?.width ?? 0
    const height = object.x.height ?? object.g?.height ?? 0
    const clipId = `ezra-clip-${index}`
    definitions.push(
      `<clipPath id="${clipId}"><rect x="${number(-width / 2)}" y="${number(-height / 2)}" width="${number(width)}" height="${number(height)}"/></clipPath>`,
    )
    attributes.push(`clip-path="url(#${clipId})"`)
  }

  const renderedChildren = children.map((child, childIndex) =>
    renderObject(child, `${index}-${childIndex}`),
  ).join('')
  if (id === 'paw') {
    return `<g ${attributes.join(' ')}><g id="ezra-paw-wave">${renderedChildren}</g></g>`
  }
  return `<g ${attributes.join(' ')}>${renderedChildren}</g>`
}

const styles = `<style>
#ezra-paw-wave { transform-box: fill-box; transform-origin: 50% 0%; animation: ezra-wave ${number(wave.d)}s ease-in-out infinite; }
@keyframes ezra-wave { ${waveKeyframes} }
@media (prefers-reduced-motion: reduce) { #ezra-paw-wave { animation: none; } }
</style>`
const illustration = renderObject('card', 0)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${number(mascot.w)}" height="${number(mascot.h)}" viewBox="0 0 ${number(mascot.w)} ${number(mascot.h)}" role="img" aria-labelledby="ezra-title ezra-description"><title id="ezra-title">Ezra the robot</title><desc id="ezra-description">A bright blue and teal robot waving hello.</desc><defs>${definitions.join('')}</defs>${styles}${illustration}</svg>`

await writeFile(svgOutput, svg)
await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(fileURLToPath(pngOutput))
console.log('Generated public/ezra.svg and public/ezra-notification.png from the Bexode mascot.')
