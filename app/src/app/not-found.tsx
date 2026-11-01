import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-bebas text-[6rem] leading-none text-accent opacity-30">404</p>
      <h1 className="font-bebas text-hero text-text">PAGE NOT FOUND</h1>
      <p className="mt-2 font-barlow text-body text-muted">
        That signal dropped. The page you&#39;re looking for doesn&#39;t exist.
      </p>
      <Link
        href="/discover"
        className="mt-8 inline-flex items-center gap-2 rounded border border-accent bg-accent/15 px-5 py-2.5 font-bebas text-section tracking-widest text-accent transition-colors hover:bg-accent/25"
      >
        ← BACK TO DISCOVER
      </Link>
    </div>
  )
}
