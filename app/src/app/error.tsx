'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-bebas text-[4rem] leading-none text-red opacity-50">ERROR</p>
      <h1 className="font-bebas text-hero text-text">SOMETHING WENT WRONG</h1>
      <p className="mt-2 font-barlow text-body text-muted max-w-md">
        An unexpected error occurred. Try refreshing or head back to Discover.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded border border-accent bg-accent/15 px-5 py-2.5 font-bebas text-section tracking-widest text-accent transition-colors hover:bg-accent/25"
        >
          TRY AGAIN
        </button>
        <Link
          href="/discover"
          className="rounded border border-border bg-surface px-5 py-2.5 font-bebas text-section tracking-widest text-muted transition-colors hover:text-text"
        >
          DISCOVER
        </Link>
      </div>
      {error.digest && (
        <p className="mt-4 font-barlow text-caption text-muted/50">Error ID: {error.digest}</p>
      )}
    </div>
  )
}
