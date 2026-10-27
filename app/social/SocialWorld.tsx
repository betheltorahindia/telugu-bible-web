'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink, ListVideo, Play, Youtube } from 'lucide-react'
import { Coverflow } from '../../components/social/Coverflow'
import { SocialOrbs } from '../../components/social/SocialOrbs'
import { YOUTUBE, type SpotifyShow, type YouTubeVideo } from '../../lib/social/social-data'

export default function SocialWorld({
  videos,
  shows,
}: {
  videos: YouTubeVideo[]
  shows: SpotifyShow[]
}) {
  return (
    <div className="social-world sw-grain overflow-x-hidden pb-24">
      <Aurora />
      <h1 className="sr-only">Bethel Torah India Social</h1>

      <YouTubeSection videos={videos} />
      <SpotifySection shows={shows} />

      <footer className="relative z-10 mx-auto mt-28 max-w-4xl px-5 text-center sm:mt-36">
        <p className="text-[11px] uppercase tracking-[0.4em] opacity-55">Stay connected</p>
        <div className="mt-10">
          <SocialOrbs />
        </div>
        <p className="mt-16 text-xs opacity-40">
          © {new Date().getFullYear()} BethEl Torah India
        </p>
      </footer>
    </div>
  )
}

function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: 'rgba(178, 133, 55, 0.22)' }}
      />
      <div
        className="absolute bottom-[-220px] right-[-140px] h-[520px] w-[520px] rounded-full blur-[130px]"
        style={{ background: 'rgba(74, 62, 150, 0.30)' }}
      />
    </div>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="sw-section-title">
      <p>{kicker}</p>
      <h2>{title}</h2>
    </div>
  )
}

function YouTubeSection({ videos }: { videos: YouTubeVideo[] }) {
  return (
    <section className="sw-media-section relative z-10 mx-auto max-w-6xl">
      <div className="sw-section-header">
        <SectionTitle kicker="NOW STREAMING" title="Latest teachings" />
        <div className="sw-section-links">
          <a href={YOUTUBE.channelUrl} target="_blank" rel="noreferrer noopener" className="sw-btn sw-btn-hover text-sm">
            <Youtube className="h-4 w-4" /> YouTube channel <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a href={YOUTUBE.playlistsUrl} target="_blank" rel="noreferrer noopener" className="sw-btn-ghost text-sm">
            <ListVideo className="h-4 w-4" /> Playlists
          </a>
        </div>
      </div>

      {videos.length === 0 ? (
        <Empty message="Videos are taking a moment to appear. Please refresh shortly." />
      ) : (
        <Coverflow
          items={videos}
          label="Latest YouTube videos"
          baseWidth={460}
          ratio={9 / 16}
          keyOf={(v) => v.id}
          render={(v, active) => <VideoCard video={v} active={active} />}
        />
      )}
    </section>
  )
}

function VideoCard({ video, active }: { video: YouTubeVideo; active: boolean }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => {
        if (!active) e.preventDefault()
      }}
      className="group block h-full w-full overflow-hidden rounded-2xl"
      style={{
        border: '1px solid var(--sw-card-border)',
        boxShadow: 'var(--sw-card-shadow)',
        background: 'var(--sw-deep)',
      }}
    >
      <div className="relative h-full w-full">
        {/* plain <img> on purpose: remote YouTube thumbnails, no next.config change needed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 35%, var(--sw-image-shade))' }}
        />
        {video.duration ? (
          <span className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium tracking-wide">
            {video.duration}
          </span>
        ) : null}
        <span
          className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full opacity-0 transition-all duration-500 group-hover:opacity-100"
          style={{ background: '#e0322a', boxShadow: '0 0 40px 6px rgba(224,50,42,0.55)' }}
        >
          <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-2 text-left text-[13px] font-medium leading-snug sm:text-sm">
            {video.title}
          </p>
          {video.published ? (
            <p className="mt-1 text-left text-[11px] opacity-60">{video.published}</p>
          ) : null}
        </div>
      </div>
    </a>
  )
}

function SpotifySection({ shows }: { shows: SpotifyShow[] }) {
  const [open, setOpen] = useState(false)
  const latest = shows.slice(0, 10)

  return (
    <section className="sw-media-section relative z-10 mx-auto max-w-6xl">
      <div className="sw-section-header">
        <SectionTitle kicker="LISTEN ANYWHERE" title="Podcasts" />
      </div>

      {shows.length === 0 ? (
        <Empty message="Podcasts are taking a moment to appear. Please refresh shortly." />
      ) : (
        <Coverflow
          items={latest}
          label="Spotify podcast shows"
          baseWidth={340}
          ratio={1}
          keyOf={(s) => s.id}
          render={(s, active) => <ShowCard show={s} active={active} />}
        />
      )}

      <div className="sw-podcast-actions">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="sw-btn sw-btn-hover text-sm"
        >
          <SpotifyGlyph />
          {open ? 'Hide all podcasts' : 'Show all podcasts'}
          <ChevronDown
            className="h-4 w-4 transition-transform duration-500"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        <div
          className="w-full max-w-4xl overflow-hidden transition-all duration-700"
          style={{
            maxHeight: open ? 620 : 0,
            opacity: open ? 1 : 0,
            transform: open ? 'none' : 'translateY(-12px)',
          }}
        >
          <div className="sw-glass sw-scroll max-h-[560px] overflow-y-auto rounded-3xl p-3 sm:p-5">
            <ul className="grid gap-3 sm:grid-cols-2">
              {shows.map((show) => (
                <li key={show.id}>
                  <a
                    href={show.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: 'var(--sw-list-row)',
                      border: '1px solid var(--sw-card-border)',
                    }}
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/40">
                      {show.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={show.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 text-left text-sm leading-snug">
                      <span className="line-clamp-2">{show.title}</span>
                    </span>
                    <ExternalLink
                      className="h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-90"
                      style={{ color: 'var(--sw-gold)' }}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function ShowCard({ show, active }: { show: SpotifyShow; active: boolean }) {
  return (
    <a
      href={show.url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => {
        if (!active) e.preventDefault()
      }}
      className="group block h-full w-full overflow-hidden rounded-3xl"
      style={{
        border: '1px solid var(--sw-card-border)',
        boxShadow: 'var(--sw-card-shadow)',
        background: 'var(--sw-deep)',
      }}
    >
      <div className="relative h-full w-full">
        {show.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={show.thumbnail}
            alt={show.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center opacity-50">
            <SpotifyGlyph />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 35%, var(--sw-image-shade))' }}
        />
        <span
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full transition-transform duration-500 group-hover:scale-110"
          style={{
            background: '#1ed760',
            color: '#0b2417',
            boxShadow: '0 0 30px 4px rgba(30,215,96,0.45)',
          }}
        >
          <SpotifyGlyph />
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-2 text-left text-[13px] font-medium leading-snug sm:text-sm">
            {show.title}
          </p>
        </div>
      </div>
    </a>
  )
}

function SpotifyGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m4.5 14.4a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.55-1.04 8.47-.59 11.63 1.34a.75.75 0 0 1 .28 1.03m1.2-2.9a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.96-1.4a.94.94 0 1 1-.54-1.8c4.36-1.31 9.78-.67 13.49 1.6a.94.94 0 0 1 .3 1.29m.1-3.02c-3.87-2.3-10.26-2.51-13.96-1.39a1.12 1.12 0 1 1-.65-2.15c4.25-1.29 11.3-1.04 15.76 1.6a1.12 1.12 0 1 1-1.15 1.94" />
    </svg>
  )
}

function Empty({ message }: { message: string }) {
  return <div className="mx-auto max-w-md px-5 text-center text-sm opacity-70">{message}</div>
}