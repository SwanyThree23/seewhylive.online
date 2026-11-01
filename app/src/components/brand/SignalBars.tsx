interface SignalBarsProps {
  active?: boolean
  className?: string
}

export function SignalBars({ active = true, className = '' }: SignalBarsProps) {
  return (
    <div className={`flex items-end gap-[2px] h-3 ${className}`} aria-hidden="true">
      {[0.4, 0.65, 0.85, 1].map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-sm ${active ? 'bg-green animate-signal-bar' : 'bg-muted'}`}
          style={{
            height: `${h * 100}%`,
            animationDelay: active ? `${i * 0.15}s` : undefined,
          }}
        />
      ))}
    </div>
  )
}
