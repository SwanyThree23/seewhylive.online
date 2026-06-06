import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

// ── VDO.Ninja URL helpers ──────────────────────────────────────────────────
function vdoRoom(roomId) {
  return 'sw' + (roomId || 'room').replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase();
}
export function buildGuestPushUrl(roomId, seatNum) {
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&push&label=G' + seatNum + '&effects&showlabels';
}
export function buildSceneUrl(roomId) {
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&scene&layout=2';
}
export function buildDirectorUrl(roomId) {
  return 'https://vdo.ninja/?room=' + vdoRoom(roomId) + '&director';
}

const C = {
  gold:   '#D4AF37',
  amber:  '#D4854A',
  crimson:'#800020',
  textM:  'rgba(240,232,212,0.55)',
  textD:  'rgba(240,232,212,0.28)',
  border: 'rgba(212,175,55,0.15)',
};
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

function CopyBtn({ url, label }) {
  var [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(url).catch(() => {
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
        <button style={{ width: '100%', height: 26, borderRadius: 5, border: '1px solid ' + C.gold + '44', background: 'transparent', color: C.gold, cursor: 'pointer', ...T, fontSize: 11, fontWeight: 700 }}>
          ↗ {label || 'Open'}
        </button>
      </a>
      <button onClick={doCopy} style={{ width: 40, height: 26, borderRadius: 5, border: '1px solid rgba(255,255,255,0.12)', background: copied ? C.gold + '22' : 'rgba(255,255,255,0.04)', color: copied ? C.gold : C.textM, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

export default function VdoNinjaGuestLink({ roomId, maxSeats = 4, showAll = false }) {
  var [expanded, setExpanded] = useState(false);
  var room = vdoRoom(roomId || 'room');

  var masterLinks = [
    { name: '🎬 Director Panel',  url: buildDirectorUrl(roomId),  desc: 'Full host control — open in its own tab' },
    { name: '📺 OBS Scene Source', url: buildSceneUrl(roomId),    desc: 'Add as Browser Source in OBS / StreamLabs' },
  ];

  var displayCount = showAll ? 20 : (expanded ? 20 : maxSeats);

  return (
    <div style={{ background: 'rgba(14,12,9,0.95)', border: '1px solid ' + C.border, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...T, fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: '0.08em' }}>VDO.NINJA LINKS</span>
          <span style={{ ...T, fontSize: 9, color: C.textD, background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>
            Room: {room}
          </span>
        </div>
        <a href="https://vdo.ninja" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={12} style={{ color: C.textD }} />
        </a>
      </div>

      {/* Master links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {masterLinks.map(link => (
          <div key={link.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
              <div>
                <p style={{ ...T, fontSize: 11, fontWeight: 700, color: '#F0E8D4' }}>{link.name}</p>
                <p style={{ ...T, fontSize: 10, color: C.textD, marginTop: 1 }}>{link.desc}</p>
              </div>
            </div>
            <CopyBtn url={link.url} label="Open" />
          </div>
        ))}
      </div>

      {/* Per-seat push links */}
      <div style={{ ...T, fontSize: 9, color: C.textD, letterSpacing: '0.1em', marginBottom: 6 }}>
        GUEST PUSH LINKS (SEND TO EACH CO-STREAMER)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Array.from({ length: displayCount }, (_, i) => i + 1).map(num => {
          var url = buildGuestPushUrl(roomId, num);
          return (
            <motion.div key={num} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: num * 0.02 }}
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 6, padding: '6px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ ...T, fontSize: 10, color: C.gold, fontWeight: 700, minWidth: 24 }}>G{num}</span>
                <span style={{ ...T, fontSize: 10, color: C.textD, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Guest {num} push link
                </span>
              </div>
              <CopyBtn url={url} label={'G' + num} />
            </motion.div>
          );
        })}
      </div>

      {!showAll && (
        <button onClick={() => setExpanded(v => !v)} style={{ marginTop: 8, width: '100%', padding: '7px', borderRadius: 6, border: '1px solid ' + C.border, background: 'transparent', cursor: 'pointer', ...T, fontSize: 11, color: C.textM, letterSpacing: '0.06em' }}>
          {expanded ? '▲ SHOW FEWER' : '▼ SHOW ALL 20 SEATS'}
        </button>
      )}
    </div>
  );
}
