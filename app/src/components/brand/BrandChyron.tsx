'use client'

import { useRef, useState } from 'react'

const TICKER_ITEMS = [
  'SeeWhy LIVE',
  'Stream · Connect · Earn',
  'Go LIVE Now',
  'Support Your Creators',
  '90% to Creators',
]

export function BrandChyron() {
  const [items] = useState(TICKER_ITEMS)
  const trackRef = useRef<HTMLDivElement>(null)

  return (
    <div className="brand-chyron" role="marquee" aria-label="Ticker">
      <div className="flex h-full items-center overflow-hidden">
        {/* LIVE label */}
        <div className="flex shrink-0 items-center gap-1.5 border-r border-border px-3 h-full">
          <span className="live-dot" />
          <span className="font-bebas text-[11px] tracking-widest text-accent">LIVE</span>
        </div>

        {/* Scrolling ticker */}
        <div className="relative flex-1 overflow-hidden h-full flex items-center">
          <div
            ref={trackRef}
            className="flex animate-[ticker_20s_linear_infinite] whitespace-nowrap gap-12 items-center"
          >
            {[...items, ...items].map((item, i) => (
              <span key={i} className="font-barlow text-[11px] uppercase tracking-wider text-muted">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
