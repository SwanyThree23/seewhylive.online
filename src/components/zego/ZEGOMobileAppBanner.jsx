import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Zap } from 'lucide-react';

const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function ZEGOMobileAppBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl p-5"
      style={{ background: '#0F0F1A', border: `1px solid ${GOLD}35`, boxShadow: `0 0 24px rgba(212,175,55,0.07)` }}>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #800020, #D4AF37)' }}>
          <Smartphone className="w-5 h-5 text-black" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-black uppercase text-sm" style={{ color: GOLD, ...T }}>SeeWhy LIVE Mobile</h3>
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,245,255,0.1)', color: '#00F5FF', border: '1px solid rgba(0,245,255,0.2)', ...T }}>
              Coming Soon
            </span>
          </div>

          <p className="text-xs text-white/60 mb-1">Go live from your phone</p>

          {/* Tech tag */}
          <div className="flex items-center gap-1.5 mb-4">
            <Zap className="w-3 h-3" style={{ color: '#00F5FF' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Share Tech Mono, monospace' }}>
              Built on ZEGOCLOUD Ultra-Low Latency · React Native
            </p>
          </div>

          {/* Platform pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', ...T }}
              disabled>
              🍎 iOS (Coming Soon)
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', ...T }}
              disabled>
              🤖 Android (Coming Soon)
            </button>
          </div>

          {/* Dev link */}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] hover:opacity-70 transition-opacity"
            style={{ color: GOLD, fontFamily: 'Share Tech Mono, monospace', textDecoration: 'none' }}>
            React Native Dev? Clone the Repo →
          </a>
        </div>
      </div>
    </motion.div>
  );
}