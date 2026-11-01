'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatMessage, type ChatMessageData } from './ChatMessage'
import { Btn } from '@/components/ui/Btn'
import { useSession } from 'next-auth/react'

interface ChatPanelProps {
  streamId: string
  isCreator?: boolean
}

export function ChatPanel({ streamId, isCreator = false }: ChatPanelProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [scrolledUp, setScrolledUp] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
    setScrolledUp(false)
    setNewCount(0)
  }

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setScrolledUp(!isAtBottom)
  }

  const appendMessage = (msg: ChatMessageData) => {
    setMessages(prev => [...prev.slice(-199), msg])
    if (scrolledUp) setNewCount(n => n + 1)
    else scrollToBottom()
  }

  useEffect(() => {
    // Load initial messages
    fetch(`/api/streams/${streamId}/chat?limit=50`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setMessages(d.data.items.reverse())
      })
  }, [streamId])

  useEffect(() => {
    if (!scrolledUp) scrollToBottom()
  }, [messages.length])

  const sendMessage = async () => {
    if (!input.trim() || !session) return
    setSending(true)
    try {
      const res = await fetch(`/api/streams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: input.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        appendMessage(data.data)
        setInput('')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleDelete = async (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="font-bebas text-section tracking-widest text-muted">LIVE CHAT</span>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto py-2"
      >
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isOwn={msg.author.id === session?.user?.id}
            isMod={isCreator}
            onDelete={isCreator ? handleDelete : undefined}
          />
        ))}
      </div>

      {/* Scroll-to-bottom jump button */}
      {scrolledUp && newCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="mx-3 mb-1 rounded border border-border bg-surface py-1 font-bebas text-label tracking-widest text-muted transition-colors hover:text-text"
        >
          ↓ {newCount} NEW
        </button>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-border p-3">
        {session ? (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something…"
              maxLength={500}
              className="min-w-0 flex-1 rounded border border-border bg-card px-3 py-2 font-barlow text-body text-text placeholder:text-dim focus:border-cyan/50 focus:outline-none"
            />
            <Btn
              size="sm"
              variant="primary"
              onClick={sendMessage}
              disabled={!input.trim()}
              loading={sending}
            >
              SEND
            </Btn>
          </div>
        ) : (
          <p className="text-center font-barlow text-label text-muted">Sign in to chat</p>
        )}
      </div>
    </div>
  )
}
