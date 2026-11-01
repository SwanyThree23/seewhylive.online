import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  label?: string
  error?: string
  hint?: string
  prefix?: ReactNode
  suffix?: ReactNode
}

export function Input({ label, error, hint, prefix, suffix, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="font-bebas text-label tracking-widest text-muted">
          {label}
        </label>
      )}
      <div className={`flex items-center gap-2 rounded border bg-surface px-3 h-10 transition-colors
        ${error ? 'border-red' : 'border-border focus-within:border-cyan/50'}
      `}>
        {prefix && <span className="text-muted">{prefix}</span>}
        <input
          id={inputId}
          className={`min-w-0 flex-1 bg-transparent font-barlow text-body text-text placeholder:text-dim
            focus:outline-none disabled:opacity-40 ${className}`}
          {...props}
        />
        {suffix && <span className="text-muted">{suffix}</span>}
      </div>
      {error && <p className="font-barlow text-label text-red">{error}</p>}
      {!error && hint && <p className="font-barlow text-label text-muted">{hint}</p>}
    </div>
  )
}
