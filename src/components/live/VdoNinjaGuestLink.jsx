import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

export default function VdoNinjaGuestLink({ roomId }) {
  const [copied, setCopied] = useState(false);

  // vdo.ninja guest join links
  const links = [
    {
      name: 'Main Scene',
      url: 'https://vdo.ninja/?view=Swan23&room=SCN&solo',
      desc: 'Screenshare & guest video'
    },
    {
      name: 'Alt Setup',
      url: 'https://vdo.ninja/?v=Qqw6NNqb&r=Domino_Entertainment&scn&p=0',
      desc: 'Pre-configured guest room'
    }
  ];

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 bg-[rgba(8,11,24,0.9)] border border-[rgba(212,175,55,0.15)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-white uppercase tracking-wider">vdo.ninja Guest Links</p>
        <a
          href="https://vdo.ninja"
          target="_blank"
          rel="noopener noreferrer"
          className="w-4 h-4 text-[#d4af37]/60 hover:text-[#d4af37] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-2">
        {links.map((link, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="bg-white/5 border border-white/10 rounded-lg p-2 space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-white">{link.name}</p>
                <p className="text-[11px] text-white/40">{link.desc}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex:1 }}
              >
                <button style={{ width:'100%', height:24, borderRadius:6, border:'1px solid rgba(212,175,55,0.3)', background:'transparent', color:'#d4af37', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                  Open
                </button>
              </a>
              <button
                onClick={() => handleCopy(link.url)}
                className="flex-1 h-6 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-[11px] text-white/50 hover:text-white flex items-center justify-center gap-1 transition-all"
              >
                {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}