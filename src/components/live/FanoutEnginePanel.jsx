import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Radio, Lock, Cpu, Server, Zap, Shield, RefreshCw } from 'lucide-react';

// Per spec: 0.5–1.0 CPU core per transmuxing process, 100–200 MB RAM each.
// A 20-participant session (each to 5 platforms) = 100 concurrent FFmpeg processes
// = 40–80 total CPU cores required.
// Pods: request 4 CPU / 8 GiB, limit 8 CPU / 16 GiB — each handles ~20–25 streams.
// HPA: 3–20 pods, scales at 70% CPU.

var STAT_CHIPS = ['+320% Discovery', '+67% Engagement', '+45% Retention'];
var POD_COUNT = 4; // "healthy" pod indicators to display in UI

function StatChip({ label, color, bg, border }) {
  return (
    <span style={{
      fontFamily: 'Barlow Condensed, sans-serif',
      fontSize: 9, fontWeight: 900, letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: 99,
      background: bg, color: color, border: '1px solid ' + border,
    }}>{label}</span>
  );
}

function SpecRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {Icon && <Icon style={{ width: 9, height: 9, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: valueColor || 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function FanoutEnginePanel({ members = [], isHost = false, roomId = null }) {
  var [expanded, setExpanded] = useState(false);

  // Derived metrics — based on spec: avg 5 platforms per guest
  var guestCount    = members.length;
  var streamCount   = guestCount * 5;  // 5 destinations per guest per spec
  var totalCPU      = streamCount * 0.75; // midpoint of 0.5–1.0 per stream
  var totalRAM      = streamCount * 150;  // midpoint 100–200 MB per process
  var podsNeeded    = Math.max(3, Math.ceil(streamCount / 22)); // 20–25 per pod midpoint
  var reachK        = guestCount * 10;   // 10K avg followers per guest
  var isActive      = isHost && guestCount > 0;

  // Cap pod display at 8
  var podDisplay    = Math.min(podsNeeded, 8);

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      background: 'rgba(8,11,24,0.97)',
      border: '1px solid rgba(212,175,55,0.13)',
      fontFamily: 'Barlow Condensed, sans-serif',
    }}>
      {/* ── Header ── */}
      <button
        onClick={function() { setExpanded(function(v) { return !v; }); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        className="hover:bg-white/[0.03] transition-colors"
      >
        <Radio style={{ width: 13, height: 13, color: isActive ? '#C0392B' : '#D4AF37', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 900, color: '#D4AF37', letterSpacing: '0.07em', flex: 1 }}>FFmpeg Fanout Engine</span>
        {isActive && (
          <span style={{ fontSize: 9, color: '#6DBF7E', fontWeight: 900, animation: 'sw-pulse 1.8s ease-in-out infinite', letterSpacing: '0.06em' }}>● ACTIVE</span>
        )}
        {streamCount > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 4,
            background: streamCount >= 80 ? 'rgba(192,57,43,0.18)' : 'rgba(212,175,55,0.12)',
            color: streamCount >= 80 ? '#C0392B' : '#D4AF37',
            border: '1px solid ' + (streamCount >= 80 ? 'rgba(192,57,43,0.3)' : 'rgba(212,175,55,0.22)'),
            letterSpacing: '0.04em',
          }}>{streamCount} streams</span>
        )}
        {expanded
          ? <ChevronUp style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          : <ChevronDown style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="fanout-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* ── A. Audience Multiplication Effect ── */}
              <div style={{ borderRadius: 8, padding: '8px 10px', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>
                  Audience Multiplication
                </p>
                {/* Metric chips */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                  <StatChip label={'🎯 ' + guestCount + ' guests'} color="#6DBF7E" bg="rgba(109,191,126,0.1)" border="rgba(109,191,126,0.22)" />
                  <StatChip label={'📡 ' + streamCount + ' streams'} color="#D4AF37" bg="rgba(212,175,55,0.1)" border="rgba(212,175,55,0.22)" />
                  <StatChip label={'👥 ~' + reachK + 'K reach'} color="#CC7755" bg="rgba(204,119,85,0.1)" border="rgba(204,119,85,0.22)" />
                </div>
                {/* Impact stats */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {STAT_CHIPS.map(function(stat) {
                    return (
                      <span key={stat} style={{
                        fontSize: 9, fontWeight: 900, letterSpacing: '0.05em',
                        padding: '2px 6px', borderRadius: 99,
                        background: 'rgba(128,0,32,0.14)', color: 'rgba(255,255,255,0.45)',
                        border: '1px solid rgba(128,0,32,0.22)',
                      }}>{stat}</span>
                    );
                  })}
                </div>
              </div>

              {/* ── B. Transmuxing Mode ── */}
              <div style={{ borderRadius: 8, padding: '8px 10px', background: 'rgba(74,138,122,0.05)', border: '1px solid rgba(74,138,122,0.14)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(74,138,122,0.5)', marginBottom: 5 }}>Transmuxing Mode</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
                  <code style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(74,138,122,0.1)', color: 'rgba(74,138,122,0.85)', border: '1px solid rgba(74,138,122,0.2)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.02em' }}>-c:v copy</code>
                  <code style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(74,138,122,0.1)', color: 'rgba(74,138,122,0.85)', border: '1px solid rgba(74,138,122,0.2)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.02em' }}>-c:a copy</code>
                  <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(109,191,126,0.1)', color: '#6DBF7E', border: '1px solid rgba(109,191,126,0.2)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>⚡ &lt;2s startup</span>
                  <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(123,93,166,0.1)', color: '#7B5DA6', border: '1px solid rgba(123,93,166,0.2)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>CUDA ready</span>
                </div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
                  H.264 video + AAC audio pass-through · no re-encode · minimal CPU overhead
                </p>
              </div>

              {/* ── C. Per-Process Resource ── */}
              <div style={{ borderRadius: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>Per-Process Resources</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <SpecRow icon={Cpu}    label="CPU per stream"       value="0.5–1.0 cores" valueColor="rgba(212,175,55,0.8)" />
                  <SpecRow icon={Server} label="RAM per process"      value="100–200 MB"    valueColor="rgba(212,175,55,0.8)" />
                  <SpecRow icon={Cpu}    label="Total CPU (this session)" value={totalCPU.toFixed(0) + '–' + (totalCPU * 1.5).toFixed(0) + ' cores'} valueColor={totalCPU > 40 ? '#C0392B' : '#D4AF37'} />
                  <SpecRow icon={Server} label="Total RAM estimate"   value={(totalRAM / 1024).toFixed(1) + ' GiB'} valueColor="rgba(255,255,255,0.6)" />
                </div>
              </div>

              {/* ── D. Kubernetes Cluster ── */}
              <div style={{ borderRadius: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>Kubernetes Cluster</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 7 }}>
                  <SpecRow icon={Server} label="Pod requests"   value="4 CPU · 8 GiB RAM" />
                  <SpecRow icon={Server} label="Pod limits"     value="8 CPU · 16 GiB RAM" />
                  <SpecRow icon={Zap}    label="HPA threshold"  value="70% CPU" valueColor="#D4AF37" />
                  <SpecRow icon={Server} label="Pod range"      value="3–20 pods" />
                  <SpecRow icon={Server} label="Streams / pod"  value="~20–25" />
                  <SpecRow icon={Server} label="Hardware"       value="AWS c6i.4xlarge" valueColor="rgba(212,175,55,0.7)" />
                </div>
                {/* Pod health bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Pods</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: podDisplay }).map(function(_, i) {
                      return (
                        <div key={i} style={{ width: 14, height: 7, borderRadius: 2, background: i < podsNeeded ? '#6DBF7E' : 'rgba(109,191,126,0.2)' }} />
                      );
                    })}
                    {podsNeeded > 8 && (
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>+{podsNeeded - 8}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#6DBF7E' }}>Healthy</span>
                </div>
              </div>

              {/* ── E. Security & Resilience ── */}
              <div style={{ borderRadius: 8, padding: '8px 10px', background: 'rgba(123,93,166,0.05)', border: '1px solid rgba(123,93,166,0.14)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <Shield style={{ width: 10, height: 10, color: '#7B5DA6', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#7B5DA6', letterSpacing: '0.05em' }}>Vault Pro · AES-256-GCM</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <SpecRow icon={Lock}      label="Encryption"         value="AES-256-GCM" valueColor="#7B5DA6" />
                  <SpecRow icon={RefreshCw} label="Auto-retry on fail" value="3× · 5s delay" valueColor="#CC7755" />
                  <SpecRow icon={Shield}    label="Failure isolation"  value="Per-process" valueColor="#6DBF7E" />
                </div>
                <p style={{ fontSize: 9, color: 'rgba(123,93,166,0.55)', lineHeight: 1.4, marginTop: 4 }}>
                  Keys decrypted in-memory only · zero-knowledge host · one platform failure can't crash others
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes sw-pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
