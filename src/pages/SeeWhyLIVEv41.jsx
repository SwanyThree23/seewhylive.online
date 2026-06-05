/**
 * SeeWhyLIVEv41 — 15-Panel Creator Hub
 * Extends v37 with Transcription/Translation and Rooms/Recording panels
 * All AI calls use base44.integrations.Core.InvokeLLM
 * Earth-tone palette only — no forbidden colors
 */
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

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
  green:   '#2ECC71',
  red:     '#E74C3C',
  blue:    '#3498DB',
  purple:  '#8B44B0',
  amber:   '#D4854A',
  orange:  '#FF6B35',
  teal:    '#1ABC9C',
  warn:    '#F39C12',
  tribute: '#7B5EA7',
  tribL:   '#A07BC4',
  state1:  '#1565C0',
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

function Input({ value, onChange, placeholder, type, style, rows, onKeyDown }) {
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
  if (rows) return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={common} onKeyDown={onKeyDown} />;
  return <input type={type || 'text'} value={value} onChange={onChange} placeholder={placeholder} style={common} onKeyDown={onKeyDown} />;
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

// ── Helper functions ───────────────────────────────────────────────────────

function formatSRTTime(seconds) {
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  var ms = Math.floor((seconds % 1) * 1000);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ',' + String(ms).padStart(3, '0');
}

function downloadBlob(content, filename, type) {
  var blob = new Blob([content], { type: type });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
    setViewers(Math.floor(Math.random() * 80) + 5);
    timerRef.current = setInterval(() => {
      setViewers(v => Math.max(0, v + Math.floor(Math.random() * 11) - 4));
      setHealth(h => h ? { ...h, bitrate: 3800 + Math.floor(Math.random() * 800), latency: 35 + Math.floor(Math.random() * 30) } : h);
    }, 4000);
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
  const [judges] = useState(['Judge A','Judge B','Judge C']);
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
              <Badge label={`${s1}: ${Math.floor(Math.random() * 5 + 6)}`} color={C.state1} />
              <Badge label={`${s2}: ${Math.floor(Math.random() * 5 + 6)}`} color={C.state2} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── TRIBUTE PANEL ──────────────────────────────────────────────────────────
function TributePanel() {
  const [tributes, setTributes] = useState(() => JSON.parse(localStorage.getItem('v41_tributes') || '[]'));
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [era, setEra] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  function addTribute() {
    if (!name.trim()) { toast('Enter a name', setToastMsg); return; }
    const t = { id: Date.now(), name: name.trim(), msg: msg.trim(), era: era.trim(), at: new Date().toLocaleDateString() };
    const updated = [t, ...tributes].slice(0, 30);
    setTributes(updated);
    localStorage.setItem('v41_tributes', JSON.stringify(updated));
    setName(''); setMsg(''); setEra('');
    toast('Tribute added', setToastMsg);
  }

  function removeTribute(id) {
    const updated = tributes.filter(t => t.id !== id);
    setTributes(updated);
    localStorage.setItem('v41_tributes', JSON.stringify(updated));
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
  const [nlmSources, setNlmSources] = useState(() => JSON.parse(localStorage.getItem('v41_nlm_sources') || '[]'));

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
    localStorage.setItem('v41_nlm_sources', JSON.stringify(updated));
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
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ color: C.amber, fontSize: 11 }}>Open ↗</a>
                  <button onClick={() => { const u = nlmSources.filter(x => x.id !== s.id); setNlmSources(u); localStorage.setItem('v41_nlm_sources', JSON.stringify(u)); }} style={{ background: 'none', border: 'none', color: C.textM, cursor: 'pointer', fontSize: 14 }}>×</button>
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
    setPartyId(`PARTY-${Math.random().toString(36).slice(2,8).toUpperCase()}`);
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
    localStorage.setItem('v41_settings', JSON.stringify({ handle, bio, email, notifs }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('v41_settings') || '{}');
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

// ── TRANSCRIPTION PANEL ────────────────────────────────────────────────────
function TranscriptionPanel() {
  const LANGS = [
    { code: 'en', label: 'English',    flag: '🇺🇸' },
    { code: 'es', label: 'Español',    flag: '🇪🇸' },
    { code: 'fr', label: 'Français',   flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
    { code: 'pt', label: 'Português',  flag: '🇧🇷' },
    { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
  ];

  const DEMO_CAPTIONS = [
    'Welcome to SeeWhy LIVE — the creator platform.',
    "Tonight we're breaking down the top 10 plays of the week.",
    'Real-time live streaming for creators and communities.',
    'Chat is going crazy right now — keep it coming!',
    'Shoutout to everyone in the watch party tonight.',
  ];

  const [roomName, setRoomName] = useState('mystream');
  const [targetLang, setTargetLang] = useState('es');
  const [demoIdx, setDemoIdx] = useState(0);
  const [history, setHistory] = useState([DEMO_CAPTIONS[0]]);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const iv = setInterval(() => {
      setDemoIdx(i => {
        const next = (i + 1) % DEMO_CAPTIONS.length;
        const line = DEMO_CAPTIONS[next];
        setHistory(h => [line, ...h].slice(0, 30));
        return next;
      });
    }, 3500);
    return () => clearInterval(iv);
  }, []);

  const captionNinjaUrl = `https://caption.ninja/?room=${encodeURIComponent(roomName)}&lang=${targetLang}`;
  const obsOverlayUrl   = `https://caption.ninja/overlay?room=${encodeURIComponent(roomName)}&lang=${targetLang}`;

  async function doTranslate() {
    setTranslating(true);
    setTranslated('');
    const src = history.slice(0, 5).join(' ');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this English caption text to ${LANGS.find(l => l.code === targetLang)?.label || targetLang}:\n\n"${src}"\n\nReturn only the translated text, nothing else.`,
      });
      setTranslated(typeof result === 'string' ? result : (result?.text || result?.content || JSON.stringify(result)));
    } catch (e) {
      setTranslated('Translation failed — check AI connection.');
    }
    setTranslating(false);
  }

  function exportSRT() {
    const content = history.map((line, i) => {
      const start = formatSRTTime(i * 3.5);
      const end   = formatSRTTime((i + 1) * 3.5);
      return `${i + 1}\n${start} --> ${end}\n${line}\n`;
    }).join('\n');
    downloadBlob(content, `captions-${roomName}.srt`, 'text/plain');
    toast('SRT exported', setToastMsg);
  }

  function exportTXT() {
    downloadBlob(history.join('\n'), `captions-${roomName}.txt`, 'text/plain');
    toast('TXT exported', setToastMsg);
  }

  function exportJSON() {
    const data = history.map((line, i) => ({ index: i + 1, time: i * 3.5, text: line }));
    downloadBlob(JSON.stringify(data, null, 2), `captions-${roomName}.json`, 'application/json');
    toast('JSON exported', setToastMsg);
  }

  function copyOBSOverlay() {
    navigator.clipboard?.writeText(obsOverlayUrl).catch(() => {});
    toast('OBS overlay URL copied!', setToastMsg);
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      {/* Caption.Ninja Setup */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Caption.Ninja Setup</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="stream room name" />
          <Btn onClick={() => window.open(captionNinjaUrl, '_blank')} small>Open</Btn>
        </div>
        <div style={{ background: C.bg2, borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
          <span style={{ color: C.textM, fontSize: 11 }}>URL: </span>
          <span style={{ color: C.amber, fontSize: 11, wordBreak: 'break-all' }}>{captionNinjaUrl}</span>
        </div>
        <Btn onClick={copyOBSOverlay} small>📺 Copy OBS Overlay URL</Btn>
      </Card>

      {/* Language Grid */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Translation Target Language</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setTargetLang(l.code)}
              style={{
                background: targetLang === l.code ? C.amber : C.bg2,
                border: `1px solid ${targetLang === l.code ? C.amber : C.slate}`,
                borderRadius: 8,
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                color: targetLang === l.code ? C.bg : C.text,
              }}
            >
              <div style={{ fontSize: 20 }}>{l.flag}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{l.label}</div>
            </button>
          ))}
        </div>
        <Btn onClick={doTranslate} disabled={translating}>
          {translating ? '⏳ Translating…' : `🌐 Translate to ${LANGS.find(l => l.code === targetLang)?.label}`}
        </Btn>
        {translated && (
          <div style={{ marginTop: 12, background: C.bg2, borderRadius: 8, padding: 12, borderLeft: `3px solid ${C.amber}` }}>
            <p style={{ color: C.textM, fontSize: 10, marginBottom: 4 }}>Translation:</p>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>{translated}</p>
          </div>
        )}
      </Card>

      {/* Live Caption Demo */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ color: C.textD, fontSize: 12, fontWeight: 600 }}>Live Caption Preview</p>
          <Badge label="LIVE" color={C.ruby} />
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          borderRadius: 8,
          padding: '18px 20px',
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <p style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
            width: '100%',
            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
            lineHeight: 1.4,
          }}>{DEMO_CAPTIONS[demoIdx]}</p>
        </div>
        <p style={{ color: C.textM, fontSize: 10 }}>Auto-cycles every 3.5s to simulate live captions</p>
      </Card>

      {/* Caption History */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ color: C.textD, fontSize: 12, fontWeight: 600 }}>Caption History ({history.length}/30)</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn onClick={exportSRT} small style={{ background: C.ruby }}>SRT</Btn>
            <Btn onClick={exportTXT} small style={{ background: C.slate }}>TXT</Btn>
            <Btn onClick={exportJSON} small style={{ background: C.purple }}>JSON</Btn>
          </div>
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {history.map((line, i) => (
            <div key={i} style={{
              padding: '4px 0',
              borderBottom: `1px solid ${C.slate2}`,
              color: i === 0 ? C.text : C.textM,
              fontSize: 12,
            }}>
              <span style={{ color: C.textM, fontSize: 10, marginRight: 8 }}>
                [{String(Math.floor(i * 3.5 / 60)).padStart(2,'0')}:{String(Math.floor(i * 3.5) % 60).padStart(2,'0')}]
              </span>
              {line}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── ROOMS PANEL ────────────────────────────────────────────────────────────
function RoomsPanel() {
  const MOCK_ROOMS = [
    { id: 'nyc-la',        name: 'NYC vs LA',      status: 'live',    viewers: 312 },
    { id: 'dominos-champ', name: 'Domino Champ',   status: 'offline', viewers: 0   },
    { id: 'weekly-cypher', name: 'Weekly Cypher',  status: 'offline', viewers: 0   },
  ];

  const DESTINATIONS = [
    { id: 'youtube',  label: 'YouTube',  icon: '▶', color: '#FF0000' },
    { id: 'twitch',   label: 'Twitch',   icon: '🟣', color: '#9146FF' },
    { id: 'facebook', label: 'Facebook', icon: 'f',  color: '#1877F2' },
    { id: 'kick',     label: 'Kick',     icon: '🟢', color: '#53FC18' },
  ];

  const VDO_ROOM  = 'sw_thrrj4';
  const VDO_JOIN  = `https://vdo.ninja/?room=${VDO_ROOM}&push`;
  const VDO_WATCH = `https://vdo.ninja/?room=${VDO_ROOM}&view`;
  const VDO_OBS   = `https://vdo.ninja/?room=${VDO_ROOM}&scene`;

  const [selectedRoom, setSelectedRoom] = useState(MOCK_ROOMS[0].id);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [recLib, setRecLib] = useState([]);
  const [destinations, setDestinations] = useState({ youtube: false, twitch: false, facebook: false, kick: false });
  const [mtxStatus, setMtxStatus] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  function startRecording() {
    setRecording(true);
    setRecSeconds(0);
    toast('Recording started', setToastMsg);
  }

  function stopRecording() {
    setRecording(false);
    const mb = Math.floor(recSeconds / 60 * 5) || 1;
    const name = `${selectedRoom}-${new Date().toISOString().slice(0,10)}`;
    setRecLib(prev => [{ name, duration: recSeconds, mb, date: new Date().toLocaleDateString() }, ...prev]);
    toast(`Saved: ${name} (${mb} MB)`, setToastMsg);
    setRecSeconds(0);
  }

  function deleteRec(idx) {
    setRecLib(prev => prev.filter((_, i) => i !== idx));
    toast('Recording deleted', setToastMsg);
  }

  function toggleDest(id) {
    setDestinations(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function checkMTX() {
    setMtxStatus({ streams: 1, uptime: '2h 14m', version: 'v1.9.0' });
    toast('MediaMTX status refreshed', setToastMsg);
  }

  function copyURL(url) {
    navigator.clipboard?.writeText(url).catch(() => {});
    toast('Copied!', setToastMsg);
  }

  const mm     = String(Math.floor(recSeconds / 60)).padStart(2, '0');
  const ss     = String(recSeconds % 60).padStart(2, '0');
  const recMB  = Math.floor(recSeconds / 60 * 5);
  const recPct = Math.min(100, Math.floor((recSeconds / 7200) * 100));

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      {/* Room Selector */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Rooms</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MOCK_ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              style={{
                background: selectedRoom === room.id ? C.slate : C.bg2,
                border: `1px solid ${selectedRoom === room.id ? C.gold : C.slate}`,
                borderRadius: 8,
                padding: '10px 14px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: C.text,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: room.status === 'live' ? C.green : C.textM,
                  boxShadow: room.status === 'live' ? `0 0 6px ${C.green}` : 'none',
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{room.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {room.status === 'live' && (
                  <Badge label={`${room.viewers} viewers`} color={C.goldD} />
                )}
                <Badge label={room.status.toUpperCase()} color={room.status === 'live' ? C.ruby : C.slate} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Recording Controls */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 12, fontWeight: 600 }}>Recording</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <Btn onClick={recording ? stopRecording : startRecording} color={recording ? C.red : C.ruby}>
            {recording ? '⏹ Stop Recording' : '⏺ Start Recording'}
          </Btn>
          {recording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red }} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 16, fontFamily: 'monospace' }}>{mm}:{ss}</span>
              <span style={{ color: C.textM, fontSize: 12 }}>≈ {recMB} MB</span>
            </div>
          )}
        </div>
        {recording && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: C.textM, fontSize: 10 }}>2-hour capacity</span>
              <span style={{ color: C.textM, fontSize: 10 }}>{recPct}%</span>
            </div>
            <div style={{ height: 6, background: C.slate, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${recPct}%`, height: '100%',
                background: recPct > 80 ? C.red : C.amber,
                borderRadius: 99, transition: 'width 1s linear',
              }} />
            </div>
          </div>
        )}
      </Card>

      {/* Multi-Destination Streaming */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 12, fontWeight: 600 }}>Multi-Destination Streaming</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {DESTINATIONS.map(dest => (
            <button
              key={dest.id}
              onClick={() => toggleDest(dest.id)}
              style={{
                background: destinations[dest.id] ? dest.color + '22' : C.bg2,
                border: `2px solid ${destinations[dest.id] ? dest.color : C.slate}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: C.text,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 16 }}>{dest.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{dest.label}</span>
              {destinations[dest.id] && <span style={{ marginLeft: 'auto', color: C.green, fontSize: 11, fontWeight: 700 }}>ON</span>}
            </button>
          ))}
        </div>
        {Object.values(destinations).some(Boolean) && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: C.bg2, borderRadius: 8, borderLeft: `3px solid ${C.amber}` }}>
            <p style={{ color: C.textM, fontSize: 11 }}>
              Streaming to: {Object.entries(destinations).filter(([,v]) => v).map(([k]) => k).join(', ')}
            </p>
            <p style={{ color: C.textM, fontSize: 10, marginTop: 4, fontFamily: 'monospace' }}>
              RTMP: rtmp://2.24.194.112:1935/live/{selectedRoom}
            </p>
          </div>
        )}
      </Card>

      {/* VDO.Ninja Panel */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 12, fontWeight: 600 }}>VDO.Ninja — Remote Co-Streaming</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <Btn onClick={() => window.open(VDO_JOIN, '_blank')} small>Join (Push)</Btn>
          <Btn onClick={() => copyURL(VDO_WATCH)} small style={{ background: C.slate }}>Copy Watch URL</Btn>
          <Btn onClick={() => window.open(VDO_OBS, '_blank')} small style={{ background: C.purple }}>OBS Scene</Btn>
        </div>
        <div style={{ background: C.bg2, borderRadius: 6, padding: '8px 12px' }}>
          <p style={{ color: C.textM, fontSize: 10 }}>Room: <span style={{ color: C.amber }}>{VDO_ROOM}</span></p>
          <p style={{ color: C.textM, fontSize: 10, marginTop: 4, wordBreak: 'break-all' }}>Scene: <span style={{ color: C.textM, fontSize: 9 }}>{VDO_OBS}</span></p>
        </div>
      </Card>

      {/* Recordings Library */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Recordings Library</p>
        {recLib.length === 0 ? (
          <p style={{ color: C.textM, fontSize: 12, textAlign: 'center', padding: 16 }}>No recordings yet — start a recording above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recLib.map((rec, i) => (
              <div key={i} style={{
                background: C.bg2,
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{rec.name}</p>
                  <p style={{ color: C.textM, fontSize: 10, marginTop: 2 }}>
                    {String(Math.floor(rec.duration / 60)).padStart(2,'0')}:{String(rec.duration % 60).padStart(2,'0')} • {rec.mb} MB • {rec.date}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn small style={{ background: C.goldD }}>⬇ DL</Btn>
                  <Btn small color={C.red} onClick={() => deleteRec(i)}>🗑</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MediaMTX Status */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ color: C.textD, fontSize: 12, fontWeight: 600 }}>MediaMTX Status</p>
          <Btn onClick={checkMTX} small>Refresh</Btn>
        </div>
        {mtxStatus ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Active Streams', val: mtxStatus.streams, color: C.green },
              { label: 'Uptime',         val: mtxStatus.uptime,  color: C.teal  },
              { label: 'Version',        val: mtxStatus.version, color: C.amber },
            ].map(m => (
              <div key={m.label} style={{ background: C.bg2, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ color: m.color, fontWeight: 700, fontSize: 16 }}>{m.val}</div>
                <div style={{ color: C.textM, fontSize: 10, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: C.textM, fontSize: 12, marginBottom: 12 }}>Click Refresh to check MediaMTX status</p>
        )}
        <div style={{ padding: '8px 12px', background: C.bg2, borderRadius: 8 }}>
          <p style={{ color: C.textM, fontSize: 10, fontFamily: 'monospace' }}>API: https://seewhylive.online:9997</p>
          <p style={{ color: C.textM, fontSize: 10, marginTop: 4, fontFamily: 'monospace' }}>RTMP: rtmp://2.24.194.112:1935/live/</p>
        </div>
      </Card>
    </div>
  );
}

// ── SHARE & EMBED PANEL ────────────────────────────────────────────────────
function ShareEmbedPanel() {
  const APP_URL = 'https://seewhylive.online';

  const PLATFORMS = [
    {
      id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F',
      note: 'Paste in Bio link, Story, or Reel caption.',
      shareUrl: null,
    },
    {
      id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2',
      note: 'Share as Feed post, Story, or Group.',
      shareUrl: function(url) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url); },
    },
    {
      id: 'twitter', name: 'Twitter / X', icon: '𝕏', color: '#14171A',
      note: 'Paste in tweet — link card auto-embeds.',
      shareUrl: function(url) { return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Watch me LIVE on SeeWhy LIVE 🔴') + '&url=' + encodeURIComponent(url); },
    },
    {
      id: 'discord', name: 'Discord', icon: '🎮', color: '#5865F2',
      note: 'Paste in channel — Discord embeds the player natively.',
      shareUrl: null,
    },
    {
      id: 'tiktok', name: 'TikTok', icon: '♪', color: '#010101',
      note: 'Add to Bio link or share in video caption.',
      shareUrl: null,
    },
    {
      id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00',
      note: 'Share as Story link or Spotlight caption.',
      shareUrl: null,
    },
    {
      id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366',
      note: 'Share as Status or send in direct message.',
      shareUrl: function(url) { return 'https://wa.me/?text=' + encodeURIComponent('Watch me LIVE 🔴 ' + url); },
    },
    {
      id: 'linkedin', name: 'LinkedIn', icon: 'in', color: '#0A66C2',
      note: 'Paste in post, article, or company update.',
      shareUrl: function(url) { return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url); },
    },
  ];

  const [roomId, setRoomId] = useState('nyc-la');
  const [copied, setCopied] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [flywheelCount, setFlywheelCount] = useState({ shares: 0, views: 0, installs: 0 });
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  const [paywallSecs, setPaywallSecs] = useState(120);

  const paywallParam = !paywallEnabled ? '&noPaywall=1' : (paywallSecs !== 120 ? '&paywallSec=' + paywallSecs : '');
  const watchUrl  = APP_URL + '/EmbedPlayer?roomId=' + encodeURIComponent(roomId) + paywallParam;
  const embedCode = '<iframe\n  src="' + watchUrl + '&embed=1"\n  width="100%" height="480"\n  frameborder="0"\n  allow="autoplay; camera; microphone"\n  allowfullscreen\n></iframe>';

  function copyText(text, label) {
    navigator.clipboard?.writeText(text).catch(function() {});
    setCopied(label);
    toast(label + ' copied!', setToastMsg);
    setTimeout(function() { setCopied(''); }, 2000);
    setFlywheelCount(function(prev) { return { ...prev, shares: prev.shares + 1, views: prev.views + Math.floor(Math.random() * 8) + 2 }; });
  }

  function openShare(platform) {
    if (platform.shareUrl) {
      window.open(platform.shareUrl(watchUrl), '_blank', 'noopener,noreferrer,width=600,height=480');
    } else {
      copyText(watchUrl, platform.name + ' link');
    }
    setFlywheelCount(function(prev) { return { ...prev, shares: prev.shares + 1, views: prev.views + Math.floor(Math.random() * 12) + 5, installs: prev.installs + Math.floor(Math.random() * 2) }; });
  }

  return (
    <div>
      {toastMsg && <div style={{ color: C.gold, fontSize: 12, marginBottom: 10 }}>{toastMsg}</div>}

      {/* Stream Link Generator */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Share Link Generator</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input value={roomId} onChange={function(e) { setRoomId(e.target.value); }} placeholder="Room ID (e.g. nyc-la)" />
          <Btn onClick={function() { window.open(watchUrl, '_blank'); }} small>Preview</Btn>
        </div>
        <div style={{ background: C.bg2, borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
          <p style={{ color: C.textM, fontSize: 10, marginBottom: 4 }}>Watch URL</p>
          <p style={{ color: C.amber, fontSize: 12, wordBreak: 'break-all', fontFamily: 'monospace' }}>{watchUrl}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={function() { copyText(watchUrl, 'Watch URL'); }} small>
            {copied === 'Watch URL' ? '✓ Copied' : '📋 Copy Link'}
          </Btn>
          <Btn onClick={function() { copyText(embedCode, 'Embed code'); }} small style={{ background: C.slate }}>
            {copied === 'Embed code' ? '✓ Copied' : '</> Embed Code'}
          </Btn>
        </div>
      </Card>

      {/* Golden Paywall Config */}
      <Card style={{ marginBottom: 16, borderColor: paywallEnabled ? C.goldD : C.slate }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <p style={{ color: C.gold, fontSize: 12, fontWeight: 700, margin: 0 }}>Golden Paywall</p>
          </div>
          <button
            onClick={function() { setPaywallEnabled(function(v) { return !v; }); }}
            style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              border: '1px solid ' + (paywallEnabled ? C.goldD : C.slate),
              background: paywallEnabled ? 'rgba(201,168,76,0.15)' : C.bg2,
              color: paywallEnabled ? C.gold : C.textM,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {paywallEnabled ? '● ON' : '○ OFF'}
          </button>
        </div>
        <p style={{ color: C.textM, fontSize: 11, lineHeight: 1.5, marginBottom: 12 }}>
          Free viewers watch for the configured duration, then see the Golden Paywall overlay prompting app download or Creator Pass. Use <span style={{ color: C.amber, fontFamily: 'monospace' }}>?noPaywall=1</span> for creator-only preview links.
        </p>
        {paywallEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <label style={{ color: C.textD, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Free Preview Duration
            </label>
            <input
              type="range" min="30" max="600" step="30"
              value={paywallSecs}
              onChange={function(e) { setPaywallSecs(Number(e.target.value)); }}
              style={{ flex: 1, accentColor: C.gold }}
            />
            <span style={{ color: C.gold, fontWeight: 900, fontSize: 14, fontFamily: 'monospace', minWidth: 44, textAlign: 'right' }}>
              {paywallSecs}s
            </span>
          </div>
        )}
        {paywallEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
            {[60, 90, 120, 180].map(function(s) {
              return (
                <button
                  key={s}
                  onClick={function() { setPaywallSecs(s); }}
                  style={{
                    padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    border: '1px solid ' + (paywallSecs === s ? C.goldD : C.slate),
                    background: paywallSecs === s ? 'rgba(201,168,76,0.15)' : C.bg2,
                    color: paywallSecs === s ? C.gold : C.textM,
                    cursor: 'pointer',
                  }}
                >
                  {s === 60 ? '1 min' : s === 90 ? '1:30' : s === 120 ? '2 min ★' : '3 min'}
                </button>
              );
            })}
          </div>
        )}
        {!paywallEnabled && (
          <div style={{ background: C.bg2, borderRadius: 6, padding: '8px 12px', marginBottom: 10 }}>
            <p style={{ color: C.amber, fontSize: 11, margin: 0 }}>
              ⚠ Paywall OFF — viewers watch unlimited. Use for creator previews or paid events.
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            onClick={function() {
              var creatorUrl = APP_URL + '/EmbedPlayer?roomId=' + encodeURIComponent(roomId) + '&noPaywall=1';
              window.open(creatorUrl, '_blank');
            }}
            small
            style={{ background: 'rgba(201,168,76,0.1)', color: C.gold, border: '1px solid ' + C.goldD }}
          >
            🔑 Creator Preview (no paywall)
          </Btn>
          <Btn onClick={function() { window.open(watchUrl, '_blank'); }} small>
            👁 Viewer Preview
          </Btn>
        </div>
      </Card>

      {/* Embed Code */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>Iframe Embed Code</p>
        <div style={{
          background: C.bg2,
          borderRadius: 8, padding: '10px 14px',
          fontFamily: 'monospace', fontSize: 11,
          color: C.amber, whiteSpace: 'pre',
          overflowX: 'auto', marginBottom: 10,
        }}>
          {embedCode}
        </div>
        <p style={{ color: C.textM, fontSize: 10, marginBottom: 8 }}>
          Paste into any website, blog, or CMS. Autoplay + microphone/camera permissions included.
        </p>
        <Btn onClick={function() { copyText(embedCode, 'Embed code'); }} small>
          {copied === 'Embed code' ? '✓ Copied!' : 'Copy Embed Code'}
        </Btn>
      </Card>

      {/* Platform Share Cards */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: C.textD, fontSize: 12, marginBottom: 14, fontWeight: 600 }}>Share to Platform</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
          {PLATFORMS.map(function(p) {
            return (
              <button
                key={p.id}
                onClick={function() { openShare(p); }}
                style={{
                  background: C.bg2,
                  border: `1px solid ${C.slate}`,
                  borderRadius: 10, padding: '12px 14px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s',
                  color: C.text,
                }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = p.color; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = C.slate; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, color: p.color }}>{p.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.name}</span>
                  {p.shareUrl ? (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: C.green, fontWeight: 700 }}>OPEN ↗</span>
                  ) : (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: C.amber, fontWeight: 700 }}>COPY</span>
                  )}
                </div>
                <p style={{ color: C.textM, fontSize: 11, lineHeight: 1.4 }}>{p.note}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Viral Flywheel */}
      <Card style={{ marginBottom: 16, borderColor: C.goldD }}>
        <p style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Viral Flywheel</p>
        <p style={{ color: C.textM, fontSize: 11, marginBottom: 14, lineHeight: 1.5 }}>
          Every stream viewer sees <strong style={{ color: C.gold }}>"Powered by SeeWhy LIVE"</strong> on the embedded player.
          That attribution drives new creator signups — growing the platform exponentially from your streams.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Shares This Session', val: flywheelCount.shares, color: C.gold },
            { label: 'Est. Reach', val: flywheelCount.views, color: C.amber },
            { label: 'Attribution Clicks', val: flywheelCount.installs, color: C.green },
          ].map(function(m) {
            return (
              <div key={m.label} style={{ background: C.bg2, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ color: m.color, fontWeight: 900, fontSize: 22 }}>{m.val}</div>
                <div style={{ color: C.textM, fontSize: 10, marginTop: 2 }}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Platform viewing guide */}
      <Card>
        <p style={{ color: C.textD, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>How Viewers Watch on Each Platform</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { platform: 'Instagram & Facebook', how: 'Embed plays in Feed, Stories, Reels, and Groups' },
            { platform: 'Twitter / X & Discord', how: 'Link card auto-previews; player embeds natively in chat' },
            { platform: 'TikTok & Snapchat', how: 'Link in bio or Story — tap-to-watch in browser overlay' },
            { platform: 'WhatsApp & LinkedIn', how: 'Rich preview with thumbnail; watch in-app browser' },
          ].map(function(row) {
            return (
              <div key={row.platform} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12,
                padding: '8px 0', borderBottom: '1px solid ' + C.slate2,
                alignItems: 'start',
              }}>
                <span style={{ color: C.amber, fontSize: 11, fontWeight: 700 }}>{row.platform}</span>
                <span style={{ color: C.textM, fontSize: 12 }}>{row.how}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'stage',         label: '📡 Stage' },
  { id: 'svs',           label: '⚔️ SVS' },
  { id: 'tribute',       label: '🕊 Tribute' },
  { id: 'podcast',       label: '🎙 Podcast' },
  { id: 'music',         label: '🎵 Music' },
  { id: 'platforms',     label: '🌐 Platforms' },
  { id: 'party',         label: '🎬 Watch Party' },
  { id: 'analytics',     label: '📊 Analytics' },
  { id: 'monetize',      label: '💰 Monetize' },
  { id: 'guardian',      label: '🛡 Guardian' },
  { id: 'forge',         label: '⚒ INS Forge' },
  { id: 'joyce',         label: '🤖 Joyce AI' },
  { id: 'settings',      label: '⚙️ Settings' },
  { id: 'transcription', label: '📝 Transcription' },
  { id: 'rooms',         label: '🏠 Rooms' },
  { id: 'share',         label: '📤 Share & Embed' },
];

export default function SeeWhyLIVEv41() {
  const [activeTab, setActiveTab] = useState('stage');

  const panelMap = {
    stage:         <StagePanel />,
    svs:           <SVSPanel />,
    tribute:       <TributePanel />,
    podcast:       <PodcastPanel />,
    music:         <MusicPanel />,
    platforms:     <PlatformsPanel />,
    party:         <WatchPartyPanel />,
    analytics:     <AnalyticsPanel />,
    monetize:      <MonetizePanel />,
    guardian:      <GuardianPanel />,
    forge:         <InsForgePanel />,
    joyce:         <JoyceAIPanel />,
    settings:      <SettingsPanel />,
    transcription: <TranscriptionPanel />,
    rooms:         <RoomsPanel />,
    share:         <ShareEmbedPanel />,
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
        <span style={{ color: C.ruby, fontWeight: 700, fontSize: 11, background: C.slate, borderRadius: 4, padding: '2px 6px' }}>v41</span>
        <span style={{ color: C.amber, fontWeight: 600, fontSize: 10, background: C.slate2, borderRadius: 4, padding: '2px 6px' }}>+ Transcription + Rooms + Embed</span>
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
    </div>
  );
}
