import { Avatar } from '@/components/ui/Avatar'
import { TierBadge } from '@/components/ui/Badge'

export interface ChatMessageData {
  id: string
  body: string
  lang: string
  isPinned: boolean
  createdAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string | null
    tier: string
  }
}

interface ChatMessageProps {
  message: ChatMessageData
  isOwn?: boolean
  isMod?: boolean
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
}

export function ChatMessage({ message, isOwn, isMod, onDelete, onPin }: ChatMessageProps) {
  return (
    <div
      className={`group flex gap-2 px-3 py-1.5 transition-colors hover:bg-surface/50 ${message.isPinned ? 'bg-gold/5 border-l-2 border-gold/40' : ''}`}
    >
      <Avatar
        src={message.author.avatarUrl}
        alt={message.author.displayName}
        size={28}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-barlow text-label font-semibold text-text">
            {message.author.displayName}
          </span>
          {message.author.tier !== 'FREE' && (
            <TierBadge tier={message.author.tier} />
          )}
          {message.isPinned && (
            <span className="font-bebas text-[9px] tracking-widest text-gold">PINNED</span>
          )}
        </div>
        <p className="prose mt-0.5 font-barlow text-body text-text/90 break-words">{message.body}</p>
      </div>

      {/* Mod actions */}
      {(isMod || isOwn) && (
        <div className="hidden shrink-0 items-start gap-1 group-hover:flex">
          {isMod && onPin && (
            <button
              onClick={() => onPin(message.id)}
              className="rounded px-1 py-0.5 font-bebas text-[9px] tracking-widest text-muted transition-colors hover:text-gold"
            >
              PIN
            </button>
          )}
          {isMod && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="rounded px-1 py-0.5 font-bebas text-[9px] tracking-widest text-muted transition-colors hover:text-red"
            >
              DEL
            </button>
          )}
        </div>
      )}
    </div>
  )
}
