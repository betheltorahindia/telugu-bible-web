export function GlobeLoader({ label = 'Entering the world' }: { label?: string }) {
  return (
    <div className="social-loading-content" role="status" aria-label={label}>
      <div className="social-loading-orbit" aria-hidden="true">
        <div className="social-loading-globe">
          <span className="social-loading-meridian social-loading-meridian-one" />
          <span className="social-loading-meridian social-loading-meridian-two" />
          <span className="social-loading-latitude social-loading-latitude-one" />
          <span className="social-loading-latitude social-loading-latitude-two" />
        </div>
        <span className="social-loading-orbit-dot" />
      </div>
      <div className="social-loading-caption">
        <span>{label}</span>
        <span className="social-loading-progress"><span /></span>
      </div>
    </div>
  )
}