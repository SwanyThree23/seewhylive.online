import Link from 'next/link'

export const metadata = { title: 'Subscription Cancelled' }

export default function SubscribeCancelPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 font-bebas text-[4rem] leading-none text-muted opacity-50">×</p>
      <h1 className="font-bebas text-hero text-text">CANCELLED</h1>
      <p className="mt-2 max-w-sm font-barlow text-body text-muted">
        Your subscription checkout was cancelled. You have not been charged.
      </p>
      <div className="mt-8">
        <Link
          href="/discover"
          className="rounded border border-border bg-surface px-5 py-2.5 font-bebas text-section tracking-widest text-muted transition-colors hover:text-text"
        >
          BACK TO DISCOVER
        </Link>
      </div>
    </div>
  )
}
