'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, LoaderCircle } from 'lucide-react'

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

export default function NotificationToggle() {
  const [state, setState] = useState<NotificationState>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    getRegistration()
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (active) setState(subscription ? 'enabled' : 'disabled')
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
      const keyData = await keyResponse.json() as { publicKey?: string; error?: string }
      if (!keyResponse.ok || !keyData.publicKey) {
        throw new Error(keyData.error || 'Push notifications are not configured.')
      }

      const registration = await getRegistration()
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationKey(keyData.publicKey),
      })
      const response = await fetch('/api/notifications/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        await subscription.unsubscribe()
        throw new Error(result.error || 'Could not enable notifications for this device.')
      }
      setState('enabled')
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
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not turn off notifications.')
      await subscription.unsubscribe()
      setState('disabled')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Could not turn off notifications.')
    }
  }

  const isBusy = state === 'busy' || state === 'checking'
  const isEnabled = state === 'enabled'
  const isUnsupported = state === 'unsupported'

  return (
    <div className="notification-setting">
      <div className="notification-setting-copy">
        <span className="notification-setting-icon">
          {isEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </span>
        <span>
          <strong>Calendar reminders</strong>
          <small>Today’s and tomorrow’s calendar events, plus scheduled YouTube lives</small>
        </span>
      </div>
      <button
        type="button"
        className={`notification-switch ${isEnabled ? 'is-on' : ''}`}
        role="switch"
        aria-checked={isEnabled}
        aria-label="Calendar notifications"
        disabled={isBusy || isUnsupported}
        onClick={isEnabled ? disableNotifications : enableNotifications}
      >
        {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <span className="notification-switch-knob" />}
        <span className="sr-only">{isEnabled ? 'Turn notifications off' : 'Turn notifications on'}</span>
      </button>
      {isUnsupported && <p className="notification-setting-message">Push notifications are not supported on this browser.</p>}
      {message && <p className="notification-setting-message" role="status">{message}</p>}
    </div>
  )
}
