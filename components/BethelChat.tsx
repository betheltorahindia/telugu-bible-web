'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { Send, X } from 'lucide-react'
import EzraMascot from './EzraMascot'

type ChatMessage = {
  from: 'assistant' | 'visitor'
  text: string
  href?: string
  linkLabel?: string
  isError?: boolean
}

const welcomeMessage: ChatMessage = {
  from: 'assistant',
  text: 'Hi, I’m Ezra, your friendly guide to this app, Torah, Judaism, and Noahide learning. What can I help you find?',
}

function getAnswer(question: string): ChatMessage {
  const normalized = question.toLowerCase()

  if (/guide me|what all|what is (in|on) this app|what can i (do|find)|all (the )?(pages|features)|what pages/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Here’s a quick tour:\n- [Tanach](/tanach) — read the Bible by book and chapter.\n- [Study](/study) — browse study collections and lessons.\n- [Prayers](/prayers) — explore daily prayer collections.\n- [Calendar](/calendar) — see Hebrew dates, holidays, Rosh Chodesh, and Torah readings.\n- [Social](/social) — find community updates, videos, and podcasts.\n- [Search](/search) — look for Scripture and app content.\n- [Settings](/settings) — manage preferences and device notifications.',
    }
  }
  if (/prayer/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Browse the prayer collections for morning, afternoon, evening, and night. Open a collection to explore its sections and available language or transliteration options.',
      href: '/prayers',
      linkLabel: 'Open Prayers',
    }
  }
  if (/settings|notification|reminder|alert/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Settings contains app preferences and device notification controls. Notifications require browser permission and a supported device.',
      href: '/settings',
      linkLabel: 'Open Settings',
    }
  }
  if (/search|find/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Use Search to look for Scripture passages and app content.',
      href: '/search',
      linkLabel: 'Open Search',
    }
  }
  if (/tanach|bible|scripture|book|chapter|read|study/.test(normalized)) {
    return {
      from: 'assistant',
      text: 'Use Tanach to read Scripture by book and chapter, or Study to browse its study collections. Reading tools include language, text size, and parallel reading.',
      href: /study/.test(normalized) ? '/study' : '/tanach',
      linkLabel: /study/.test(normalized) ? 'Open Study' : 'Open Tanach',
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

function renderInline(text: string, keyPrefix: string, closeChat: () => void) {
  const tokenPattern = /(\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!_)_([^_\n]+)_(?!_)|`([^`]+)`)/g
  const parts: ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  let tokenIndex = 0

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index))
    const key = `${keyPrefix}-${tokenIndex++}`
    if (match[2] && match[3]) {
      const href = match[3]
      if (href.startsWith('/') && !href.startsWith('//')) {
        parts.push(<Link key={key} href={href} onClick={closeChat}>{match[2]}</Link>)
      } else if (/^https:\/\//i.test(href)) {
        parts.push(<a key={key} href={href} target="_blank" rel="noreferrer noopener">{match[2]}</a>)
      } else {
        parts.push(match[2])
      }
    } else if (match[4] || match[5]) {
      parts.push(<strong key={key}>{match[4] || match[5]}</strong>)
    } else if (match[6] || match[7]) {
      parts.push(<em key={key}>{match[6] || match[7]}</em>)
    } else if (match[8]) {
      parts.push(<code key={key}>{match[8]}</code>)
    }
    cursor = tokenPattern.lastIndex
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

function renderMessage(text: string, closeChat: () => void) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | undefined

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(' '), `p-${blocks.length}`, closeChat)}</p>)
      paragraph = []
    }
  }
  const flushList = () => {
    if (listItems.length && listType) {
      const List = listType
      blocks.push(
        <List key={`list-${blocks.length}`}>
          {listItems.map((item, index) => (
            <li key={index}>{renderInline(item, `list-${blocks.length}-${index}`, closeChat)}</li>
          ))}
        </List>,
      )
      listItems = []
      listType = undefined
    }
  }

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    const item = line.match(/^\s*(?:(?:[-*])|(?:\d+[.)]))\s+(.+)$/)
    if (!line.trim()) {
      flushParagraph()
      flushList()
    } else if (heading) {
      flushParagraph()
      flushList()
      blocks.push(<strong className="bethel-chat-subheading" key={`h-${blocks.length}`}>{renderInline(heading[1], `h-${blocks.length}`, closeChat)}</strong>)
    } else if (item) {
      flushParagraph()
      const nextType = /^\s*\d+[.)]/.test(line) ? 'ol' : 'ul'
      if (listType && listType !== nextType) flushList()
      listType = nextType
      listItems.push(item[1])
    } else {
      flushList()
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

export default function BethelChat() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [guideConfigured, setGuideConfigured] = useState<boolean | null>(null)
  const [browserOnline, setBrowserOnline] = useState(true)
  const [connectionChecked, setConnectionChecked] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const onlineAvailable = guideConfigured === true && browserOnline

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, sending])

  useEffect(() => {
    let active = true
    const checkGuide = () => {
      fetch('/api/chat', { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) throw new Error('Could not check online guide.')
          return response.json() as Promise<{ onlineAvailable?: boolean }>
        })
        .then((result) => {
          if (active) setGuideConfigured(Boolean(result.onlineAvailable))
        })
        .catch(() => {
          if (active) setGuideConfigured(null)
        })
        .finally(() => {
          if (active) setConnectionChecked(true)
        })
    }
    const updateConnection = () => {
      const online = navigator.onLine
      setBrowserOnline(online)
      if (online) checkGuide()
      else setConnectionChecked(true)
    }
    updateConnection()
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
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

    if (!browserOnline || !navigator.onLine || guideConfigured === false) {
      setMessages((current) => [...current, getAnswer(text)])
      return
    }

    setSending(true)
    try {
      let lastError = -1
      for (let index = conversation.length - 1; index >= 0; index -= 1) {
        if (conversation[index].isError) {
          lastError = index
          break
        }
      }
      const context = (lastError >= 0 ? conversation.slice(lastError + 1) : conversation.slice(1)).slice(-8)
      while (context[0]?.from === 'assistant') context.shift()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: context.map((message) => ({
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
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The online guide could not connect.'
      setMessages((current) => [
        ...current.slice(0, -1),
        {
          from: 'assistant',
          isError: true,
          text: `I couldn’t reach online answers just now: ${reason} Your question is still ready to retry. I can also help you find your way around the app.`,
        },
      ])
      setQuestion(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bethel-chat">
      {open && (
        <section className="bethel-chat-panel" aria-label="Chat with Ezra">
          <header className="bethel-chat-header">
            <EzraMascot className="bethel-chat-avatar" />
            <span>
              <strong>Ezra</strong>
              <small>
                {connectionChecked && onlineAvailable
                ? 'Online answers enabled'
                : !browserOnline
                  ? 'Offline app guide · come online for more answers'
                  : connectionChecked
                    ? guideConfigured === false
                      ? 'App guide · online answers are not enabled'
                      : 'App guide · online answers are temporarily unavailable'
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
                <div className="bethel-chat-message-content">{renderMessage(message.text, () => setOpen(false))}</div>
                {message.href && (
                  <Link href={message.href} onClick={() => setOpen(false)}>
                    {message.linkLabel}
                  </Link>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="bethel-chat-form" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="bethel-chat-question">Ask Ezra</label>
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
                : guideConfigured === false
                  ? 'The app guide is available. Online answers are not enabled on this site.'
                  : 'The app guide is available. Online answers are temporarily unavailable.'}
            </p>
          )}
        </section>
      )}
      {connectionChecked && !browserOnline && (
        <div className="bethel-chat-offline-note" role="status" aria-live="polite">
          <EzraMascot className="bethel-chat-offline-mascot" />
          <span><strong>Hi, I’m Ezra.</strong> You’re offline, but I can still help you find your way around the app.</span>
        </div>
      )}
      <button
        type="button"
        className="bethel-chat-toggle"
        aria-expanded={open}
        aria-label={open ? 'Close chat with Ezra' : 'Open chat with Ezra'}
        onClick={() => setOpen((value) => !value)}
      >
        <EzraMascot className="bethel-chat-mascot" />
      </button>
    </div>
  )
}
