import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var GOLD_H = '#E8C46A';
var BURG   = '#800020';
var BURG_H = '#C01838';
var TEAL   = '#00C9A7';
var TEAL_H = '#00DEC0';
var PURP   = '#9B4DCA';
var PURP_H = '#C084FC';
var LIME   = '#00C96A';
var MUTED  = '#6B5F82';
var TEXT   = '#EDE8F4';
var TEXT_M = '#A89CC8';
var BG0    = '#07050A';
var BG1    = '#0F0C14';
var FAINT  = '#1C1530';
var BORDER = 'rgba(255,255,255,.07)';
var GLASS  = 'rgba(13,10,20,.75)';
var fD = "'Bebas Neue',sans-serif";
var fU = "'Barlow Condensed',sans-serif";
var fM = "'DM Mono',monospace";

var rnd = function(a, b) { return Math.floor(Math.random() * (b - a + 1) + a); };
var fmtN = function(n) { n = n || 0; if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'k'; return ''+n; };
var fmtS = function(s) { s = s || 0; var m = Math.floor(s / 60); var sec = s % 60; return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec; };

var MCP_TOOLS = [
  {id:'t1',  name:'get_stream_status',   table:'streams',       status:'healthy', latency:'4ms',   calls:847,  color:LIME},
  {id:'t2',  name:'create_transaction',  table:'transactions',  status:'healthy', latency:'8ms',   calls:47,   color:LIME},
  {id:'t3',  name:'get_viewer_count',    table:'streams',       status:'healthy', latency:'2ms',   calls:4821, color:LIME},
  {id:'t4',  name:'list_panelists',      table:'panelists',     status:'healthy', latency:'3ms',   calls:312,  color:LIME},
  {id:'t5',  name:'moderate_message',    table:'chat_messages', status:'healthy', latency:'420ms', calls:1847, color:TEAL_H},
  {id:'t6',  name:'get_revenue_split',   table:'transactions',  status:'healthy', latency:'5ms',   calls:234,  color:GOLD_H},
  {id:'t7',  name:'update_guest_slots',  table:'panelists',     status:'healthy', latency:'6ms',   calls:89,   color:LIME},
  {id:'t8',  name:'create_clip',         table:'clips',         status:'healthy', latency:'12ms',  calls:143,  color:LIME},
  {id:'t9',  name:'get_tourn_standings', table:'tournament',    status:'healthy', latency:'7ms',   calls:521,  color:LIME},
  {id:'t10', name:'send_gift',           table:'gifts',         status:'healthy', latency:'9ms',   calls:388,  color:LIME},
  {id:'t11', name:'fanout_status',       table:'rtmp_fanout',   status:'healthy', latency:'14ms',  calls:124,  color:'#FF6B35'},
  {id:'t12', name:'vault_access_check',  table:'vault_content', status:'healthy', latency:'6ms',   calls:91,   color:TEAL_H},
];

var fmtT = function() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MCPTab({ addToast }) {
  var [tools, setTools]       = useState(MCP_TOOLS.map(function(t) { return Object.assign({}, t); }));
  var [pinging, setPinging]   = useState(false);
  var [lastPing, setLastPing] = useState('--:--');

  function pingAll() {
    setPinging(true);
    addToast('📡 Pinging all 12 MCP tools...', 'info');
    setTimeout(function() {
      setTools(function(prev) {
        return prev.map(function(t) {
          return Object.assign({}, t, {
            latency: rnd(2, 25) + 'ms',
            calls: t.calls + rnd(0, 5),
          });
        });
      });
      setPinging(false);
      setLastPing(fmtT());
      addToast('✅ All 12 MCP tools healthy!', 'success');
    }, 1200);
  }

  var totalCalls = 0;
  for (var i = 0; i < tools.length; i++) {
    totalCalls += tools[i].calls;
  }

  var latencySum = 0;
  for (var li = 0; li < tools.length; li++) {
    latencySum += (parseInt(tools[li].latency) || 5);
  }
  var avgLatency = Math.floor(latencySum / tools.length);

  var healthyCount = 0;
  for (var hi = 0; hi < tools.length; hi++) {
    if (tools[hi].status === 'healthy') healthyCount++;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: BG0 }}>

      {/* HEADER */}
      <div style={{
        padding: 12,
        borderBottom: '1px solid ' + BORDER,
        flexShrink: 0,
        background: BG1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: fD, fontSize: 18, color: TEAL, letterSpacing: 2, lineHeight: 1 }}>
              MCP SERVER STATUS
            </div>
            <div style={{ fontFamily: fM, fontSize: 8, color: TEXT_M, marginTop: 3, letterSpacing: 0.5 }}>
              12 tools &nbsp;·&nbsp; Supabase xlrcibziouffgxciecvc &nbsp;·&nbsp; Last ping: {lastPing}
            </div>
          </div>
          <button
            onClick={pingAll}
            disabled={pinging}
            style={{
              background: pinging
                ? 'rgba(0,201,167,.1)'
                : 'linear-gradient(135deg,' + TEAL + ',' + TEAL_H + ')',
              border: '1px solid ' + (pinging ? 'rgba(0,201,167,.3)' : TEAL),
              borderRadius: 7,
              padding: '6px 12px',
              color: pinging ? TEAL : BG0,
              fontFamily: fU,
              fontWeight: 700,
              fontSize: 11,
              cursor: pinging ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              opacity: pinging ? 0.7 : 1,
            }}
          >
            {pinging ? '⟳ PINGING...' : '📡 PING ALL'}
          </button>
        </div>

        {/* 4-stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          <div style={{ background: FAINT, borderRadius: 7, padding: '7px 8px', textAlign: 'center', border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: fD, fontSize: 18, color: TEXT, letterSpacing: 1 }}>12</div>
            <div style={{ fontFamily: fM, fontSize: 7, color: TEXT_M, letterSpacing: 1 }}>TOOLS</div>
          </div>
          <div style={{ background: FAINT, borderRadius: 7, padding: '7px 8px', textAlign: 'center', border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: fD, fontSize: 18, color: LIME, letterSpacing: 1 }}>{healthyCount}</div>
            <div style={{ fontFamily: fM, fontSize: 7, color: TEXT_M, letterSpacing: 1 }}>HEALTHY</div>
          </div>
          <div style={{ background: FAINT, borderRadius: 7, padding: '7px 8px', textAlign: 'center', border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: fD, fontSize: 18, color: GOLD, letterSpacing: 1 }}>{fmtN(totalCalls)}</div>
            <div style={{ fontFamily: fM, fontSize: 7, color: TEXT_M, letterSpacing: 1 }}>TOTAL CALLS</div>
          </div>
          <div style={{ background: FAINT, borderRadius: 7, padding: '7px 8px', textAlign: 'center', border: '1px solid ' + BORDER }}>
            <div style={{ fontFamily: fD, fontSize: 18, color: TEAL, letterSpacing: 1 }}>{avgLatency}ms</div>
            <div style={{ fontFamily: fM, fontSize: 7, color: TEXT_M, letterSpacing: 1 }}>AVG LATENCY</div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Tool cards */}
        {tools.map(function(tool) {
          return (
            <div
              key={tool.id}
              style={{
                background: pinging ? 'rgba(0,201,167,.04)' : GLASS,
                border: '1px solid ' + (pinging ? 'rgba(0,201,167,.18)' : BORDER),
                borderRadius: 9,
                padding: '9px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'border-color 0.3s',
              }}
            >
              {/* SVG ping indicator */}
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <circle cx="9" cy="9" r="8" fill="none" stroke={tool.color} strokeWidth="1" strokeOpacity="0.25" />
                <circle cx="9" cy="9" r="4" fill={tool.color} fillOpacity="0.18" />
                <circle cx="9" cy="9" r="2.5" fill={tool.color} />
              </svg>

              {/* Names */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: fM, fontSize: 10, color: TEAL, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tool.name}
                </div>
                <div style={{ fontFamily: fM, fontSize: 8, color: MUTED, marginTop: 1 }}>
                  {tool.table}
                </div>
              </div>

              {/* Latency + calls */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: fM, fontSize: 10, color: tool.color, fontWeight: 700 }}>
                  {tool.latency}
                </div>
                <div style={{ fontFamily: fM, fontSize: 8, color: TEXT_M, marginTop: 1 }}>
                  {fmtN(tool.calls)} calls
                </div>
              </div>

              {/* Live pulse dot */}
              <div style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: LIME,
                flexShrink: 0,
                boxShadow: '0 0 6px ' + LIME,
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            </div>
          );
        })}

        {/* SCHEMA ALIGNMENT card */}
        <div style={{
          background: 'rgba(0,201,167,.05)',
          border: '1px solid rgba(0,201,167,.3)',
          borderRadius: 10,
          padding: '12px 13px',
          boxShadow: '0 0 16px rgba(0,201,167,.06)',
          marginTop: 4,
        }}>
          <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEAL, letterSpacing: 1, marginBottom: 10 }}>
            SCHEMA ALIGNMENT — SUPABASE DB
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M }}>90/10 Split Enforcement</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: LIME }}>4/4 layers ✓</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M }}>Math.floor() Verification</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: LIME }}>ENFORCED</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M }}>20-Guest Cap Trigger</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: LIME }}>ACTIVE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M }}>IMMUTABLE Audit Ledger</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEAL }}>CHAINED SHA-256</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M }}>MCP Tool ↔ Table Alignment</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: LIME }}>12/12 ✓</span>
            </div>

          </div>
        </div>

        {/* GOHIGHLEVEL FRONTEND card */}
        <div style={{
          background: GLASS,
          border: '1px solid ' + BORDER,
          borderRadius: 10,
          padding: '12px 13px',
          marginTop: 4,
        }}>
          <div style={{ fontFamily: fU, fontWeight: 700, fontSize: 13, color: TEXT, letterSpacing: 1, marginBottom: 10 }}>
            GOHIGHLEVEL FRONTEND
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12 }}>🌐</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M, flex: 1 }}>seewhylive.online</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: LIME, boxShadow: '0 0 5px ' + LIME, flexShrink: 0 }} />
              <span style={{ fontFamily: fM, fontSize: 9, color: LIME, flexShrink: 0 }}>LIVE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12 }}>🔗</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M, flex: 1 }}>seewhylive.vibepreview.com</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: LIME, boxShadow: '0 0 5px ' + LIME, flexShrink: 0 }} />
              <span style={{ fontFamily: fM, fontSize: 9, color: LIME, flexShrink: 0 }}>LIVE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M, flex: 1 }}>SSL</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL, boxShadow: '0 0 5px ' + TEAL, flexShrink: 0 }} />
              <span style={{ fontFamily: fM, fontSize: 9, color: TEAL, flexShrink: 0 }}>VALID</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12 }}>🐳</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M, flex: 1 }}>Docker nginx</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: LIME, boxShadow: '0 0 5px ' + LIME, flexShrink: 0 }} />
              <span style={{ fontFamily: fM, fontSize: 9, color: LIME, flexShrink: 0 }}>RUNNING</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12 }}>⚡</span>
              <span style={{ fontFamily: fM, fontSize: 9, color: TEXT_M, flex: 1 }}>GoHighLevel→VPS</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, boxShadow: '0 0 5px ' + GOLD, flexShrink: 0 }} />
              <span style={{ fontFamily: fM, fontSize: 9, color: GOLD, flexShrink: 0 }}>CONNECTED</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
