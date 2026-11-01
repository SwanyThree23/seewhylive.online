'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { SignalBars } from '@/components/brand/SignalBars'
import { Btn } from '@/components/ui/Btn'

const NAV_LINKS = [
  { href: '/discover', label: 'DISCOVER' },
  { href: '/rooms', label: 'ROOMS' },
  { href: '/videos', label: 'VIDEOS' },
  { href: '/scheduled', label: 'SCHEDULE' },
  { href: '/search', label: 'SEARCH' },
  { href: '/studio', label: 'STUDIO' },
]

export function TopNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [walletCents, setWalletCents] = useState(0)

  useEffect(() => {
    if (!session) return

    function refreshNotifications() {
      fetch('/api/notifications?unread=1&limit=1')
        .then(r => r.json())
        .then(d => { if (d.success) setUnreadCount(d.data.unreadCount ?? 0) })
        .catch(() => {})
    }

    function refreshWallet() {
      fetch('/api/users/me')
        .then(r => r.json())
        .then(d => { if (d.success) setWalletCents(d.data.user?.walletCents ?? 0) })
        .catch(() => {})
    }

    refreshNotifications()
    refreshWallet()

    const id = setInterval(() => {
      refreshNotifications()
      refreshWallet()
    }, 60_000)
    return () => clearInterval(id)
  }, [session])

  return (
    <nav className="no-select sticky top-[2px] z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/discover" className="flex items-center gap-2 shrink-0">
          <SignalBars active />
          <span className="font-bebas text-section tracking-widest text-text">
            SEE<span className="text-accent">WHY</span> LIVE
          </span>
        </Link>

        {/* Primary nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-1.5 font-bebas text-label tracking-widest transition-colors
                ${pathname.startsWith(link.href)
                  ? 'text-text'
                  : 'text-muted hover:text-text'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Auth area */}
        {session ? (
          <div className="relative flex items-center gap-3">
            {/* Wallet */}
            <Link
              href="/wallet"
              className="hidden items-center gap-1 rounded border border-border bg-surface px-2.5 py-1 font-bebas text-label tracking-widest text-gold transition-colors hover:border-gold/30 sm:flex"
            >
              <span>$</span>
              <span>{(walletCents / 100).toFixed(2)}</span>
            </Link>

            {/* Go Live shortcut */}
            <Link href="/studio">
              <Badge variant="live" dot className="cursor-pointer hover:opacity-80 transition-opacity">
                GO LIVE
              </Badge>
            </Link>

            {/* Avatar + dropdown */}
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="flex items-center gap-2"
            >
              <Avatar
                src={session.user?.image}
                alt={session.user?.name ?? 'User'}
                size={32}
              />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-48 animate-fade-in rounded border border-border bg-surface shadow-xl">
                  <div className="border-b border-border px-4 py-3">
                    <p className="font-bebas text-section text-text">{session.user?.name}</p>
                    <p className="font-barlow text-label text-muted">
                      @{(session.user as { username?: string }).username}
                    </p>
                  </div>
                  {[
                    { href: `/profile`, label: 'My Profile', badge: 0 },
                    { href: '/notifications', label: 'Notifications', badge: unreadCount },
                    { href: '/analytics', label: 'Analytics', badge: 0 },
                    { href: '/wallet', label: 'Wallet', badge: 0 },
                    { href: '/settings', label: 'Settings', badge: 0 },
                  ].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 font-barlow text-body text-muted transition-colors hover:bg-cardHi hover:text-text"
                    >
                      {item.label}
                      {item.badge > 0 && (
                        <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 font-bebas text-[10px] leading-none text-bg">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/discover' }) }}
                    className="w-full px-4 py-2.5 text-left font-barlow text-body text-red transition-colors hover:bg-cardHi"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Btn variant="ghost" size="sm">SIGN IN</Btn>
            </Link>
            <Link href="/register">
              <Btn size="sm">JOIN FREE</Btn>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
