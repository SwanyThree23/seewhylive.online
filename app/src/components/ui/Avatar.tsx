import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: number
  isSpeaking?: boolean
  className?: string
}

export function Avatar({ src, alt, size = 40, isSpeaking = false, className = '' }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden ${isSpeaking ? 'speaking-ring' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-surface font-barlow font-semibold text-muted"
          style={{ fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}
    </div>
  )
}
