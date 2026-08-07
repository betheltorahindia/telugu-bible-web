'use client'

/**
 * A CSS-3D rotating globe used as the transition / loading animation
 * into the Social world.
 */
export function GlobeLoader({ label = "Entering the world" }: { label?: string }) {
  const rings = Array.from({ length: 9 });
  const lats = Array.from({ length: 5 });

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div
        className="relative h-40 w-40 sm:h-52 sm:w-52"
        style={{ perspective: "900px" }}
        aria-hidden
      >
        {/* glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, oklch(0.83 0.14 85 / 55%), transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            animation: "sw-spin-globe 9s linear infinite",
          }}
        >
          {rings.map((_, i) => (
            <span
              key={`m${i}`}
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: "oklch(0.83 0.14 85 / 40%)",
                transform: `rotateY(${(180 / rings.length) * i}deg)`,
                boxShadow: "0 0 22px -8px oklch(0.83 0.14 85 / 70%)",
              }}
            />
          ))}
          {lats.map((_, i) => {
            const t = (i + 1) / (lats.length + 1);
            const scale = Math.sin(Math.PI * t);
            const y = Math.cos(Math.PI * t);
            return (
              <span
                key={`p${i}`}
                className="absolute left-1/2 top-1/2 rounded-full border"
                style={{
                  width: `${scale * 100}%`,
                  height: `${scale * 100}%`,
                  borderColor: "oklch(0.9 0.09 92 / 28%)",
                  transform: `translate(-50%, -50%) translateY(${(-y * 50).toFixed(2)}%) rotateX(90deg)`,
                }}
              />
            );
          })}
        </div>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, oklch(1 0 0 / 22%), transparent 42%)",
          }}
        />
        <div
          className="absolute -inset-6 rounded-full border border-dashed"
          style={{
            borderColor: "oklch(0.83 0.14 85 / 22%)",
            animation: "sw-orbit 14s linear infinite",
          }}
        >
          <span
            className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "var(--sw-gold, oklch(0.83 0.14 85))",
              boxShadow: "0 0 18px 4px oklch(0.83 0.14 85 / 70%)",
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="sw-gold-text text-lg font-semibold tracking-[0.28em] uppercase">
          {label}
        </p>
        <div className="mx-auto mt-4 h-px w-48 overflow-hidden bg-white/10">
          <span
            className="block h-full w-1/3"
            style={{
              background: "linear-gradient(90deg, transparent, oklch(0.9 0.09 92), transparent)",
              animation: "sw-orbit 0s",
              transform: "translateX(-100%)",
              animationName: "sw-loadbar",
            }}
          />
        </div>
      </div>

      <style>{`@keyframes sw-loadbar{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
      .sw-gold-text + div span{animation:sw-loadbar 1.4s ease-in-out infinite}`}</style>
    </div>
  );
}