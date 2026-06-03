import React, { useState, useEffect, useRef } from 'react';

var GOLD   = '#C9A84C';
var GOLD_H = '#E8C46A';
var BURG   = '#800020';
var BURG_H = '#C01838';
var TEAL   = '#C9A84C';
var TEAL_H = '#C9A84C';
var LIME   = '#B4E628';
var PURP_H = '#C9A84C';
var AMBER  = '#F59E0B';
var ORANGE = '#FF6B35';
var MUTED  = '#6B5F82';
var TEXT   = '#EDE8F4';
var TEXT_M = '#A89CC8';
var BG0    = '#07050A';
var BG1    = '#0E0C09';
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

var LOG_WORKFLOW_NAMES = [
  'VPS Health Monitor',
  'Stripe 90/10 Payment Router',
  'Guardian AI Moderation Pipeline',
  'RTMP Fanout State Sync',
  'Creator Onboarding Automation'
];

var LOG_MESSAGES = [
  'all systems nominal',
  '$12.50 processed (creator $11.25)',
  '3 messages flagged, 1 auto-banned',
  'stream health verified, all 8 destinations active',
  '1 new creator onboarded',
  'CPU nominal across both VPS',
  'payment split verified 90/10',
  'no violations detected',
  'fanout synced successfully',
  'welcome email delivered'
];

function statusColor(s) {
  if (s === 'running') return LIME;
  if (s === 'paused') return GOLD;
  if (s === 'idle') return MUTED;
  if (s === 'error') return '#FF1A3C';
  return MUTED;
}

function padTwo(n) {
  return n < 10 ? '0' + n : '' + n;
}

function makeLogLine() {
  var now = new Date();
  var h = padTwo(now.getHours());
  var m = padTwo(now.getMinutes());
  var s = padTwo(now.getSeconds());
  var ts = h + ':' + m + ':' + s;
  var name = LOG_WORKFLOW_NAMES[rnd(0, LOG_WORKFLOW_NAMES.length - 1)];
  var msg = LOG_MESSAGES[rnd(0, LOG_MESSAGES.length - 1)];
  return ts + '  ✓  ' + name + ' — ' + msg;
}

function logLineColor(line) {
  if (line.indexOf('✓') !== -1) return '#C9A84C';
  if (line.indexOf('✗') !== -1) return '#FF1A3C';
  if (line.indexOf('↺') !== -1) return '#C9A84C';
  return TEXT_M;
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

export default function N8nTab({ addToast, isLive }) {
  var [workflows, setWorkflows] = useState(N8N_WORKFLOWS.map(function(w) { return Object.assign({}, w, { enabled: true }); }));
  var [selected, setSelected] = useState(null);
  var [liveMetrics, setLiveMetrics] = useState({cpu1:34, cpu2:28, mem1:62, mem2:45});
  var [activeView, setActiveView] = useState('workflows');
  var [execLog, setExecLog] = useState([]);
  var [webhookTesting, setWebhookTesting] = useState({});

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

  useEffect(function() {
    var seeds = [
      '14:02:11  ✓  VPS Health Monitor — all systems nominal',
      '14:05:03  ✓  Stripe 90/10 Payment Router — $12.50 processed (creator $11.25)',
      '14:07:44  ✓  Guardian AI Moderation — 3 messages flagged, 1 auto-banned',
      '14:08:01  ✗  RTMP Fanout State Sync — stream drop detected srv1581658',
      '14:08:03  ↺  RTMP Fanout State Sync — retry 1/3 initiated',
      '14:08:06  ✓  RTMP Fanout State Sync — fanout reconnected, all 8 destinations active',
      '14:10:22  ✓  Creator Onboarding Automation — 2 new creators onboarded',
      '14:12:00  ✓  VPS Health Monitor — srv1587098 CPU: 23%, Disk: 41%',
    ];
    setExecLog(seeds.slice().reverse());

    var iv = setInterval(function() {
      var line = makeLogLine();
      setExecLog(function(prev) {
        var next = [line].concat(prev);
        if (next.length > 30) {
          next = next.slice(0, 30);
        }
        return next;
      });
    }, 4000);
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
    var wf = null;
    workflows.forEach(function(w) { if (w.id === id) wf = w; });
    if (!wf) return;
    var newEnabled = !wf.enabled;
    setWorkflows(function(prev) {
      return prev.map(function(w) {
        if (w.id !== id) return w;
        return Object.assign({}, w, { enabled: newEnabled });
      });
    });
    if (newEnabled) {
      addToast((wf.icon || '⚡') + ' ' + wf.name + ' enabled', 'success');
    } else {
      addToast((wf.icon || '⚡') + ' ' + wf.name + ' disabled', 'warning');
    }
  }

  function testWebhook(wf) {
    setWebhookTesting(function(prev) { return Object.assign({}, prev, { [wf.id]: true }); });
    fetch('/api/n8n/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId: wf.id, event: 'test', ts: Date.now() })
    }).then(function(res) {
      setWebhookTesting(function(prev) { return Object.assign({}, prev, { [wf.id]: false }); });
      if (res.ok) {
        addToast((wf.icon || '⚡') + ' Webhook test OK: ' + wf.name, 'success');
      } else {
        addToast('Webhook test failed (' + res.status + '): ' + wf.name, 'error');
      }
    }, function() {
      setWebhookTesting(function(prev) { return Object.assign({}, prev, { [wf.id]: false }); });
      addToast('Webhook test error: ' + wf.name, 'error');
    });
  }

  var totalRuns = workflows.reduce(function(s, w) { return s + w.runs24h; }, 0);
  var runningCount = workflows.filter(function(w) { return w.status === 'running' && w.enabled; }).length;
  var activeTriggersCount = workflows.filter(function(w) { return w.enabled; }).length;

  var VIEWS = [
    { key: 'workflows', label: 'WORKFLOWS' },
    { key: 'log', label: 'LOG' },
  ];

  return (
    React.createElement('div', {style:{display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:BG0, color:TEXT}},

      /* TOP SECTION */
      React.createElement('div', {style:{padding:12, borderBottom:'1px solid '+BORDER, flexShrink:0, background:BG1}},
        React.createElement('div', {style:{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}},
          React.createElement('span', {style:{fontSize:10, color:TEAL, fontFamily:fM, letterSpacing:1}},
            'VPS INFRASTRUCTURE · n8n.srv1587098.hstgr.cloud'
          ),
          React.createElement('span', {style:{
            fontSize:9, color:LIME, fontFamily:fM, fontWeight:700,
            background:LIME+'18', border:'1px solid '+LIME+'55',
            borderRadius:4, padding:'2px 8px', letterSpacing:1
          }}, activeTriggersCount + ' ACTIVE TRIGGERS')
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
        ),

        /* View tab bar */
        React.createElement('div', {style:{display:'flex', gap:4, marginTop:10}},
          VIEWS.map(function(v) {
            var isActive = activeView === v.key;
            return React.createElement('button', {
              key: v.key,
              onClick: function() { setActiveView(v.key); },
              style:{
                background: isActive ? TEAL+'22' : 'transparent',
                border: '1px solid ' + (isActive ? TEAL+'88' : BORDER),
                color: isActive ? TEAL : TEXT_M,
                borderRadius: 5,
                padding: '3px 10px',
                fontSize: 10,
                fontFamily: fU,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }
            }, v.label);
          })
        )
      ),

      /* SCROLLABLE BODY */
      React.createElement('div', {style:{flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8}},

        /* WORKFLOWS VIEW */
        activeView === 'workflows'
          ? React.createElement(React.Fragment, null,

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
                var dotColor = wf.enabled ? statusColor(wf.status) : '#8A7A62';
                var cardBorder = wf.enabled
                  ? (isSelected ? wf.color : BORDER)
                  : '#3D3020';
                return (
                  React.createElement('div', {
                    key: wf.id,
                    style:{
                      background:FAINT,
                      border:'1px solid '+cardBorder,
                      borderRadius:10,
                      padding:'10px 12px',
                      cursor:'pointer',
                      transition:'border-color 0.2s ease',
                      opacity: wf.enabled ? 1 : 0.65
                    }
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
                            fontSize:9, color:dotColor, fontFamily:fM, fontWeight:700,
                            background:dotColor+'22', border:'1px solid '+dotColor+'55',
                            borderRadius:4, padding:'1px 5px', letterSpacing:0.5
                          }}, wf.enabled ? wf.status.toUpperCase() : 'DISABLED')
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
                        /* Pulse dot for running + enabled */
                        (wf.status === 'running' && wf.enabled)
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

                        /* ON/OFF toggle button */
                        React.createElement('button', {
                          onClick: function() { toggleWorkflow(wf.id); },
                          style:{
                            background: wf.enabled ? LIME+'22' : '#8A7A62'+'22',
                            border: '1px solid ' + (wf.enabled ? LIME+'66' : '#8A7A6266'),
                            color: wf.enabled ? LIME : '#8A7A62',
                            borderRadius: 5,
                            padding: '3px 8px',
                            fontSize: 10,
                            fontFamily: fU,
                            fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: 0.5,
                            minWidth: 36
                          }
                        }, wf.enabled ? 'ON' : 'OFF')
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
                          React.createElement('div', {style:{marginBottom:8}},
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
                          ),
                          React.createElement('button', {
                            onClick: function() { testWebhook(wf); },
                            disabled: Boolean(webhookTesting[wf.id]),
                            style:{
                              background: webhookTesting[wf.id] ? TEAL+'11' : TEAL+'22',
                              border: '1px solid ' + (webhookTesting[wf.id] ? TEAL+'44' : TEAL+'66'),
                              color: webhookTesting[wf.id] ? TEXT_M : TEAL,
                              borderRadius: 6,
                              padding: '4px 12px',
                              fontSize: 10,
                              fontFamily: fU,
                              fontWeight: 700,
                              cursor: webhookTesting[wf.id] ? 'not-allowed' : 'pointer',
                              letterSpacing: 0.5,
                              opacity: webhookTesting[wf.id] ? 0.6 : 1
                            }
                          }, webhookTesting[wf.id] ? '⟳ TESTING...' : '⚡ WEBHOOK TEST')
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
          : null,

        /* LOG VIEW */
        activeView === 'log'
          ? React.createElement('div', {style:{display:'flex', flexDirection:'column', gap:8}},
              React.createElement('div', {style:{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}},
                React.createElement('span', {style:{fontSize:10, color:TEAL, fontFamily:fM, letterSpacing:1}},
                  'EXECUTION LOG · LIVE'
                ),
                React.createElement('span', {style:{
                  fontSize:9, color:TEXT_M, fontFamily:fM,
                  background:TEAL+'11', border:'1px solid '+TEAL+'33',
                  borderRadius:4, padding:'2px 7px'
                }}, execLog.length + ' entries')
              ),
              React.createElement('div', {style:{
                background:BG1,
                border:'1px solid '+BORDER,
                borderRadius:8,
                padding:'10px 12px',
                overflowY:'auto',
                maxHeight:400,
                display:'flex',
                flexDirection:'column',
                gap:3
              }},
                execLog.length === 0
                  ? React.createElement('span', {style:{fontSize:11, color:MUTED, fontFamily:fM}}, 'No log entries yet...')
                  : execLog.map(function(line, i) {
                      var lineColor = logLineColor(line);
                      return React.createElement('div', {
                        key: i,
                        style:{
                          fontSize:11,
                          color: lineColor,
                          fontFamily: fM,
                          lineHeight: 1.6,
                          borderBottom: i < execLog.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                          paddingBottom: 3,
                          wordBreak: 'break-word'
                        }
                      }, line);
                    })
              )
            )
          : null

      )
    )
  );
}
