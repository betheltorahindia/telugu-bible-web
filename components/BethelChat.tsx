'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, X } from 'lucide-react'

type ChatMessage = {
  from: 'assistant' | 'visitor'
  text: string
  href?: string
  linkLabel?: string
}

const welcomeMessage: ChatMessage = {
  from: 'assistant',
  text: 'Hello! When online, I can answer questions about Torah, Judaism, Noahide learning, and help you explore this app. If you’re offline, I can still guide you around the app. What would you like to know?',
}

function getAnswer(question: string): ChatMessage {
  const normalized = question.toLowerCase()

  if (/tanach|bible|scripture|book|chapter|read|study/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Read the Telugu Tanach, browse its books and chapters, or use language, zoom, and parallel-reading tools while reading.',
      href: '/tanach',
      linkLabel: 'Open Tanach',
    }
  }
  if (/calendar|holiday|rosh|chodesh|date|parasha|reading/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'The calendar shows Hebrew and Gregorian dates, Rosh Chodesh, holidays, and weekly Torah readings. Select a date to see its details.',
      href: '/calendar',
      linkLabel: 'Open calendar',
    }
  }
  if (/social|youtube|video|podcast|spotify|instagram|facebook|whatsapp|community/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'The Social page has the latest teachings, podcasts, and links to Bethel Torah India’s social profiles.',
      href: '/social',
      linkLabel: 'Visit Social',
    }
  }
  if (/notification|reminder|alert/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'You can manage opt-in calendar reminders for this device in Settings. Notifications require browser permission and a supported device.',
      href: '/settings',
      linkLabel: 'Open Settings',
    }
  }
  if (/contact|address|email|leader|ovadia|ravi kumar|where/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Bethel Torah India is part of the Noahide Academy community. Contact Rosh Yeshiva Sir Ovadia Ravi Kumar at pas.obadiah@gmail.com, or visit the About page for the address and more information.',
      href: '/settings/about',
      linkLabel: 'About and contact',
    }
  }
  if (/about|bethel|who are you|what is this app/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Bethel Torah India | Telugu is a community for Scripture-based learning, connection, and shared teachings.',
      href: '/settings/about',
      linkLabel: 'About Bethel Torah India',
    }
  }

  if (/torah|judaism|jewish|noahide|noah|mitzvah|mitzvot|talmud|rabbi|shabbat|sabbath|kosher|kashrut|synagogue|hebrew|israel|tanakh|scripture|bible/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'I’m offline, so I can’t provide a broader answer right now. Please come online and ask again about Torah, Judaism, or Noahide learning. I can still help you navigate the app while offline.',
    }
  }

  return {
    from: 'assistant',
    text: 'I can help with Torah, Judaism, Noahide learning, Bethel Torah India, and finding your way around this app. Please ask about one of those topics.',
  }
}

export default function BethelChat() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [serverConfigured, setServerConfigured] = useState(false)
  const [browserOnline, setBrowserOnline] = useState(true)
  const [connectionChecked, setConnectionChecked] = useState(false)
  const [sending, setSending] = useState(false)
  const onlineAvailable = serverConfigured && browserOnline

  useEffect(() => {
    let active = true
    const updateConnection = () => setBrowserOnline(navigator.onLine)
    updateConnection()
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    fetch('/api/chat')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not check online guide.')
        return response.json() as Promise<{ onlineAvailable?: boolean }>
      })
      .then((result) => {
        if (active) setServerConfigured(Boolean(result.onlineAvailable))
      })
      .catch(() => {
        if (active) setServerConfigured(false)
      })
      .finally(() => {
        if (active) setConnectionChecked(true)
      })
    return () => {
      active = false
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = question.trim()
    if (!text || sending) return
    const visitorMessage: ChatMessage = { from: 'visitor', text }
    const conversation = [...messages, visitorMessage]
    setMessages(conversation)
    setQuestion('')

    if (!onlineAvailable || !navigator.onLine) {
      setMessages((current) => [...current, getAnswer(text)])
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation
            .slice(1)
            .slice(-10)
            .map((message) => ({
              role: message.from === 'visitor' ? 'user' : 'assistant',
              text: message.text,
            })),
        }),
      })
      const result = await response.json() as { answer?: string; error?: string }
      const answer = result.answer
      if (!response.ok || !answer) {
        throw new Error(result.error || 'The online guide is unavailable right now.')
      }
      setMessages((current) => [...current, { from: 'assistant', text: answer }])
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: 'assistant',
          text: `${getAnswer(text).text} The online guide could not connect. Please check your connection or try again later.`,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bethel-chat">
      {open && (
        <section className="bethel-chat-panel" aria-label="Chat with Bethel">
          <header className="bethel-chat-header">
            <span className="bethel-chat-mark"><MessageCircle className="h-4 w-4" /></span>
            <span>
              <strong>Chat with Bethel</strong>
              <small>
                {connectionChecked && onlineAvailable
                ? 'Online Torah & app guide'
                : !browserOnline
                  ? 'Offline app guide · come online for more answers'
                  : connectionChecked
                    ? 'App guide · online answers are not configured'
                    : 'Checking online guide…'}
              </small>
            </span>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="bethel-chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`bethel-chat-message is-${message.from}`} key={`${message.from}-${index}`}>
                <p>{message.text}</p>
                {message.href && (
                  <Link href={message.href} onClick={() => setOpen(false)}>
                    {message.linkLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <form className="bethel-chat-form" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="bethel-chat-question">Ask Bethel</label>
            <input
              id="bethel-chat-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={onlineAvailable ? 'Ask about Torah, Judaism, Noahides…' : 'Ask about the app or religious topics…'}
              maxLength={1200}
            />
            <button type="submit" aria-label="Send message" disabled={!question.trim() || sending}>
              <Send className="h-4 w-4" />
            </button>
          </form>
          {sending && <p className="bethel-chat-status" role="status">Preparing an answer…</p>}
          {connectionChecked && !onlineAvailable && (
            <p className="bethel-chat-status">
              {!browserOnline
                ? 'The offline guide can help you navigate the app. Come online for broader Torah, Judaism, and Noahide answers.'
                : 'The app guide is available. Online answers need to be enabled by the site administrator.'}
            </p>
          )}
        </section>
      )}
      <button
        type="button"
        className="bethel-chat-toggle"
        aria-expanded={open}
        aria-label={open ? 'Close Chat with Bethel' : 'Chat with Bethel'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span>{open ? 'Close chat' : 'Chat with Bethel'}</span>
      </button>
    </div>
  )
}
