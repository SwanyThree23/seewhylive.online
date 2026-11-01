import type { ButtonHTMLAttributes, ReactNode } from 'react'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type BtnSize = 'sm' | 'md' | 'lg'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<BtnVariant, string> = {
  primary:   'bg-accent hover:bg-accent/90 text-white border-transparent',
  secondary: 'bg-surface hover:bg-cardHi text-text border-border',
  ghost:     'bg-transparent hover:bg-surface text-muted hover:text-text border-transparent',
  danger:    'bg-red/15 hover:bg-red/25 text-red border-red/30',
  gold:      'bg-gold hover:bg-gold/90 text-bg border-transparent',
}

const sizeClasses: Record<BtnSize, string> = {
  sm: 'h-7 px-3 text-[11px]',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-6 text-[15px]',
}

export function Btn({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: BtnProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded border font-bebas tracking-widest
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50
        disabled:pointer-events-none disabled:opacity-40
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : children}
    </button>
  )
}
