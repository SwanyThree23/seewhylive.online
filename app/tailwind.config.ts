import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent:  '#FF1564',   // primary CTAs, live indicators
        gold:    '#FFB800',   // earnings, premium features, Golden Wall
        cyan:    '#00F5FF',   // secondary actions, info
        bg:      '#03030A',   // deepest page background
        surface: '#07070F',   // modals, raised panels
        card:    '#0B0B18',   // card backgrounds
        cardHi:  '#10101E',   // elevated card (hover/focus)
        border:  '#16162A',   // default borders
        text:    '#F0F0FF',   // primary text
        muted:   '#5A5A7A',   // secondary text, labels
        dim:     '#2A2A48',   // disabled, placeholder
        green:   '#00FF88',   // live status, speaking highlight
        purple:  '#8B5CF6',   // AURA AI only
        red:     '#FF2040',   // danger, recording
        warn:    '#FF8C00',   // warnings
        grid:    'rgba(255,255,255,0.024)', // subtle grid overlay
      },
      fontFamily: {
        syne:    ['var(--font-syne)', 'sans-serif'],
        barlow:  ['var(--font-barlow)', 'sans-serif'],
        bebas:   ['var(--font-bebas)', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      fontSize: {
        'hero':    ['48px', { lineHeight: '1', letterSpacing: '0.05em' }],
        'page':    ['22px', { lineHeight: '1.1', letterSpacing: '0.06em' }],
        'section': ['13px', { lineHeight: '1.2', letterSpacing: '0.05em' }],
        'card':    ['13px', { lineHeight: '1.3', letterSpacing: '0.01em' }],
        'body':    ['13px', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'label':   ['10px', { lineHeight: '1.2', letterSpacing: '0.06em' }],
        'stat':    ['22px', { lineHeight: '1', letterSpacing: '0.01em' }],
      },
      animation: {
        'pulse-live':    'pulseLive 1.5s ease-in-out infinite',
        'speaking-ring': 'speakingRing 1s ease-in-out infinite',
        'gold-wall':     'goldWallIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'signal-bar':    'signalBar 1.2s ease-in-out infinite',
        'slide-up':      'slideUp 0.25s ease-out',
        'slide-down':    'slideDown 0.25s ease-out',
        'fade-in':       'fadeIn 0.2s ease-out',
        'scale-in':      'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        pulseLive: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
        speakingRing: {
          '0%,100%': { boxShadow: '0 0 0 2px #00FF88' },
          '50%':     { boxShadow: '0 0 0 6px rgba(0,255,136,0.2)' },
        },
        goldWallIn: {
          from: { opacity: '0', transform: 'scale(0.8) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        signalBar: {
          '0%,100%': { scaleY: '0.3' },
          '50%':     { scaleY: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg,#FF1564,#FFB800,#00F5FF,#00FF88,#8B5CF6,transparent)',
        'card-grid':      'linear-gradient(rgba(255,255,255,0.024) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.024) 1px,transparent 1px)',
      },
      backgroundSize: {
        'card-grid': '20px 20px',
      },
    },
  },
  plugins: [],
}

export default config
