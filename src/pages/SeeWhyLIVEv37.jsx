/**
 * SeeWhyLIVEv37 — Integrated 13-Panel Creator Hub
 * All AI calls use base44.integrations.Core.InvokeLLM
 * Earth-tone palette only — no forbidden colors
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { isSafeUrl } from '@/lib/security';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useWebRTCPeers } from '../hooks/useWebRTCPeers';
import { useVODRecording } from '../hooks/useVODRecording';
import { useAutoSpeakGate } from '../hooks/useAutoSpeakGate';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReactionOverlay from '../components/watchparty/ReactionOverlay';
import WatchPartyAnalytics from '../components/watchparty/WatchPartyAnalytics';
import LiveAuctionWidget from '../components/monetization/LiveAuctionWidget';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import GreenroomQueue from '../components/streaming/GreenroomQueue';
import SocialLeaderboard from '../components/watchparty/SocialLeaderboard';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import StreamGoals from '../components/live/StreamGoals';
import ShareToSocial from '../components/social/ShareToSocial';
import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';

// ── Palette (earth-tone, no forbidden colors) ──────────────────────────────
const C = {
  bg:      '#07050A',
  bg2:     '#0D0A08',
  bg3:     '#13100A',
  bg4:     '#1A1608',
  gold:    '#C9A84C',
  goldD:   '#8A6F2E',
  ruby:    '#8B1A2F',
  rubyL:   '#B22340',
  slate:   '#2A2418',
  slateL:  '#3D3520',
  slate2:  '#1E1A0E',
  text:    '#F0E8D4',
  textD:   '#C4B596',
  textM:   '#8A7A62',
  green:   '#6DBF7E',
  red:     '#C0392B',
  blue:    '#D4AF37',
  purple:  '#D4854A',
  amber:   '#D4854A',
  orange:  '#D4854A',
  teal:    '#6DBF7E',
  warn:    '#D4854A',
  tribute: '#800020',
  tribL:   '#C9A84C',
  state1:  '#D4854A',
  state2:  '#C62828',
};

// ── Small reusable components ──────────────────────────────────────────────

function TabBtn({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: active ? 700 : 400,
        background: active ? C.gold : 'transparent',
        color: active ? C.bg : C.textM,
        whiteSpace: 'nowrap',
        position: 'relative',
        transition: 'all 0.15s',
      }}
    >
      {label}
      {badge ? (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          background: C.ruby, color: '#fff',
          borderRadius: 99, fontSize: 9, padding: '1px 4px',
          fontWeight: 700,
        }}>{badge}</span>
      ) : null}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg3,
      border: `1px solid ${C.slate}`,
      borderRadius: 10,
      padding: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, color, disabled, small, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color || C.gold,
        color: color ? '#fff' : C.bg,
        border: 'none',
        borderRadius: 6,
        padding: small ? '5px 12px' : '8px 18px',
        fontWeight: 700,
        fontSize: small ? 11 : 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type, style, rows }) {
  const common = {
    background: C.bg2,
    border: `1px solid ${C.slate}`,
    borderRadius: 6,
    color: C.text,
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    ...style,
  };
  if (rows) return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={common} />;
  return <input type={type || 'text'} value={value} onChange={onChange} placeholder={placeholder} style={common} />;
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: color || C.slate,
      color: C.textD,
      borderRadius: 99,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
    }}>{label}</span>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18,
      border: `2px solid ${C.slate}`,
      borderTop: `2px solid ${C.gold}`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}

function toast(msg, setToastFn) {
  setToastFn(msg);
  setTimeout(() => setToastFn(''), 2800);
}

// ── STAGE PANEL ────────────────────────────────────────────────────────────
function StagePanel() {
  const [live, setLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [health, setHealth] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const timerRef = useRef(null);

  function startStream() {
    if (!roomName.trim()) { toast('Enter a room name', setToastMsg); return; }
    setLive(true);
    setHealth({ bitrate: 4200, fps: 30, latency: 42, dropped: 0 });
    setViewers(0);
    toast('Stream started!', setToastMsg);
  }

  function endStream() {
    setLive(false);
    setViewers(0);
    setHealth(null);
    if (timerRef.current) clearInterval(timerRef.current);
    toast('Stream ended', setToastMsg);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const metrics = [
    { label: 'Viewers', val: viewers, color: C.gold },
    { label: 'Bitrate', val: health ? `${health.bitrate}kbps` : '—', color: C.teal },
    { label: 'FPS', val: health ? health.fps : '—', color: C.green },
    { label: 'Latency', val: health ? `${health.latency}ms` : '—', color: C.amber },
    { label: 'Dropped', val: health ? health.dropped : '—', color: health && health.dropped > 5 ? C.red : C.textD },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: live ? C.green : C.red,
          boxShadow: live ? `0 0 8px ${C.green}` : 'none',
        }} />
        <span style={{ color: live ? C.green : C.red, fontWeight: 700, fontSize: 14 }}>
          {live ? 'LIVE' : 'OFFLINE'}
        </span>
        {live && <Badge label={`${viewers} viewers`} color={C.goldD} />}
        {toastMsg && <span style={{ color: C.gold, fontSize: 12, marginLeft: 'auto' }}>{toastMsg}</span>}
      </div>

      {!live && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ color: C.textD, fontSize: 12, marginBottom: 8 }}>Room Name</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="e.g. NYC vs LA Dominos" />
            <Btn onClick={startStream} color={C.ruby}>Go Live</Btn>
          </div>
        </Card>
      )}

      {live && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: C.text, fontWeight: 700 }}>{roomName}</span>
            <Btn onClick={endStream} color={C.red} small>End Stream</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px,1fr))', gap: 10 }}>
            {metrics.map(m => (
              <div key={m.label} style={{ background: C.bg2, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ color: m.color, fontWeight: 700, fontSize: 18 }}>{m.val}</div>
                <div style={{ color: C.textM, fontSize: 10, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Recent Sessions</p>
        {['NYC vs LA — 347 viewers', 'Domino Championship — 512 viewers', 'Weekly Cypher — 88 viewers'].map(s => (
          <div key={s} style={{ color: C.textM, fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${C.slate2}` }}>{s}</div>
        ))}
      </Card>
    </div>
  );
}

// ── STATE VS STATE PANEL ───────────────────────────────────────────────────
function SVSPanel() {
  const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
  const [s1, setS1] = useState('NY');
  const [s2, setS2] = useState('TX');
  const [scores, setScores] = useState({ s1: 0, s2: 0 });
  const [judges, setJudges] = useState(['Judge A','Judge B','Judge C']);
  const [judgeScores] = useState(() => ['Judge A','Judge B','Judge C'].map(() => ({ s1: 0, s2: 0 })));
  const [toastMsg, setToastMsg] = useState('');

  function vote(side) {
    setScores(prev => ({ ...prev, [side]: prev[side] + 1 }));
    toast(`+1 for ${side === 's1' ? s1 : s2}`, setToastMsg);
  }

  const total = scores.s1 + scores.s2 || 1;
  const pct1 = Math.floor((scores.s1 / total) * 100);
  const pct2 = 100 - pct1;

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 12, fontWeight: 600 }}>Set Up Battle</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
          <select value={s1} onChange={e => setS1(e.target.value)} style={{ background: C.bg2, color: C.text, border: `1px solid ${C.slate}`, borderRadius: 6, padding: '8px 10px', fontSize: 14 }}>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ color: C.gold, fontWeight: 900, fontSize: 18 }}>VS</span>
          <select value={s2} onChange={e => setS2(e.target.value)} style={{ background: C.bg2, color: C.text, border: `1px solid ${C.slate}`, borderRadius: 6, padding: '8px 10px', fontSize: 14 }}>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[{ key: 's1', state: s1, score: scores.s1, color: C.state1 }, { key: 's2', state: s2, score: scores.s2, color: C.state2 }].map(side => (
            <div key={side.key} style={{ textAlign: 'center', background: C.bg2, borderRadius: 8, padding: 16, border: `2px solid ${side.color}` }}>
              <div style={{ color: side.color, fontWeight: 900, fontSize: 28 }}>{side.state}</div>
              <div style={{ color: C.text, fontSize: 32, fontWeight: 700, margin: '8px 0' }}>{side.score}</div>
              <Btn onClick={() => vote(side.key)} color={side.color} small>Vote +1</Btn>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: C.state1, fontSize: 12, fontWeight: 700 }}>{s1} {pct1}%</span>
            <span style={{ color: C.state2, fontSize: 12, fontWeight: 700 }}>{pct2}% {s2}</span>
          </div>
          <div style={{ height: 8, background: C.slate, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct1}%`, height: '100%', background: C.state1, transition: 'width 0.4s' }} />
          </div>
        </div>
      </Card>

      <Card>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Judges Panel</p>
        {judges.map((j, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.slate2}` }}>
            <span style={{ color: C.textD, fontSize: 13 }}>{j}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge label={`${s1}: ${judgeScores[i]?.s1 ?? 0}`} color={C.state1} />
              <Badge label={`${s2}: ${judgeScores[i]?.s2 ?? 0}`} color={C.state2} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── TRIBUTE PANEL ──────────────────────────────────────────────────────────
function TributePanel() {
  const [tributes, setTributes] = useState(() => { try { return JSON.parse(sessionStorage.getItem('v37_tributes') || '[]'); } catch { return []; } });
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [era, setEra] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  function addTribute() {
    if (!name.trim()) { toast('Enter a name', setToastMsg); return; }
    const t = { id: Date.now(), name: name.trim(), msg: msg.trim(), era: era.trim(), at: new Date().toLocaleDateString() };
    const updated = [t, ...tributes].slice(0, 30);
    setTributes(updated);
    sessionStorage.setItem('v37_tributes', JSON.stringify(updated));
    setName(''); setMsg(''); setEra('');
    toast('Tribute added', setToastMsg);
  }

  function removeTribute(id) {
    const updated = tributes.filter(t => t.id !== id);
    setTributes(updated);
    sessionStorage.setItem('v37_tributes', JSON.stringify(updated));
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.tribL, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🕊 Add a Tribute</p>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name (required)" style={{ marginBottom: 8 }} />
        <Input value={era} onChange={e => setEra(e.target.value)} placeholder="Era / Year (optional)" style={{ marginBottom: 8 }} />
        <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message..." rows={3} style={{ marginBottom: 10 }} />
        <Btn onClick={addTribute} color={C.tribute}>Add to Wall</Btn>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12 }}>
        {tributes.length === 0 && (
          <div style={{ color: C.textM, fontSize: 13, padding: 20, textAlign: 'center' }}>No tributes yet. Be first to honor a legend.</div>
        )}
        {tributes.map(t => (
          <Card key={t.id} style={{ borderColor: C.tribute, position: 'relative' }}>
            <button onClick={() => removeTribute(t.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: C.textM, cursor: 'pointer', fontSize: 16 }}>×</button>
            <div style={{ color: C.tribL, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>🕊 {t.name}</div>
            {t.era && <div style={{ color: C.textM, fontSize: 11, marginBottom: 6 }}>{t.era}</div>}
            {t.msg && <div style={{ color: C.textD, fontSize: 13, lineHeight: 1.5 }}>{t.msg}</div>}
            <div style={{ color: C.textM, fontSize: 10, marginTop: 8 }}>{t.at}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── PODCAST PANEL ─────────────────────────────────────────────────────────
function PodcastPanel() {
  const [tab, setTab] = useState('create');
  const [topic, setTopic] = useState('');
  const [hosts, setHosts] = useState('');
  const [sources, setSources] = useState([]);
  const [srcInput, setSrcInput] = useState('');
  const [ep, setEp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [nlmUrl, setNlmUrl] = useState('');
  const [nlmLabel, setNlmLabel] = useState('');
  const [nlmSources, setNlmSources] = useState(() => { try { return JSON.parse(sessionStorage.getItem('v37_nlm_sources') || '[]'); } catch { return []; } });

  function addSource() {
    if (!srcInput.trim() || sources.length >= 5) return;
    setSources(prev => [...prev, { type: 'text', label: srcInput.slice(0, 40), content: srcInput }]);
    setSrcInput('');
  }

  function addNlm() {
    if (!nlmUrl.trim() || !nlmUrl.includes('notebooklm.google.com')) { toast('Need a notebooklm.google.com URL', setToastMsg); return; }
    const m = nlmUrl.match(/\/notebook\/([^/?#]+)(?:\/artifact\/([^/?#]+))?/);
    if (!m) { toast('Cannot parse NLM URL', setToastMsg); return; }
    const label = nlmLabel.trim() || `NLM ${nlmSources.length + 1}`;
    const src = { id: Date.now(), label, url: nlmUrl.trim(), notebookId: m[1], artifactId: m[2] || null, at: new Date().toISOString() };
    const updated = [src, ...nlmSources].slice(0, 20);
    setNlmSources(updated);
    sessionStorage.setItem('v37_nlm_sources', JSON.stringify(updated));
    setNlmUrl(''); setNlmLabel('');
    toast('NLM source saved!', setToastMsg);
  }

  async function generate() {
    if (!topic.trim()) { toast('Enter a topic', setToastMsg); return; }
    setLoading(true);
    try {
      const srcCtx = sources.map(s => `- ${s.label}: ${s.content}`).join('\n');
      const nlmCtx = nlmSources.slice(0, 3).map(s => `- ${s.label} [${s.notebookId.slice(0,8)}...]`).join('\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `SeeWhy LIVE AI Podcast Producer.\nTopic: "${topic}"\nHosts: ${hosts || 'Co-hosts TBD'}\nSources:\n${srcCtx}\nNotebookLM References:\n${nlmCtx}\nPlatform: SeeWhy LIVE — domino culture, State vs State, 90/10 creator split.\nGenerate a complete podcast episode outline with title, tagline, 4-6 segments, cold open, and call to action.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            tagline: { type: 'string' },
            duration: { type: 'string' },
            topics: { type: 'array', items: { type: 'string' } },
            segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  host: { type: 'string' },
                  duration: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
            cold_open: { type: 'string' },
            call_to_action: { type: 'string' },
          },
        },
      });
      setEp(result);
      setTab('outline');
    } catch (e) {
      toast('Generation failed — try again', setToastMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {['create','sources','outline'].map(t => <TabBtn key={t} label={t === 'create' ? '🎙 Create' : t === 'sources' ? '📓 Sources' : '📋 Outline'} active={tab === t} onClick={() => setTab(t)} />)}
      </div>

      {tab === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Episode topic…" />
          <Input value={hosts} onChange={e => setHosts(e.target.value)} placeholder="Host names (comma-separated)" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input value={srcInput} onChange={e => setSrcInput(e.target.value)} placeholder="Add a source / talking point (max 5)" />
            <Btn onClick={addSource} disabled={sources.length >= 5} small>Add</Btn>
          </div>
          {sources.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: C.bg2, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: C.textD }}>
              <span>{s.label}</span>
              <button onClick={() => setSources(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: C.textM, cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <Btn onClick={generate} disabled={loading || !topic.trim()} color={C.ruby} style={{ alignSelf: 'flex-start' }}>
            {loading ? '⏳ Generating…' : '✨ Generate Episode'}
          </Btn>
        </div>
      )}

      {tab === 'sources' && (
        <div>
          <Card style={{ marginBottom: 14 }}>
            <p style={{ color: C.textD, fontSize: 12, marginBottom: 8, fontWeight: 600 }}>Add NotebookLM Source</p>
            <Input value={nlmUrl} onChange={e => setNlmUrl(e.target.value)} placeholder="https://notebooklm.google.com/notebook/…" style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={nlmLabel} onChange={e => setNlmLabel(e.target.value)} placeholder="Label (optional)" />
              <Btn onClick={addNlm} small>Save</Btn>
            </div>
          </Card>
          {nlmSources.length === 0 && <div style={{ color: C.textM, fontSize: 13, textAlign: 'center', padding: 20 }}>No NLM sources yet.</div>}
          {nlmSources.map(s => (
            <Card key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{s.label}</div>
                  <div style={{ color: C.textM, fontSize: 10, marginTop: 4 }}>{s.notebookId.slice(0, 12)}… {s.artifactId ? `/ ${s.artifactId.slice(0, 8)}…` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a href={isSafeUrl(s.url) ? s.url : undefined} target="_blank" rel="noreferrer" style={{ color: C.amber, fontSize: 11 }}>Open ↗</a>
                  <button onClick={() => { const u = nlmSources.filter(x => x.id !== s.id); setNlmSources(u); sessionStorage.setItem('v37_nlm_sources', JSON.stringify(u)); }} style={{ background: 'none', border: 'none', color: C.textM, cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'outline' && ep && (
        <div>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ color: C.gold, fontWeight: 900, fontSize: 18 }}>{ep.title}</div>
            <div style={{ color: C.textD, fontSize: 13, marginTop: 4 }}>{ep.tagline}</div>
            {ep.duration && <Badge label={ep.duration} color={C.slate} />}
          </Card>
          {ep.cold_open && (
            <Card style={{ marginBottom: 12, borderColor: C.amber }}>
              <p style={{ color: C.amber, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>COLD OPEN</p>
              <p style={{ color: C.textD, fontSize: 13 }}>{ep.cold_open}</p>
            </Card>
          )}
          {(ep.segments || []).map((seg, i) => (
            <Card key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{i + 1}. {seg.title}</span>
                <span style={{ color: C.textM, fontSize: 11 }}>{seg.duration}</span>
              </div>
              {seg.host && <Badge label={seg.host} color={C.goldD} />}
              {seg.notes && <p style={{ color: C.textD, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{seg.notes}</p>}
            </Card>
          ))}
          {ep.call_to_action && (
            <Card style={{ borderColor: C.ruby }}>
              <p style={{ color: C.rubyL, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>CALL TO ACTION</p>
              <p style={{ color: C.textD, fontSize: 13 }}>{ep.call_to_action}</p>
            </Card>
          )}
        </div>
      )}
      {tab === 'outline' && !ep && (
        <div style={{ color: C.textM, fontSize: 13, textAlign: 'center', padding: 32 }}>Generate an episode first.</div>
      )}
    </div>
  );
}

// ── MUSIC PANEL ────────────────────────────────────────────────────────────
function MusicPanel() {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Hip-Hop');
  const [bpm, setBpm] = useState('95');
  const [keyV, setKeyV] = useState('C Minor');
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const GENRES = ['Hip-Hop','R&B','Trap','Drill','Afrobeats','Gospel','Soul','Jazz','Electronic','Lo-Fi'];
  const KEYS = ['C Major','C Minor','D Major','D Minor','E Major','E Minor','F Major','F Minor','G Major','G Minor','A Major','A Minor','B Major','B Minor'];

  async function gen() {
    if (!prompt.trim()) { toast('Describe your track concept', setToastMsg); return; }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `SeeWhy LIVE AI Music Director.\nConcept: "${prompt}"\nGenre: ${genre} | BPM: ${bpm} | Key: ${keyV}\nCreate a detailed track arrangement with sections, hooks, and mix tips for a broadcast performance.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            vibe: { type: 'string' },
            arrangement: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  bars: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
            hook: { type: 'string' },
            mix_tips: { type: 'array', items: { type: 'string' } },
            collab_suggestion: { type: 'string' },
          },
        },
      });
      setTrack(result);
    } catch (e) {
      toast('Failed to generate — try again', setToastMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      <Card style={{ marginBottom: 14 }}>
        <Input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe your track concept…" rows={2} style={{ marginBottom: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <p style={{ color: C.textM, fontSize: 10, marginBottom: 4 }}>Genre</p>
            <select value={genre} onChange={e => setGenre(e.target.value)} style={{ background: C.bg2, color: C.text, border: `1px solid ${C.slate}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, width: '100%' }}>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <p style={{ color: C.textM, fontSize: 10, marginBottom: 4 }}>BPM</p>
            <Input value={bpm} onChange={e => setBpm(e.target.value)} type="number" style={{ padding: '6px 8px', fontSize: 12 }} />
          </div>
          <div>
            <p style={{ color: C.textM, fontSize: 10, marginBottom: 4 }}>Key</p>
            <select value={keyV} onChange={e => setKeyV(e.target.value)} style={{ background: C.bg2, color: C.text, border: `1px solid ${C.slate}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, width: '100%' }}>
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
        <Btn onClick={gen} disabled={loading} color={C.ruby}>{loading ? '⏳ Composing…' : '🎵 Generate Track'}</Btn>
      </Card>

      {track && (
        <div>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ color: C.gold, fontWeight: 900, fontSize: 18 }}>{track.title}</div>
            <div style={{ color: C.textD, fontSize: 13, marginTop: 4 }}>{track.vibe}</div>
          </Card>
          {(track.arrangement || []).map((sec, i) => (
            <Card key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.amber, fontWeight: 700, fontSize: 13 }}>{sec.section}</span>
                <Badge label={`${sec.bars} bars`} color={C.slate} />
              </div>
              <p style={{ color: C.textD, fontSize: 12, lineHeight: 1.5 }}>{sec.notes}</p>
            </Card>
          ))}
          {track.hook && (
            <Card style={{ borderColor: C.gold, marginBottom: 8 }}>
              <p style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>HOOK</p>
              <p style={{ color: C.text, fontSize: 13, fontStyle: 'italic' }}>"{track.hook}"</p>
            </Card>
          )}
          {track.mix_tips && track.mix_tips.length > 0 && (
            <Card style={{ marginBottom: 8 }}>
              <p style={{ color: C.textD, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>MIX TIPS</p>
              {track.mix_tips.map((tip, i) => (
                <div key={i} style={{ color: C.textM, fontSize: 12, padding: '3px 0' }}>• {tip}</div>
              ))}
            </Card>
          )}
          {track.collab_suggestion && (
            <Card style={{ borderColor: C.purple }}>
              <p style={{ color: C.tribL, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>COLLAB SUGGESTION</p>
              <p style={{ color: C.textD, fontSize: 13 }}>{track.collab_suggestion}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ── PLATFORMS PANEL ────────────────────────────────────────────────────────
function PlatformsPanel() {
  const PLATFORMS = [
    { name: 'YouTube Live', color: '#FF0000', icon: '▶' },
    { name: 'Facebook Live', color: '#1877F2', icon: 'f' },
    { name: 'Instagram Live', color: '#E4405F', icon: '📸' },
    { name: 'TikTok Live', color: C.text, icon: '♪' },
    { name: 'X (Twitter)', color: C.text, icon: '𝕏' },
    { name: 'Twitch', color: '#9147FF', icon: '🎮' },
    { name: 'Kick', color: '#53FC18', icon: '🎯' },
    { name: 'LinkedIn Live', color: '#0A66C2', icon: 'in' },
  ];
  const [active, setActive] = useState({});
  const [keys, setKeys] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  function toggle(name) {
    setActive(prev => ({ ...prev, [name]: !prev[name] }));
    toast(`${name} ${active[name] ? 'disabled' : 'enabled'}`, setToastMsg);
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      <div style={{ background: C.bg4, border: `1px solid ${C.goldD}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: C.textM }}>
        ⚠ Stream keys are managed server-side. Enable destinations below — actual RTMP keys are never exposed in this interface.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 12 }}>
        {PLATFORMS.map(p => (
          <Card key={p.name} style={{ borderColor: active[p.name] ? p.color : C.slate }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{p.name}</span>
              </div>
              <button
                onClick={() => toggle(p.name)}
                style={{
                  background: active[p.name] ? C.green : C.slate,
                  border: 'none', borderRadius: 99, width: 40, height: 22,
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: active[p.name] ? 20 : 3,
                  width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s',
                }} />
              </button>
            </div>
            {active[p.name] && (
              <Input
                value={keys[p.name] || ''}
                onChange={e => setKeys(prev => ({ ...prev, [p.name]: e.target.value }))}
                placeholder="Stream key (stored locally only)"
                type="password"
                style={{ fontSize: 11 }}
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── WATCH PARTY PANEL ──────────────────────────────────────────────────────
function WatchPartyPanel() {
  const [url, setUrl] = useState('');
  const [partyId, setPartyId] = useState('');
  const [guests, setGuests] = useState([]);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  function createParty() {
    if (!url.trim()) { toast('Enter a video URL', setToastMsg); return; }
    const arr = crypto.getRandomValues(new Uint8Array(4));
    setPartyId(`PARTY-${Array.from(arr, b => b.toString(16).padStart(2,'0')).join('').slice(0,6).toUpperCase()}`);
    setGuests(['Host (You)', 'Guest1', 'Guest2']);
    setChat([{ user: 'System', msg: 'Watch party started! Share the party ID with friends.' }]);
    toast('Watch party created!', setToastMsg);
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    setChat(prev => [...prev, { user: 'You', msg: chatInput }]);
    setChatInput('');
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      {!partyId ? (
        <Card>
          <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Start a Watch Party</p>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Video URL (YouTube, Twitch, etc.)" style={{ marginBottom: 10 }} />
          <Btn onClick={createParty} color={C.ruby}>🎬 Create Party</Btn>
        </Card>
      ) : (
        <div>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: C.gold, fontWeight: 700 }}>Party: {partyId}</span>
              <Badge label={`${guests.length} guests`} color={C.ruby} />
            </div>
            <div style={{ color: C.textM, fontSize: 12, wordBreak: 'break-all' }}>{url}</div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <Card>
              <p style={{ color: C.textD, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Guests</p>
              {guests.map((g, i) => (
                <div key={i} style={{ color: C.textD, fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${C.slate2}` }}>
                  <span style={{ color: C.green, marginRight: 6 }}>●</span>{g}
                </div>
              ))}
            </Card>
            <Card>
              <p style={{ color: C.textD, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Party Chat</p>
              <div style={{ height: 140, overflowY: 'auto', marginBottom: 8 }}>
                {chat.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.gold, fontWeight: 700 }}>{c.user}: </span>
                    <span style={{ color: C.textD }}>{c.msg}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message…" onKeyDown={e => e.key === 'Enter' && sendChat()} style={{ fontSize: 12 }} />
                <Btn onClick={sendChat} small>Send</Btn>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANALYTICS PANEL ────────────────────────────────────────────────────────
function AnalyticsPanel() {
  const stats = [
    { label: 'Total Views', val: '24,817', delta: '+12%', color: C.gold },
    { label: 'Watch Time (hrs)', val: '3,402', delta: '+8%', color: C.teal },
    { label: 'Followers', val: '1,284', delta: '+22%', color: C.green },
    { label: 'Revenue', val: '$892', delta: '+31%', color: C.amber },
    { label: 'Avg Viewers / Stream', val: '347', delta: '+5%', color: C.purple },
    { label: 'Chat Messages', val: '18,440', delta: '+17%', color: C.blue },
  ];

  const topContent = [
    { title: 'NY vs TX — Domino Championship', views: '8,412', rev: '$214' },
    { title: 'Friday Night Cypher Live', views: '4,200', rev: '$98' },
    { title: 'Culture Talk w/ Joyce AI', views: '3,100', rev: '$74' },
    { title: 'State Tribute: GA Edition', views: '2,900', rev: '$63' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ color: s.color, fontWeight: 900, fontSize: 22 }}>{s.val}</div>
            <div style={{ color: C.textM, fontSize: 10, margin: '4px 0' }}>{s.label}</div>
            <Badge label={s.delta} color={s.delta.startsWith('+') ? '#1a3d1a' : '#3d1a1a'} />
          </Card>
        ))}
      </div>

      <Card>
        <p style={{ color: C.textD, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Top Content (30 days)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
          <span style={{ color: C.textM, fontSize: 10, fontWeight: 700 }}>TITLE</span>
          <span style={{ color: C.textM, fontSize: 10, fontWeight: 700 }}>VIEWS</span>
          <span style={{ color: C.textM, fontSize: 10, fontWeight: 700 }}>REV</span>
          {topContent.map(c => (
            <React.Fragment key={c.title}>
              <span style={{ color: C.textD, fontSize: 13 }}>{c.title}</span>
              <span style={{ color: C.teal, fontSize: 12, textAlign: 'right' }}>{c.views}</span>
              <span style={{ color: C.gold, fontSize: 12, textAlign: 'right' }}>{c.rev}</span>
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── MONETIZE PANEL ─────────────────────────────────────────────────────────
function MonetizePanel() {
  const CREATOR_SHARE = 0.90;
  const PLATFORM_FEE = 0.10;

  const [gross, setGross] = useState('0');
  const creatorEarnings = Math.floor(parseFloat(gross || '0') * CREATOR_SHARE * 100) / 100;
  const platformFee = Math.floor(parseFloat(gross || '0') * PLATFORM_FEE * 100) / 100;

  const streams = [
    { name: 'Subscriptions', icon: '🔒', amount: '$412.00', color: C.gold },
    { name: 'Tips & Gifts', icon: '🎁', amount: '$234.50', color: C.amber },
    { name: 'PPV Events', icon: '🎟', amount: '$180.00', color: C.ruby },
    { name: 'Merch Cut', icon: '👕', amount: '$65.30', color: C.teal },
  ];

  return (
    <div>
      <div style={{ background: C.bg4, border: `2px solid ${C.goldD}`, borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>CREATOR REVENUE SPLIT</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 8 }}>
          <div>
            <div style={{ color: C.green, fontWeight: 900, fontSize: 28 }}>{Math.floor(CREATOR_SHARE * 100)}%</div>
            <div style={{ color: C.textM, fontSize: 11 }}>YOU KEEP</div>
          </div>
          <div>
            <div style={{ color: C.textM, fontWeight: 700, fontSize: 20 }}>{Math.floor(PLATFORM_FEE * 100)}%</div>
            <div style={{ color: C.textM, fontSize: 11 }}>PLATFORM</div>
          </div>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 8, fontWeight: 600 }}>Revenue Calculator</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: C.textM, fontSize: 13 }}>Gross $</span>
          <Input value={gross} onChange={e => setGross(e.target.value)} type="number" style={{ maxWidth: 120 }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: C.bg2, borderRadius: 8, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
            <div style={{ color: C.green, fontWeight: 700, fontSize: 20 }}>${creatorEarnings.toFixed(2)}</div>
            <div style={{ color: C.textM, fontSize: 10 }}>Your Earnings</div>
          </div>
          <div style={{ background: C.bg2, borderRadius: 8, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
            <div style={{ color: C.textM, fontWeight: 700, fontSize: 20 }}>${platformFee.toFixed(2)}</div>
            <div style={{ color: C.textM, fontSize: 10 }}>Platform Fee</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10 }}>
        {streams.map(s => (
          <Card key={s.name} style={{ borderColor: s.color }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 900, fontSize: 18 }}>{s.amount}</div>
            <div style={{ color: C.textM, fontSize: 11 }}>{s.name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── GUARDIAN AI PANEL ──────────────────────────────────────────────────────
function GuardianPanel() {
  const [rules, setRules] = useState([
    { id: 1, text: 'Block hate speech and slurs', active: true, level: 'high' },
    { id: 2, text: 'Flag violent content for review', active: true, level: 'high' },
    { id: 3, text: 'Warn on excessive profanity', active: true, level: 'medium' },
    { id: 4, text: 'Detect spam patterns', active: true, level: 'medium' },
    { id: 5, text: 'Auto-mute repeat offenders', active: false, level: 'low' },
  ]);
  const [flagged, setFlagged] = useState([
    { id: 1, user: 'user_329', msg: 'Message flagged for review', reason: 'Potential hate speech', time: '2m ago' },
    { id: 2, user: 'user_441', msg: 'Excessive spam detected', reason: 'Spam pattern', time: '8m ago' },
  ]);

  function toggleRule(id) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }

  const levelColor = { high: C.red, medium: C.warn, low: C.teal };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[{ label: 'Monitored', val: '1,240', color: C.teal }, { label: 'Flagged', val: flagged.length, color: C.warn }, { label: 'Removed', val: '3', color: C.red }, { label: 'Clear', val: '97%', color: C.green }].map(s => (
          <Card key={s.label} style={{ textAlign: 'center', padding: 10 }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 20 }}>{s.val}</div>
            <div style={{ color: C.textM, fontSize: 10 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 14 }}>
        <p style={{ color: C.textD, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Moderation Rules</p>
        {rules.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.slate2}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: levelColor[r.level], display: 'inline-block' }} />
              <span style={{ color: C.textD, fontSize: 12 }}>{r.text}</span>
            </div>
            <button
              onClick={() => toggleRule(r.id)}
              style={{ background: r.active ? C.green : C.slate, border: 'none', borderRadius: 99, width: 36, height: 20, cursor: 'pointer', position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: 2, left: r.active ? 17 : 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </button>
          </div>
        ))}
      </Card>

      <Card>
        <p style={{ color: C.textD, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Flagged Content</p>
        {flagged.length === 0 && <div style={{ color: C.textM, fontSize: 12 }}>No flagged content.</div>}
        {flagged.map(f => (
          <div key={f.id} style={{ background: C.bg2, borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: C.warn, fontWeight: 700, fontSize: 12 }}>{f.user}</span>
              <span style={{ color: C.textM, fontSize: 10 }}>{f.time}</span>
            </div>
            <div style={{ color: C.textD, fontSize: 12, marginBottom: 4 }}>{f.msg}</div>
            <Badge label={f.reason} color={C.ruby} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Btn onClick={() => setFlagged(prev => prev.filter(x => x.id !== f.id))} color={C.red} small>Remove</Btn>
              <Btn onClick={() => setFlagged(prev => prev.filter(x => x.id !== f.id))} color={C.green} small>Clear</Btn>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── INS FORGE PANEL ────────────────────────────────────────────────────────
function InsForgePanel() {
  const ASSETS = [
    { id: 'thumb', label: 'Thumbnail', icon: '🖼' },
    { id: 'banner', label: 'Stream Banner', icon: '🎨' },
    { id: 'endcard', label: 'End Card', icon: '🎬' },
    { id: 'overlay', label: 'Lower Third', icon: '📺' },
    { id: 'social', label: 'Social Post', icon: '📱' },
    { id: 'promo', label: 'Promo Card', icon: '🎟' },
  ];
  const [sel, setSel] = useState(ASSETS[0]);
  const [prompt, setPrompt] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  async function gen() {
    if (!prompt.trim()) { toast('Describe your asset concept', setToastMsg); return; }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `SeeWhy LIVE INS Forge — Content Asset Generator.\nAsset Type: ${sel.label}\nConcept: "${prompt}"\nBrand: Dark background (#0E0C09), gold (#C9A84C) accents, Bebas Neue font, broadcast aesthetic, domino culture.\nGenerate complete copy, layout instructions, and dimensions for this asset.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            headline: { type: 'string' },
            subline: { type: 'string' },
            copy_lines: { type: 'array', items: { type: 'string' } },
            layout_notes: { type: 'string' },
            cta: { type: 'string' },
            dimensions: { type: 'string' },
          },
        },
      });
      setRes(result);
    } catch (e) {
      toast('Generation failed — try again', setToastMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {ASSETS.map(a => (
          <button
            key={a.id}
            onClick={() => setSel(a)}
            style={{
              background: sel.id === a.id ? C.goldD : C.bg3,
              border: `1px solid ${sel.id === a.id ? C.gold : C.slate}`,
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: sel.id === a.id ? C.text : C.textM, fontSize: 12,
            }}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: 14 }}>
        <Input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={`Describe your ${sel.label} concept…`} rows={3} style={{ marginBottom: 10 }} />
        <Btn onClick={gen} disabled={loading} color={C.ruby}>{loading ? '⏳ Forging…' : `⚒ Forge ${sel.label}`}</Btn>
      </Card>

      {res && (
        <Card>
          <div style={{ color: C.gold, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{res.title}</div>
          {res.dimensions && <Badge label={res.dimensions} color={C.slate} />}
          <div style={{ marginTop: 12 }}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{res.headline}</div>
            {res.subline && <div style={{ color: C.textD, fontSize: 13, marginBottom: 8 }}>{res.subline}</div>}
            {(res.copy_lines || []).map((line, i) => (
              <div key={i} style={{ color: C.textM, fontSize: 12, padding: '3px 0' }}>• {line}</div>
            ))}
          </div>
          {res.layout_notes && (
            <div style={{ background: C.bg2, borderRadius: 8, padding: 10, marginTop: 10 }}>
              <p style={{ color: C.amber, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>LAYOUT</p>
              <p style={{ color: C.textD, fontSize: 12 }}>{res.layout_notes}</p>
            </div>
          )}
          {res.cta && (
            <div style={{ background: C.ruby, borderRadius: 8, padding: '8px 12px', marginTop: 10 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>CTA: {res.cta}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── JOYCE AI PANEL ─────────────────────────────────────────────────────────
function JoyceAIPanel() {
  const SYS_PROMPT = `You are Joyce AI — SeeWhy LIVE's intelligent creator assistant. You are an expert in streaming, domino culture, State vs State competition format, content creation, monetization, and the African American broadcasting community. You speak directly, knowledgeably, and with cultural fluency. The platform gives creators 90% revenue, uses earth-tone dark design, and celebrates domino culture as a competitive sport and cultural art form.`;

  const [msgs, setMsgs] = useState([
    { r: 'assistant', c: "Hey! I'm Joyce AI — your SeeWhy LIVE creator assistant. Ask me anything about streaming, content strategy, monetization, or domino culture." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function send() {
    const q = input.trim();
    if (!q) return;
    setMsgs(prev => [...prev, { r: 'user', c: q }]);
    setInput('');
    setLoading(true);
    try {
      const history = msgs.slice(-8).map(m => `${m.r === 'user' ? 'USER' : 'JOYCE AI'}: ${m.c}`).join('\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYS_PROMPT}\n\nConversation:\n${history}\nUSER: ${q}\n\nRespond as Joyce AI in 2-4 sentences, direct and helpful.`,
      });
      const reply = typeof result === 'string' ? result : (result.response || result.text || result.content || JSON.stringify(result));
      setMsgs(prev => [...prev, { r: 'assistant', c: reply }]);
    } catch (e) {
      setMsgs(prev => [...prev, { r: 'assistant', c: 'Having trouble connecting right now — try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 10 }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.r === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                background: m.r === 'user' ? C.ruby : C.bg3,
                border: `1px solid ${m.r === 'user' ? C.rubyL : C.slate}`,
                borderRadius: m.r === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '10px 14px',
                color: C.text,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {m.r === 'assistant' && (
                <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>JOYCE AI</div>
              )}
              {m.c}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ background: C.bg3, border: `1px solid ${C.slate}`, borderRadius: '12px 12px 12px 2px', padding: '10px 14px' }}>
              <Spinner />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: `1px solid ${C.slate}` }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Joyce AI…"
          onKeyDown={e => e.key === 'Enter' && !loading && send()}
        />
        <Btn onClick={send} disabled={loading || !input.trim()} color={C.ruby}>Send</Btn>
      </div>
    </div>
  );
}

// ── SETTINGS PANEL ─────────────────────────────────────────────────────────
function SettingsPanel() {
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [notifs, setNotifs] = useState({ email: true, push: true, subs: true, tips: true });
  const [saved, setSaved] = useState(false);

  function save() {
    sessionStorage.setItem('v37_settings', JSON.stringify({ handle, bio, email, notifs }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem('v37_settings') || '{}');
      if (s.handle) setHandle(s.handle);
      if (s.bio) setBio(s.bio);
      if (s.email) setEmail(s.email);
      if (s.notifs) setNotifs(s.notifs);
    } catch {}
  }, []);

  return (
    <div>
      {saved && <div style={{ color: C.green, fontSize: 12, marginBottom: 10 }}>✓ Settings saved</div>}

      <Card style={{ marginBottom: 14 }}>
        <p style={{ color: C.textD, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Creator Profile</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@handle" />
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Contact email" type="email" />
          <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Creator bio…" rows={3} />
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <p style={{ color: C.textD, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Notifications</p>
        {Object.entries({ email: 'Email alerts', push: 'Push notifications', subs: 'New subscriber alerts', tips: 'Tip notifications' }).map(([k, label]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.slate2}` }}>
            <span style={{ color: C.textD, fontSize: 13 }}>{label}</span>
            <button
              onClick={() => setNotifs(prev => ({ ...prev, [k]: !prev[k] }))}
              style={{ background: notifs[k] ? C.green : C.slate, border: 'none', borderRadius: 99, width: 36, height: 20, cursor: 'pointer', position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: 2, left: notifs[k] ? 17 : 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </button>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <p style={{ color: C.textD, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Revenue Split</p>
        <div style={{ color: C.textM, fontSize: 12, marginBottom: 6 }}>Your guaranteed creator share: <span style={{ color: C.green, fontWeight: 700 }}>90%</span></div>
        <div style={{ color: C.textM, fontSize: 12 }}>Platform fee: <span style={{ color: C.textD, fontWeight: 700 }}>10%</span></div>
        <div style={{ color: C.textM, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>This split is immutable — it is a core SeeWhy LIVE commitment to creators.</div>
      </Card>

      <Btn onClick={save} color={C.ruby}>Save Settings</Btn>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'stage',    label: '📡 Stage' },
  { id: 'svs',      label: '⚔️ SVS' },
  { id: 'tribute',  label: '🕊 Tribute' },
  { id: 'podcast',  label: '🎙 Podcast' },
  { id: 'music',    label: '🎵 Music' },
  { id: 'platforms',label: '🌐 Platforms' },
  { id: 'party',    label: '🎬 Watch Party' },
  { id: 'analytics',label: '📊 Analytics' },
  { id: 'monetize', label: '💰 Monetize' },
  { id: 'guardian', label: '🛡 Guardian' },
  { id: 'forge',    label: '⚒ INS Forge' },
  { id: 'joyce',    label: '🤖 Joyce AI' },
  { id: 'settings', label: '⚙️ Settings' },
];

export default function SeeWhyLIVEv37() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;
  const roomId = activeRoomId;
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;
  const [activeTab, setActiveTab] = useState('stage');
  const { localStream } = useLocalMedia({ audio: true, video: true });
  const { remoteStreams, peerUserIds } = useWebRTCPeers(roomId, localStream);

  const panelMap = {
    stage:     <StagePanel />,
    svs:       <SVSPanel />,
    tribute:   <TributePanel />,
    podcast:   <PodcastPanel />,
    music:     <MusicPanel />,
    platforms: <PlatformsPanel />,
    party:     <WatchPartyPanel />,
    analytics: <AnalyticsPanel />,
    monetize:  <MonetizePanel />,
    guardian:  <GuardianPanel />,
    forge:     <InsForgePanel />,
    joyce:     <JoyceAIPanel />,
    settings:  <SettingsPanel />,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        textarea, input, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.slate}; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: C.bg2,
        borderBottom: `1px solid ${C.slate}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ color: C.gold, fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>SEE WHY LIVE</span>
        <span style={{ color: C.ruby, fontWeight: 700, fontSize: 11, background: C.slate, borderRadius: 4, padding: '2px 6px' }}>v37</span>
        <span style={{ color: C.textM, fontSize: 11, marginLeft: 'auto' }}>Creator Hub</span>
      </div>

      {/* Tab Nav */}
      <div style={{
        background: C.bg2,
        borderBottom: `1px solid ${C.slate}`,
        padding: '6px 16px',
        overflowX: 'auto',
        display: 'flex',
        gap: 2,
        scrollbarWidth: 'none',
      }}>
        {TABS.map(t => (
          <TabBtn key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {/* Panel Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ color: C.textM, fontSize: 11, marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          {TABS.find(t => t.id === activeTab)?.label}
        </div>
        {panelMap[activeTab]}
      </div>

      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ReactionOverlay partyId={null} currentUser={user} />
        <WatchPartyAnalytics party={null} members={[]} pollCount={0} reactionCount={0} />
        <LiveAuctionWidget creatorId={user?.id} roomId={roomId} isCreator={false} currentUser={user} />
        <StreamerGoalsWidget creatorId={user?.id} roomId={roomId} isCreator={false} />
        <GreenroomQueue roomId={roomId} isHost={false} />
        <SocialLeaderboard roomId={roomId} />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'0 16px 24px' }}>
        {/* new components here */}
        <OnlineUsersGrid compact maxVisible={10} roomId={roomId} remoteStreams={remoteStreams} peerUserIds={peerUserIds} localStream={localStream} currentUser={user} />
        <ContentRecommendations />
        <MilestoneAlerts userId={user?.id} roomId={roomId} />
        <SwanAIRecommendations roomId={roomId} currentLayout="default" viewerCount={0} />
        <CollaborationMatcher />
        <StreamGoals isHost={false} />
        <ShareToSocial content={{ title: 'SeeWhy LIVE', url: window.location.href }} />
      </div>
    </div>
  );
}