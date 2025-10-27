import { MutableRefObject, useEffect, useLayoutEffect, useState } from 'react'

type AutoFitOptions = {
  text: string
  containerRef: MutableRefObject<HTMLElement | null>
  contentRef: MutableRefObject<HTMLElement | null>
  baseSize: number
  minSize?: number
  lineHeight?: number
}

export function useAutoFitText({
  text,
  containerRef,
  contentRef,
  baseSize,
  minSize = 32,
  lineHeight = 1.35,
}: AutoFitOptions) {
  const [fontSize, setFontSize] = useState(baseSize)

  useLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    // Start from the requested baseSize (intended max) and step down by 2px
    // until it fits or we hit the minSize.
    const apply = () => {
      if (!container || !content) return
      let size = Math.max(baseSize, minSize)
      content.style.lineHeight = `${lineHeight}`

      const maxIterations = 40
      let iterations = 0
      content.style.fontSize = `${size}px`
      // Measure overflow and step down
      while (
        iterations < maxIterations &&
        size > minSize &&
        (content.scrollHeight > container.clientHeight || content.scrollWidth > container.clientWidth)
      ) {
        size -= 2
        content.style.fontSize = `${size}px`
        iterations += 1
      }
      // Ensure we never go below minSize
      if (size < minSize) size = minSize
      setFontSize(size)
    }

    // Debounce apply to avoid jank during rapid resize events
    let raf: number | null = null
    let timeout: number | null = null
    const runDebounced = () => {
      if (raf) cancelAnimationFrame(raf)
      if (timeout) window.clearTimeout(timeout)
      raf = requestAnimationFrame(() => {
        timeout = window.setTimeout(() => apply(), 80)
      }) as unknown as number
    }

    apply()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(runDebounced)
      observer.observe(container)
      // also observe content in case fonts/line-height change layout
      observer.observe(content)
      return () => {
        observer.disconnect()
        if (raf) cancelAnimationFrame(raf)
        if (timeout) window.clearTimeout(timeout)
      }
    }

    // fallback to window resize
    window.addEventListener('resize', runDebounced)
    return () => {
      window.removeEventListener('resize', runDebounced)
      if (raf) cancelAnimationFrame(raf)
      if (timeout) window.clearTimeout(timeout)
    }
  }, [text, baseSize, containerRef, contentRef, lineHeight, minSize])

  useEffect(() => {
    setFontSize((current) => Math.max(current, minSize))
  }, [minSize])

  return fontSize
}
