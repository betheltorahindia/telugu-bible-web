'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CoverflowProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  render: (item: T, active: boolean) => ReactNode;
  /** natural card width in px on large screens */
  baseWidth?: number;
  /** height / width */
  ratio?: number;
  label: string;
};

export function Coverflow<T>({
  items,
  keyOf,
  render,
  baseWidth = 420,
  ratio = 9 / 16,
  label,
}: CoverflowProps<T>) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(baseWidth);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setWidth(Math.max(200, Math.min(baseWidth, w * (w < 640 ? 0.78 : 0.52))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseWidth]);

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => Math.min(items.length - 1, Math.max(0, i + dir)));
    },
    [items.length],
  );

  const height = Math.round(width * ratio);
  const spacing = useMemo(() => width * 0.62, [width]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, moved: false };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      className="relative w-full select-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onWheel={(e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) + 8) go(e.deltaX > 0 ? 1 : -1);
      }}
    >
      <div
        className="relative mx-auto"
        style={{ height: height + 96, perspective: "1600px", perspectiveOrigin: "50% 45%" }}
      >
        <div
          className="absolute left-1/2 top-8"
          style={{ transformStyle: "preserve-3d", width: 0, height: 0 }}
        >
          {items.map((item, i) => {
            const offset = i - index;
            const abs = Math.abs(offset);
            if (abs > 3) return null;
            const active = offset === 0;
            return (
              <div
                key={keyOf(item)}
                onClick={() => !active && setIndex(i)}
                className="absolute cursor-pointer"
                style={{
                  width,
                  height,
                  marginLeft: -width / 2,
                  transformStyle: "preserve-3d",
                  transform: `translateX(${offset * spacing}px) translateZ(${-abs * 170}px) rotateY(${offset * -32}deg) scale(${1 - abs * 0.05})`,
                  zIndex: 50 - abs,
                  opacity: abs > 2 ? 0.25 : 1,
                  filter: active ? "none" : `saturate(0.7) brightness(${1 - abs * 0.16})`,
                  transition:
                    "transform 620ms cubic-bezier(0.22,1,0.36,1), opacity 500ms ease, filter 500ms ease",
                }}
              >
                {render(item, active)}
                {/* floor reflection */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-full h-14 w-full overflow-hidden opacity-20 blur-[2px]"
                  style={{
                    transform: "scaleY(-1)",
                    maskImage: "linear-gradient(to top, transparent, black)",
                    WebkitMaskImage: "linear-gradient(to top, transparent, black)",
                  }}
                >
                  <div className="h-full w-full">{render(item, false)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="sw-btn-ghost !p-3 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex max-w-[45vw] flex-wrap items-center justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={keyOf(item)}
              type="button"
              aria-label={`Go to item ${i + 1}`}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 26 : 8,
                background:
                  i === index
                    ? "linear-gradient(90deg, var(--sw-gold-deep), var(--sw-gold-soft))"
                    : "oklch(1 0 0 / 22%)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next"
          onClick={() => go(1)}
          disabled={index === items.length - 1}
          className="sw-btn-ghost !p-3 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}