import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, Monitor, Disc, ChevronDown, ChevronUp, Shield } from 'lucide-react';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0E0C09',
  card:   '#1A1612',
  gold:   '#D4AF37',
  amber:  '#D4854A',
  crimson:'#800020',
  scarlet:'#C0392B',
  green:  '#6DBF7E',
  text:   '#F0E8D4',
  textM:  'rgba(240,232,212,0.55)',
  textD:  'rgba(240,232,212,0.28)',
  border: 'rgba(212,175,55,0.15)',
};
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

const QUALITY_OPTS = [
  { id: 'auto',  label: 'Auto',  desc: 'Adaptive' },
  { id: '360p',  label: '360p',  desc: 'Low bandwidth' },
  { id: '720p',  label: '720p',  desc: 'HD' },
  { id: '1080p', label: '1080p', desc: 'Full HD' },
];

function PermToggle({ icon: Icon, label, enabled, onChange, color }) {
  var col = enabled ? (color || C.green) : C.textD;
  var borderCol = '1px solid ' + (enabled ? col + '44' : 'rgba(255,255,255,0.06)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: enabled ? col + '14' : 'transparent', border: borderCol, transition: 'all .15s', cursor: 'pointer' }}
      onClick={() => onChange(!enabled)}>
      <Icon size={14} style={{ color: col, flexShrink: 0 }} />
      <span style={{ ...T, fontSize: 12, color: enabled ? C.text : C.textD, flex: 1 }}>{label}</span>
      <div style={{ width: 32, height: 18, borderRadius: 99, background: enabled ? col : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <motion.div animate={{ left: enabled ? 16 : 3 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ position: 'absolute', top: 3, width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />
      </div>
    </div>
  );
}

export default function GuestStreamingPermissions({ participant, isHost, onUpdate }) {
  var [open, setOpen] = useState(false);
  var [audio,  setAudio]  = useState(participant?.allow_audio  ?? true);
  var [video,  setVideo]  = useState(participant?.allow_video  ?? true);
  var [screen, setScreen] = useState(participant?.allow_screen ?? false);
  var [record, setRecord] = useState(participant?.allow_record ?? false);
  var [quality,setQuality]= useState(participant?.quality_limit || 'auto');
  var [saved,  setSaved]  = useState(false);

  var saveMutation = useMutation({
    mutationFn: () => {
      if (!participant?.id) return Promise.resolve();
      return base44.entities.Participant.update(participant.id, {
        allow_audio:   audio,
        allow_video:   video,
        allow_screen:  screen,
        allow_record:  record,
        quality_limit: quality,
      });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onUpdate) onUpdate({ audio, video, screen, record, quality });
    },
  });

  if (!isHost) return null;

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid ' + C.border, background: C.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', cursor: 'pointer', background: open ? 'rgba(212,175,55,0.06)' : 'transparent' }}
        onClick={() => setOpen(v => !v)}>
        <Shield size={12} style={{ color: C.gold }} />
        <span style={{ ...T, fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', flex: 1 }}>PERMISSIONS</span>
        {open ? <ChevronUp size={12} style={{ color: C.textD }} /> : <ChevronDown size={12} style={{ color: C.textD }} />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid ' + C.border }}>

              {/* Permission toggles */}
              <PermToggle icon={Mic}     label="Microphone"   enabled={audio}  onChange={setAudio}  color={C.green}  />
              <PermToggle icon={Video}   label="Camera"       enabled={video}  onChange={setVideo}  color={C.green}  />
              <PermToggle icon={Monitor} label="Screen Share" enabled={screen} onChange={setScreen} color={C.amber}  />
              <PermToggle icon={Disc}    label="Recording"    enabled={record} onChange={setRecord} color={C.scarlet}/>

              {/* Quality limit */}
              <div style={{ marginTop: 4 }}>
                <div style={{ ...T, fontSize: 9, color: C.textD, letterSpacing: '0.1em', marginBottom: 5 }}>MAX QUALITY</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {QUALITY_OPTS.map(q => (
                    <button key={q.id} onClick={() => setQuality(q.id)} style={{
                      flex: 1, padding: '5px 4px', borderRadius: 5, border: '1px solid ' + (quality === q.id ? C.gold + '60' : 'rgba(255,255,255,0.08)'),
                      background: quality === q.id ? C.gold + '18' : 'transparent', cursor: 'pointer', ...T,
                      fontSize: 10, fontWeight: quality === q.id ? 700 : 400, color: quality === q.id ? C.gold : C.textD,
                    }}>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <button onClick={() => saveMutation.mutate()} style={{
                marginTop: 4, width: '100%', padding: '7px', borderRadius: 6, border: 'none',
                background: saved ? C.green + '33' : C.crimson, cursor: 'pointer',
                ...T, fontSize: 11, fontWeight: 700, color: saved ? C.green : C.gold, letterSpacing: '0.06em',
              }}>
                {saved ? '✓ SAVED' : saveMutation.isPending ? 'SAVING…' : 'APPLY PERMISSIONS'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
