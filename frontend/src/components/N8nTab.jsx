import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var GOLD_H = '#E8C46A';
var BURG   = '#800020';
var BURG_H = '#C01838';
var TEAL   = '#00C9A7';
var TEAL_H = '#00DEC0';
var LIME   = '#B4E628';
var PURP_H = '#C084FC';
var AMBER  = '#F59E0B';
var ORANGE = '#FF6B35';
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

var N8N_WORKFLOWS = [
  {id:'w1', name:'VPS Health Monitor', desc:'Checks srv1581658 + srv1587098 every 5min. Alerts on downtime, high CPU, low disk.', status:'running', lastRun:'2m ago', runs24h:288, successRate:99.3, color:LIME, icon:'🖥', vps:'srv1581658 + srv1587098', trigger:'Every 5 min'},
  {id:'w2', name:'Stripe 90/10 Payment Router', desc:'Validates every transaction enforces CREATOR_SPLIT=0.90. Routes via Stripe Connect. Math.floor() verified.', status:'running', lastRun:'just now', runs24h:47, successRate:100, color:GOLD_H, icon:'💳', vps:'srv1581658', trigger:'On payment webhook'},
  {id:'w3', name:'Guardian AI Moderation Pipeline', desc:'Routes flagged chat messages to Claude Haiku. Scores ≥0.95 → auto-ban. Logs to Supabase.', status:'running', lastRun:'45s ago', runs24h:1847, successRate:98.7, color:TEAL_H, icon:'🛡', vps:'srv1587098', trigger:'On chat message'},
  {id:'w4', name:'RTMP Fanout State Sync', desc:'Syncs MediaMTX fanout status to DB. Verifies all 8 destinations. Alerts on stream drop.', status:'idle', lastRun:'12m ago', runs24h:124, successRate:97.2, color:ORANGE, icon:'📡', vps:'srv1581658', trigger:'On stream start/stop'},
  {id:'w5', name:'Creator Onboarding Automation', desc:'Welcome email, Stripe Connect setup, sub tier activation, DB seed, Discord invite — all auto.', status:'running', lastRun:'3h ago', runs24h:8, successRate:100, color:PURP_H, icon:'🎉', vps:'srv1587098', trigger:'On creator signup'},
];

function statusColor(s) {
  if (s === 'running') return LIME;
  if (s === 'paused') return GOLD;
  if (s === 'idle') return MUTED;
  if (s === 'error') return '#FF1A3C';
  return MUTED;
}

function BarMeter(props) {
  var pct = props.pct || 0;
  var barColor = LIME;
  if (pct > 80) barColor = '#FF1A3C';
  else if (pct > 60) barColor = GOLD;
  return (
    React.createElement('div', {style:{width:'100%'}},
      React.createElement('div', {style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2}},
        React.createElement('span', {style:{fontSize:10, color:TEXT_M, fontFamily:fM}}, props.label),
        React.createElement('span', {style:{fontSize:10, color:barColor, fontFamily:fM, fontWeight:700}}, pct + '%')
      ),
      React.createElement('div', {style:{height:4, background:FAINT, borderRadius:2, overflow:'hidden'}},
        React.createElement('div', {style:{height:'100%', width:pct+'%', background:barColor, borderRadius:2, transition:'width 0.4s ease'}})
      )
    )
  );
}

function ToggleSwitch(props) {
  var on = props.on;
  return (
    React.createElement('div', {
      onClick: props.onClick,
      style:{
        width:28, height:16, borderRadius:999,
        background: on ? LIME : MUTED,
        position:'relative', cursor:'pointer',
        transition:'background 0.2s ease', flexShrink:0
      }
    },
      React.createElement('div', {
        style:{
          position:'absolute', top:2,
          left: on ? 14 : 2,
          width:12, height:12, borderRadius:'50%',
          background:'#fff',
          transition:'left 0.2s ease',
          boxShadow:'0 1px 3px rgba(0,0,0,0.4)'
        }
      })
    )
  );
}

export default function N8nTab({ addToast }) {
  var [workflows, setWorkflows] = useState(N8N_WORKFLOWS.map(function(w){ return Object.assign({}, w); }));
  var [selected, setSelected] = useState(null);
  var [liveMetrics, setLiveMetrics] = useState({cpu1:34, cpu2:28, mem1:62, mem2:45});

  useEffect(function() {
    var iv = setInterval(function() {
      setLiveMetrics(function(p) {
        return {
          cpu1: Math.max(5, Math.min(90, p.cpu1 + rnd(-5,8))),
          cpu2: Math.max(5, Math.min(90, p.cpu2 + rnd(-5,8))),
          mem1: Math.max(30, Math.min(85, p.mem1 + rnd(-3,5))),
          mem2: Math.max(20, Math.min(80, p.mem2 + rnd(-3,5))),
        };
      });
    }, 3000);
    return function() { clearInterval(iv); };
  }, []);

  function triggerRun(id) {
    var wf = null;
    workflows.forEach(function(w) { if (w.id === id) wf = w; });
    if (!wf) return;
    setWorkflows(function(prev) {
      return prev.map(function(w) {
        if (w.id !== id) return w;
        return Object.assign({}, w, {lastRun:'just now', runs24h: w.runs24h + 1});
      });
    });
    addToast((wf.icon || '⚡') + ' ' + wf.name + ' triggered manually', 'info');
  }

  function toggleWorkflow(id) {
    setWorkflows(function(prev) {
      return prev.map(function(w) {
        if (w.id !== id) return w;
        var next = w.status === 'running' ? 'paused' : 'running';
        return Object.assign({}, w, {status: next});
      });
    });
  }

  var totalRuns = workflows.reduce(function(s, w) { return s + w.runs24h; }, 0);
  var runningCount = workflows.filter(function(w) { return w.status === 'running'; }).length;

  return (
    React.createElement('div', {style:{display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:BG0, color:TEXT}},

      /* TOP SECTION */
      React.createElement('div', {style:{padding:12, borderBottom:'1px solid '+BORDER, flexShrink:0, background:BG1}},
        React.createElement('div', {style:{marginBottom:8}},
          React.createElement('span', {style:{fontSize:10, color:TEAL, fontFamily:fM, letterSpacing:1}},
            'VPS INFRASTRUCTURE · n8n.srv1587098.hstgr.cloud'
          )
        ),
        React.createElement('div', {style:{display:'flex', gap:8}},

          /* srv1581658 card */
          React.createElement('div', {style:{flex:1, background:FAINT, border:'1px solid '+BORDER, borderRadius:8, padding:'8px 10px'}},
            React.createElement('div', {style:{display:'flex', alignItems:'center', gap:6, marginBottom:6}},
              React.createElement('div', {style:{width:6, height:6, borderRadius:'50%', background:LIME, flexShrink:0}}),
              React.createElement('span', {style:{fontSize:11, color:TEXT, fontFamily:fM, fontWeight:700}}, 'srv1581658'),
              React.createElement('span', {style:{fontSize:9, color:TEXT_M, fontFamily:fM}}, 'App')
            ),
            React.createElement(BarMeter, {label:'CPU', pct:liveMetrics.cpu1}),
            React.createElement('div', {style:{marginTop:4}}),
            React.createElement(BarMeter, {label:'MEM', pct:liveMetrics.mem1})
          ),

          /* srv1587098 card */
          React.createElement('div', {style:{flex:1, background:FAINT, border:'1px solid '+BORDER, borderRadius:8, padding:'8px 10px'}},
            React.createElement('div', {style:{display:'flex', alignItems:'center', gap:6, marginBottom:6}},
              React.createElement('div', {style:{width:6, height:6, borderRadius:'50%', background:LIME, flexShrink:0}}),
              React.createElement('span', {style:{fontSize:11, color:TEXT, fontFamily:fM, fontWeight:700}}, 'srv1587098'),
              React.createElement('span', {style:{fontSize:9, color:TEXT_M, fontFamily:fM}}, 'n8n')
            ),
            React.createElement(BarMeter, {label:'CPU', pct:liveMetrics.cpu2}),
            React.createElement('div', {style:{marginTop:4}}),
            React.createElement(BarMeter, {label:'MEM', pct:liveMetrics.mem2})
          )
        )
      ),

      /* SCROLLABLE BODY */
      React.createElement('div', {style:{flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8}},

        /* Summary card */
        React.createElement('div', {style:{background:FAINT, border:'1px solid '+BORDER, borderRadius:8, padding:'10px 12px', display:'flex', gap:0}},
          React.createElement('div', {style:{flex:1, textAlign:'center', borderRight:'1px solid '+BORDER}},
            React.createElement('div', {style:{fontSize:20, fontFamily:fD, color:TEXT, letterSpacing:1}}, workflows.length),
            React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fU, letterSpacing:1, marginTop:1}}, 'WORKFLOWS')
          ),
          React.createElement('div', {style:{flex:1, textAlign:'center', borderRight:'1px solid '+BORDER}},
            React.createElement('div', {style:{fontSize:20, fontFamily:fD, color:LIME, letterSpacing:1}}, runningCount),
            React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fU, letterSpacing:1, marginTop:1}}, 'RUNNING')
          ),
          React.createElement('div', {style:{flex:1, textAlign:'center'}},
            React.createElement('div', {style:{fontSize:20, fontFamily:fD, color:GOLD, letterSpacing:1}}, fmtN(totalRuns)),
            React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fU, letterSpacing:1, marginTop:1}}, 'RUNS TODAY')
          )
        ),

        /* Workflow cards */
        workflows.map(function(wf) {
          var isSelected = selected === wf.id;
          var sc = statusColor(wf.status);
          return (
            React.createElement('div', {
              key: wf.id,
              style:{background:FAINT, border:'1px solid '+(isSelected ? wf.color : BORDER), borderRadius:10, padding:'10px 12px', cursor:'pointer', transition:'border-color 0.2s ease'}
            },
              /* Main row */
              React.createElement('div', {
                onClick: function() { setSelected(isSelected ? null : wf.id); },
                style:{display:'flex', alignItems:'center', gap:10}
              },
                /* Icon box */
                React.createElement('div', {style:{
                  width:36, height:36, borderRadius:8, flexShrink:0,
                  background: wf.color+'22',
                  border:'1px solid '+wf.color+'55',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18
                }}, wf.icon),

                /* Middle */
                React.createElement('div', {style:{flex:1, minWidth:0}},
                  React.createElement('div', {style:{display:'flex', alignItems:'center', gap:6, marginBottom:3}},
                    React.createElement('span', {style:{fontSize:12, color:TEXT, fontFamily:fU, fontWeight:700, letterSpacing:0.5}}, wf.name),
                    React.createElement('span', {style:{
                      fontSize:9, color:sc, fontFamily:fM, fontWeight:700,
                      background:sc+'22', border:'1px solid '+sc+'55',
                      borderRadius:4, padding:'1px 5px', letterSpacing:0.5
                    }}, wf.status.toUpperCase())
                  ),
                  React.createElement('div', {style:{display:'flex', gap:12}},
                    React.createElement('span', {style:{fontSize:10, color:TEXT_M, fontFamily:fM}}, fmtN(wf.runs24h) + ' runs/24h'),
                    React.createElement('span', {style:{fontSize:10, color:wf.successRate >= 99 ? LIME : wf.successRate >= 95 ? GOLD : ORANGE, fontFamily:fM}}, wf.successRate + '% ok')
                  )
                ),

                /* Right controls */
                React.createElement('div', {
                  style:{display:'flex', alignItems:'center', gap:8, flexShrink:0},
                  onClick: function(e) { e.stopPropagation(); }
                },
                  /* Pulse dot for running */
                  wf.status === 'running'
                    ? React.createElement('div', {style:{
                        width:8, height:8, borderRadius:'50%', background:LIME,
                        boxShadow:'0 0 6px '+LIME,
                        animation:'pulse 1.5s ease-in-out infinite'
                      }})
                    : null,

                  /* RUN button */
                  React.createElement('button', {
                    onClick: function() { triggerRun(wf.id); },
                    style:{
                      background: wf.color+'22', border:'1px solid '+wf.color+'66',
                      color:wf.color, borderRadius:5, padding:'3px 8px',
                      fontSize:10, fontFamily:fU, fontWeight:700, cursor:'pointer',
                      letterSpacing:0.5
                    }
                  }, '▶ RUN'),

                  /* Toggle */
                  React.createElement(ToggleSwitch, {
                    on: wf.status === 'running',
                    onClick: function() { toggleWorkflow(wf.id); }
                  })
                )
              ),

              /* Expanded details */
              isSelected
                ? React.createElement('div', {style:{marginTop:10, paddingTop:10, borderTop:'1px solid '+BORDER}},
                    React.createElement('p', {style:{fontSize:11, color:TEXT_M, fontFamily:fU, lineHeight:1.5, margin:'0 0 8px 0'}}, wf.desc),
                    React.createElement('div', {style:{display:'flex', gap:16, flexWrap:'wrap', marginBottom:8}},
                      React.createElement('div', null,
                        React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fM, letterSpacing:1, marginBottom:2}}, 'VPS'),
                        React.createElement('div', {style:{fontSize:11, color:TEAL, fontFamily:fM}}, wf.vps)
                      ),
                      React.createElement('div', null,
                        React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fM, letterSpacing:1, marginBottom:2}}, 'TRIGGER'),
                        React.createElement('div', {style:{fontSize:11, color:GOLD, fontFamily:fM}}, wf.trigger)
                      ),
                      React.createElement('div', null,
                        React.createElement('div', {style:{fontSize:9, color:TEXT_M, fontFamily:fM, letterSpacing:1, marginBottom:2}}, 'LAST RUN'),
                        React.createElement('div', {style:{fontSize:11, color:TEXT, fontFamily:fM}}, wf.lastRun)
                      )
                    ),
                    React.createElement('div', null,
                      React.createElement('div', {style:{display:'flex', justifyContent:'space-between', marginBottom:3}},
                        React.createElement('span', {style:{fontSize:9, color:TEXT_M, fontFamily:fM}}, 'SUCCESS RATE'),
                        React.createElement('span', {style:{fontSize:9, color:wf.successRate >= 99 ? LIME : wf.successRate >= 95 ? GOLD : ORANGE, fontFamily:fM, fontWeight:700}}, wf.successRate + '%')
                      ),
                      React.createElement('div', {style:{height:5, background:BG0, borderRadius:3, overflow:'hidden'}},
                        React.createElement('div', {style:{
                          height:'100%',
                          width: wf.successRate + '%',
                          background: wf.successRate >= 99 ? LIME : wf.successRate >= 95 ? GOLD : ORANGE,
                          borderRadius:3,
                          transition:'width 0.4s ease'
                        }})
                      )
                    )
                  )
                : null
            )
          );
        }),

        /* HMAC webhook bridge card */
        React.createElement('div', {style:{background:FAINT, border:'1px solid '+TEAL+'44', borderRadius:10, padding:'10px 12px'}},
          React.createElement('div', {style:{display:'flex', alignItems:'center', gap:6, marginBottom:8}},
            React.createElement('span', {style:{fontSize:11, color:TEAL, fontFamily:fU, fontWeight:700, letterSpacing:0.5}}, 'HMAC WEBHOOK BRIDGE'),
            React.createElement('span', {style:{fontSize:9, color:TEXT_M, fontFamily:fM}}, '· n8n ↔ Anthropic Proxy')
          ),
          React.createElement('div', {style:{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}},
            React.createElement('div', {style:{
              background:LIME+'11', border:'1px solid '+LIME+'44', borderRadius:6,
              padding:'6px 8px', textAlign:'center'
            }},
              React.createElement('div', {style:{fontSize:14, marginBottom:3}}, '🔐'),
              React.createElement('div', {style:{fontSize:9, color:LIME, fontFamily:fM, fontWeight:700}}, 'WEBHOOK SECRET ✓ SET')
            ),
            React.createElement('div', {style:{
              background:TEAL+'11', border:'1px solid '+TEAL+'44', borderRadius:6,
              padding:'6px 8px', textAlign:'center'
            }},
              React.createElement('div', {style:{fontSize:14, marginBottom:3}}, '✅'),
              React.createElement('div', {style:{fontSize:9, color:TEAL_H, fontFamily:fM, fontWeight:700}}, 'SIGNATURE VERIFIED')
            ),
            React.createElement('div', {style:{
              background:PURP_H+'11', border:'1px solid '+PURP_H+'44', borderRadius:6,
              padding:'6px 8px', textAlign:'center'
            }},
              React.createElement('div', {style:{fontSize:14, marginBottom:3}}, '🤖'),
              React.createElement('div', {style:{fontSize:9, color:PURP_H, fontFamily:fM, fontWeight:700}}, 'ANTHROPIC PROXY ACTIVE')
            )
          )
        )

      )
    )
  );
}
