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
  minSize = 28,
  lineHeight = 1.35,
}: AutoFitOptions) {
  const [fontSize, setFontSize] = useState(baseSize)

  useLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const maxSize = Math.max(baseSize, minSize)

    const apply = () => {
      if (!container || !content) return
      let size = maxSize
      content.style.fontSize = `${size}px`
      content.style.lineHeight = `${lineHeight}`

      const maxIterations = 40
      let iterations = 0
      while (
        iterations < maxIterations &&
        size > minSize &&
        (content.scrollHeight > container.clientHeight * 0.9 || content.scrollWidth > container.clientWidth * 0.92)
      ) {
        size -= 2
        content.style.fontSize = `${size}px`
        iterations += 1
      }
      setFontSize(size)
    }

    apply()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(apply)
      observer.observe(container)
      return () => observer.disconnect()
    }

    return () => undefined
  }, [text, baseSize, containerRef, contentRef, lineHeight, minSize])

  useEffect(() => {
    setFontSize((current) => Math.max(current, minSize))
  }, [minSize])

  return fontSize
}
