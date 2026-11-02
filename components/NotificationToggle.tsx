'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Bell, BellOff, BookOpenCheck, CalendarDays, Clock3, LoaderCircle } from 'lucide-react'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '../lib/notifications/preferences'

type NotificationState = 'checking' | 'disabled' | 'enabled' | 'unsupported' | 'busy' | 'error'

function decodeApplicationKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

async function getRegistration() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported by this browser.')
  }
  return navigator.serviceWorker.ready
}

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  const result = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(result.error || 'The notification request could not be completed.')
  return result
}

export default function NotificationToggle() {
  const [state, setState] = useState<NotificationState>('checking')
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    let active = true
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    getRegistration()
      .then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          if (active) setState('disabled')
          return
        }
        const params = new URLSearchParams({ endpoint: subscription.endpoint })
        const response = await fetch(`/api/notifications/subscription?${params}`, { cache: 'no-store' })
        const result = await readJson<{ preferences?: NotificationPreferences }>(response)
        if (active) {
          setPreferences(result.preferences ?? DEFAULT_NOTIFICATION_PREFERENCES)
          setState('enabled')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState('error')
          setMessage(error instanceof Error ? error.message : 'Could not check notification settings.')
        }
      })
    return () => { active = false }
  }, [])

  const enableNotifications = async () => {
    setState('busy')
    setMessage('')
    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error(permission === 'denied'
          ? 'Notifications are blocked in your browser settings.'
          : 'Notification permission was not granted.')
      }

      const keyResponse = await fetch('/api/notifications/public-key')
      const keyData = await readJson<{ publicKey?: string }>(keyResponse)
      if (!keyData.publicKey) throw new Error('Push notifications are not configured.')

      const registration = await getRegistration()
      const subscription = await registration.pushManager.getSubscription() ??
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeApplicationKey(keyData.publicKey),
        })
      const response = await fetch('/api/notifications/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          preferences,
        }),
      })
      await readJson(response)
      setState('enabled')
      setSaved(true)
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Could not enable notifications.')
    }
  }

  const disableNotifications = async () => {
    setState('busy')
    setMessage('')
    try {
      const registration = await getRegistration()
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        setState('disabled')
        return
      }
      const response = await fetch('/api/notifications/subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })
      await readJson(response)
      await subscription.unsubscribe()
      setState('disabled')
      setMessage('')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Could not turn off notifications.')
    }
  }

  const savePreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState('busy')
    setMessage('')
    try {
      const subscription = await (await getRegistration()).pushManager.getSubscription()
      if (!subscription) throw new Error('This device is not subscribed. Turn notifications on again.')
      const response = await fetch('/api/notifications/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint, preferences }),
      })
      await readJson(response)
      setState('enabled')
      setSaved(true)
      setMessage('Your reminder preferences are saved for this device.')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Could not save your reminder preferences.')
    }
  }

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => {
    setPreferences((current) => ({ ...current, [key]: value }))
    setSaved(false)
    setMessage('')
  }

  const updatePrayerTime = (key: keyof NotificationPreferences['prayerTimes'], value: string) => {
    setPreferences((current) => ({
      ...current,
      prayerTimes: { ...current.prayerTimes, [key]: value },
    }))
    setSaved(false)
    setMessage('')
  }

  const updatePsalmTime = (index: number, value: string) => {
    setPreferences((current) => ({
      ...current,
      psalmTimes: current.psalmTimes.map((time, itemIndex) => itemIndex === index ? value : time) as NotificationPreferences['psalmTimes'],
    }))
    setSaved(false)
    setMessage('')
  }

  const isBusy = state === 'busy' || state === 'checking'
  const isEnabled = state === 'enabled' || (state === 'busy' && Notification.permission === 'granted')
  const isUnsupported = state === 'unsupported'

  return (
    <div className="notification-setting">
      <div className="notification-setting-top">
        <div className="notification-setting-copy">
          <span className="notification-setting-icon">
            {isEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </span>
          <span>
            <strong>Device reminders</strong>
            <small>Calendar events, daily prayers, and three invitations to read Psalms</small>
          </span>
        </div>
        <button
          type="button"
          className={`notification-switch ${isEnabled ? 'is-on' : ''}`}
          role="switch"
          aria-checked={isEnabled}
          aria-label="Device notifications"
          disabled={isBusy || isUnsupported}
          onClick={isEnabled ? disableNotifications : enableNotifications}
        >
          {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <span className="notification-switch-knob" />}
          <span className="sr-only">{isEnabled ? 'Turn notifications off' : 'Turn notifications on'}</span>
        </button>
      </div>
      {isEnabled && (
        <form className="notification-preferences" onSubmit={savePreferences}>
          <label className="notification-preference-toggle">
            <CalendarDays aria-hidden="true" />
            <span><strong>Calendar &amp; live events</strong><small>Jewish dates, holidays, Torah readings, and scheduled lives</small></span>
            <input
              type="checkbox"
              checked={preferences.calendar}
              onChange={(event) => updatePreference('calendar', event.target.checked)}
            />
          </label>

          <div className="notification-preference-group">
            <label className="notification-preference-toggle">
              <Bell aria-hidden="true" />
              <span><strong>Daily prayer reminders</strong><small>Four gentle reminders, in this device’s local time</small></span>
              <input
                type="checkbox"
                checked={preferences.prayers}
                onChange={(event) => updatePreference('prayers', event.target.checked)}
              />
            </label>
            {preferences.prayers && (
              <div className="notification-time-grid">
                {([
                  ['morning', 'Morning'],
                  ['afternoon', 'Afternoon'],
                  ['evening', 'Evening'],
                  ['night', 'Night'],
                ] as const).map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      type="time"
                      step={900}
                      value={preferences.prayerTimes[key]}
                      onChange={(event) => updatePrayerTime(key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="notification-preference-group">
            <label className="notification-preference-toggle">
              <BookOpenCheck aria-hidden="true" />
              <span><strong>Psalm reading invitations</strong><small>Three daily reminders to pause for five Psalms</small></span>
              <input
                type="checkbox"
                checked={preferences.psalms}
                onChange={(event) => updatePreference('psalms', event.target.checked)}
              />
            </label>
            {preferences.psalms && (
              <div className="notification-time-grid notification-psalm-times">
                {preferences.psalmTimes.map((time, index) => (
                  <label key={index}>
                    <span><Clock3 aria-hidden="true" /> Pause {index + 1}</span>
                    <input
                      type="time"
                      step={900}
                      value={time}
                      onChange={(event) => updatePsalmTime(index, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="notification-preference-footer">
            <small>Times use this device’s local time. Changes take effect after saving.</small>
            <button type="submit" disabled={isBusy || saved}>
              {isBusy ? 'Saving…' : saved ? 'Saved' : 'Save preferences'}
            </button>
          </div>
        </form>
      )}
      {isUnsupported && <p className="notification-setting-message">Push notifications are not supported on this browser.</p>}
      {message && <p className="notification-setting-message" role="status">{message}</p>}
    </div>
  )
}
