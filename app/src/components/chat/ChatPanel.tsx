'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { Btn } from '@/components/ui/Btn'
import { GiftPanel } from '@/components/payment/GiftPanel'
import { connectSocket } from '@/lib/socket-client'
import type { Socket } from 'socket.io-client'

interface ChatMessage {
  id: string
  body: string
  lang: string
  isPinned: boolean
  createdAt: string
  isAura?: boolean
  author: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    tier: string | null
  }
}

interface Props {
  streamId: string
  toUserId?: string
  creatorName?: string
}

const AURA_ID = '__aura__'

export function ChatPanel({ streamId, toUserId, creatorName }: Props) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [translateId, setTranslateId] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // Load recent chat history
  useEffect(() => {
    fetch(`/api/streams/${streamId}/chat?limit=50`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          // API returns newest-first; reverse for display
          setMessages([...d.data.items].reverse())
        }
      })
      .catch(() => {})
  }, [streamId])

  // Socket real-time chat
  useEffect(() => {
    const token = (session as { accessToken?: string } | null)?.accessToken
    const s = connectSocket(token)
    socketRef.current = s

    s.emit('join-chat', { streamId })

    s.on('chat-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev.slice(-199), msg])
    })

    s.on('aura-message', (msg: { body: string; streamId: string }) => {
      if (msg.streamId !== streamId) return
      setMessages(prev => [
        ...prev.slice(-199),
        {
          id: `aura-${Date.now()}`,
          body: msg.body,
          lang: 'en',
          isPinned: false,
          createdAt: new Date().toISOString(),
          isAura: true,
          author: {
            id: AURA_ID,
            username: 'AURA',
            displayName: 'AURA AI',
            avatarUrl: null,
            tier: null,
          },
        },
      ])
    })

    s.on('chat-delete', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    })

    return () => {
      s.emit('leave-chat', { streamId })
      s.off('chat-message')
      s.off('aura-message')
      s.off('chat-delete')
    }
  }, [streamId, session])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !session) return
    const body = input.trim()
    setInput('')
    setSending(true)
    try {
      await fetch(`/api/streams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
    } finally {
      setSending(false)
    }
  }, [input, session, streamId])

  async function translate(msg: ChatMessage) {
    if (translations[msg.id]) { setTranslateId(msg.id); return }
    setTranslateId(msg.id)
    try {
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.body, targetLang: 'en' }),
      })
      const d = await res.json()
      if (d.success) {
        setTranslations(prev => ({ ...prev, [msg.id]: d.data.translatedText }))
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* Header */}
      <div className="border-b border-border px-3 py-2">
        <p className="font-bebas text-label tracking-widest text-muted">LIVE CHAT</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="py-4 text-center font-barlow text-caption text-muted">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`group flex gap-2 rounded p-1.5 transition-colors hover:bg-surface ${msg.isPinned ? 'border border-gold/30 bg-gold/5' : ''}`}
          >
            {msg.isAura ? (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple/20 text-xs font-bebas text-purple">
                AI
              </div>
            ) : (
              <Avatar src={msg.author.avatarUrl} alt={msg.author.username} size={28} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={`font-bebas text-caption leading-none ${msg.isAura ? 'text-purple' : 'text-accent'}`}>
                  {msg.author.displayName ?? msg.author.username}
                </span>
                {msg.author.tier && (
                  <span className="rounded bg-gold/20 px-1 font-bebas text-[9px] text-gold">
                    {msg.author.tier}
                  </span>
                )}
              </div>
              <p className="font-barlow text-body text-text break-words">
                {translateId === msg.id && translations[msg.id]
                  ? translations[msg.id]
                  : msg.body}
              </p>
              {msg.lang !== 'en' && (
                <button
                  onClick={() => translate(msg)}
                  className="mt-0.5 font-barlow text-[10px] text-muted hover:text-accent transition-colors"
                >
                  Translate
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Gifts */}
      {toUserId && creatorName && (
        <GiftPanel streamId={streamId} toUserId={toUserId} creatorName={creatorName} />
      )}

      {/* Input */}
      <div className="border-t border-border p-2">
        {session ? (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Say something..."
              maxLength={500}
              className="min-w-0 flex-1 rounded border border-border bg-surface px-2.5 py-1.5 font-barlow text-body text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <Btn size="sm" onClick={sendMessage} loading={sending} disabled={!input.trim()}>
              Send
            </Btn>
          </div>
        ) : (
          <p className="text-center font-barlow text-caption text-muted">
            <a href="/login" className="text-accent hover:underline">Sign in</a> to chat
          </p>
        )}
      </div>
    </div>
  )
}
