import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, BellRing, ChevronRight, Info, Settings2 } from 'lucide-react'
import NotificationToggle from '../../components/NotificationToggle'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your Bethel Torah India app settings.',
}

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <header className="settings-page-heading">
        <span className="settings-page-icon"><Settings2 className="h-5 w-5" /></span>
        <div>
          <p className="settings-page-eyebrow">BETHEL TORAH INDIA</p>
          <h1>Settings</h1>
          <p>Manage your experience and learn about the community.</p>
        </div>
      </header>

      <section className="settings-page-card" aria-labelledby="settings-reminders-title">
        <div className="settings-card-heading">
          <span className="settings-page-icon"><BellRing className="h-5 w-5" /></span>
          <div>
            <h2 id="settings-reminders-title">Calendar reminders</h2>
            <p>Choose whether this device receives reminders about upcoming holidays and readings.</p>
          </div>
        </div>
        <NotificationToggle />
      </section>

      <Link href="/settings/about" className="settings-about-link">
        <span className="settings-page-icon"><Info className="h-5 w-5" /></span>
        <span>
          <strong>About our community</strong>
          <small>Meet our leadership, explore our story and get in touch</small>
        </span>
        <span className="settings-about-action">Explore <ArrowUpRight className="h-4 w-4" /></span>
        <ChevronRight className="settings-about-chevron h-5 w-5" />
      </Link>
    </div>
  )
}
