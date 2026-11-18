import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';

var GOLD = '#C9A84C';

var BANDS = [
  { id: 'sub',      label: 'Sub',      hz: 60    },
  { id: 'bass',     label: 'Bass',     hz: 200   },
  { id: 'lo_mid',   label: 'Lo-Mid',   hz: 500   },
  { id: 'mid',      label: 'Mid',      hz: 1000  },
  { id: 'hi_mid',   label: 'Hi-Mid',   hz: 3000  },
  { id: 'presence', label: 'Presence', hz: 6000  },
  { id: 'air',      label: 'Air',      hz: 12000 },
];

export default function HarmonicGate(props) {
  var isHost = props.isHost;
  var [expanded, setExpanded] = useState(false);
  var [gains, setGains] = useState(function() {
    var g = {};
    BANDS.forEach(function(b) { g[b.id] = 0; });
    return g;
  });
  var [gateThresh, setGateThresh] = useState(-40);
  var [gateOn, setGateOn] = useState(false);
  var canvasRef = useRef(null);
  var rafRef = useRef(null);
  var analyserRef = useRef(null);

  useEffect(function() {
    if (!expanded || !canvasRef.current) return;
    var canvas = canvasRef.current;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);

      var N = BANDS.length;
      var barW = Math.floor(w / (N * 2));
      BANDS.forEach(function(band, i) {
        var val = gains[band.id] || 0;
        var normH = Math.abs(val / 12) * (h / 2 - 4);
        var x = Math.round(i * (w / N) + barW / 2);
        var midY = h / 2;
        ctx.fillStyle = val > 0 ? GOLD : val < 0 ? '#FF1A3C' : 'rgba(255,255,255,0.15)';
        if (val >= 0) {
          ctx.fillRect(x, midY - normH, barW, normH || 2);
        } else {
          ctx.fillRect(x, midY, barW, normH);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(w, midY);
        ctx.stroke();
      });
    }

    drawStatic();
    return function() { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [expanded, gains]);

  function setGain(id, val) {
    setGains(function(prev) { return Object.assign({}, prev, { [id]: Number(val) }); });
  }

  function resetAll() {
    var g = {};
    BANDS.forEach(function(b) { g[b.id] = 0; });
    setGains(g);
  }

  if (!isHost) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 8 }}>
      <button
        onClick={function() { setExpanded(!expanded); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
      >
        <Activity size={15} style={{ color: GOLD }} />
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, textAlign: 'left', color: GOLD }}>Harmonic Gate — EQ</span>
        {expanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* EQ visualization canvas */}
          <canvas
            ref={canvasRef}
            width={280} height={60}
            style={{ width: '100%', height: 60, borderRadius: 6, marginBottom: 10, display: 'block' }}
          />

          {/* Vertical faders */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            {BANDS.map(function(band) {
              var val = gains[band.id] || 0;
              return (
                <div key={band.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: val > 0 ? GOLD : val < 0 ? '#FF1A3C' : 'rgba(255,255,255,0.4)', minWidth: 20, textAlign: 'center' }}>
                    {val > 0 ? '+' + val : val}
                  </span>
                  <input
                    type="range" min="-12" max="12" step="1" value={val}
                    onChange={function(e) { setGain(band.id, e.target.value); }}
                    style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 72, width: 20, accentColor: GOLD, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{band.label}</span>
                </div>
              );
            })}
          </div>

          {/* Noise Gate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: gateOn ? GOLD : 'rgba(255,255,255,0.4)', flex: 1 }}>Noise Gate</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{gateThresh} dB</span>
            <input
              type="range" min="-80" max="-10" step="1" value={gateThresh}
              onChange={function(e) { setGateThresh(Number(e.target.value)); }}
              style={{ width: 80, accentColor: GOLD }}
            />
            <button
              onClick={function() { setGateOn(!gateOn); }}
              style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                background: gateOn ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.4)',
                border: '1px solid ' + (gateOn ? GOLD : 'rgba(255,255,255,0.1)'),
                color: gateOn ? GOLD : 'rgba(255,255,255,0.4)',
              }}
            >
              {gateOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            onClick={resetAll}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Reset EQ
          </button>
        </div>
      )}
    </div>
  );
}
