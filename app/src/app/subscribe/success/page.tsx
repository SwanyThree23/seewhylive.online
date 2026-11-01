import Link from 'next/link'

export const metadata = { title: 'Subscribed!' }

export default function SubscribeSuccessPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 font-bebas text-[5rem] leading-none text-green">✓</p>
      <h1 className="font-bebas text-hero text-text">SUBSCRIBED!</h1>
      <p className="mt-2 max-w-sm font-barlow text-body text-muted">
        You&apos;re now a supporter. Your subscription is active and you have access to all exclusive content.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/discover"
          className="rounded border border-border bg-surface px-5 py-2.5 font-bebas text-section tracking-widest text-muted transition-colors hover:text-text"
        >
          DISCOVER
        </Link>
        <Link
          href="/settings"
          className="rounded border border-accent bg-accent/15 px-5 py-2.5 font-bebas text-section tracking-widest text-accent transition-colors hover:bg-accent/25"
        >
          MY ACCOUNT
        </Link>
      </div>
    </div>
  )
}
