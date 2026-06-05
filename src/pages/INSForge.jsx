import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';

const BG     = '#080B18';
const BG2    = '#0D1022';
const BG3    = '#13182C';
const GOLD   = '#D4AF37';
const CRIMSON= '#800020';
const AMBER  = '#D4854A';
const CYAN   = '#00d4ff';
const PURPLE = '#a78bfa';
const BLUE   = '#1565C0';
const RED2   = '#C62828';
const T      = { fontFamily: 'Barlow Condensed, sans-serif' };

const QUICK_PROMPTS = {
  svs_bracket:      ['WA vs TX State Championship — Sunday at Jamar\'s Sports Bar', 'Southeast Regional Final — FL vs GA — Double Elimination', 'National Qualifier — Opening Round — 8 States competing'],
  tribute_card:     ['Big Bone Earl — WA legend, 1958–2021, 4× Regional Champion', 'Mama Joyce Thompson — GA Queen, 1962–2023, 30-year teaching legacy', 'Fast Hands Rodriguez — TX speed record holder, ESPN feature'],
  stream_overlay:   ['SeeWhy LIVE tournament — gold & crimson domino theme', 'Podcast interview — dual speakers, Barlow Condensed headlines', 'LIVE NOW alert lower-third — breaking broadcast style'],
  podcast_cover:    ['Domino culture deep dive — dark studio, gold accents', 'AI Live Streaming future — tech theme, cyan gradients', 'Creator economy special — community & money vibes'],
  music_promo:      ['New AI-generated beat drop — trap/chill hybrid release', 'Community remix challenge — open collab call', 'SeeWhy LIVE music showcase playlist announcement'],
  tournament_flyer: ['State vs State WA Classic — July 4 at Jamar\'s Sports Bar, Des Moines WA', 'Open Invitational — $2,500 prize pool — all states welcome', 'Tribute Gaming Event — Big Bone Earl Memorial Fund'],
};

const FORGE_TYPES = [
  { id: 'svs_bracket',     label: 'SVS Bracket Graphic',      icon: '⚔️', color: BLUE },
  { id: 'tribute_card',    label: 'Tribute Memorial Card',     icon: '🕊️', color: '#7B5EA7' },
  { id: 'stream_overlay',  label: 'Stream Overlay Pack',       icon: '🎥', color: GOLD },
  { id: 'podcast_cover',   label: 'Podcast Cover Art',         icon: '🎙️', color: CYAN },
  { id: 'music_promo',     label: 'Music Release Promo',       icon: '🎵', color: PURPLE },
  { id: 'tournament_flyer',label: 'Tournament Flyer',          icon: '🏆', color: AMBER },
];

const GEN_STEPS = [
  'Analyzing brand tokens…',
  'Crafting headline copy…',
  'Selecting color palette…',
  'Writing layout notes…',
  'Finalizing creative brief…',
];

function Tag({ label, color }) {
  return (
    <span style={{
      background: (color || GOLD) + '22', color: color || GOLD,
      border: `1px solid ${(color || GOLD)}44`,
      borderRadius: 999, padding: '2px 9px',
      fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
      whiteSpace: 'nowrap', ...T,
    }}>{label}</span>
  );
}

function Swatch({ hex }) {
  return (
    <div title={hex} style={{
      width: 22, height: 22, borderRadius: 5, background: hex,
      border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0,
    }} />
  );
}

export default function INSForge() {
  const [selected, setSelected] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  function copyBrief() {
    if (!result) return;
    const text = [
      `ASSET: ${result.title || selected?.label}`,
      `HEADLINE: ${result.headline}`,
      result.subline ? `SUBLINE: ${result.subline}` : '',
      result.copy_lines?.length ? `COPY:\n${result.copy_lines.map(l => `  • ${l}`).join('\n')}` : '',
      result.layout_notes ? `LAYOUT: ${result.layout_notes}` : '',
      result.color_palette?.length ? `PALETTE: ${result.color_palette.join(', ')}` : '',
      result.cta ? `CTA: ${result.cta}` : '',
      result.dimensions ? `SIZE: ${result.dimensions}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function generate() {
    if (!selected || !prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    let stepInterval;

    try {
      let step = 0;
      stepInterval = setInterval(() => {
        step = (step + 1) % GEN_STEPS.length;
        setGenStep(step);
      }, 480);

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the SeeWhy LIVE INS Forge — an AI creative asset generator for SwanyThree EntTech LLC.

Asset Type: ${selected.label}
Creative Brief: "${prompt}"
Brand Context: SeeWhy LIVE — dark backgrounds (#080B18), gold (#D4AF37) accents, crimson (#800020) brand, Barlow Condensed / Bebas Neue display fonts, broadcast & domino culture aesthetic.

Generate a complete creative brief for this asset. Respond ONLY with valid JSON (no markdown, no fences):
{
  "title": "asset title",
  "headline": "primary headline text",
  "subline": "secondary supporting text",
  "copy_lines": ["line1", "line2", "line3"],
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "layout_notes": "description of layout / composition",
  "cta": "call to action text",
  "brand_elements": ["element1", "element2", "element3"],
  "dimensions": "recommended dimensions"
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            headline: { type: 'string' },
            subline: { type: 'string' },
            copy_lines: { type: 'array', items: { type: 'string' } },
            color_palette: { type: 'array', items: { type: 'string' } },
            layout_notes: { type: 'string' },
            cta: { type: 'string' },
            brand_elements: { type: 'array', items: { type: 'string' } },
            dimensions: { type: 'string' },
          },
        },
      });

      clearInterval(stepInterval);
      setResult(typeof res === 'string' ? JSON.parse(res) : res);
    } catch (e) {
      clearInterval(stepInterval);
      setError('Failed to generate. Try again.');
    }
    setLoading(false);
  }

  function reset() {
    setResult(null);
    setPrompt('');
    setSelected(null);
    setError(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '16px 16px 96px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <a href="/AIHub" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }} aria-label="Back to AI Hub">
          ← AI Hub
        </a>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 28, color: GOLD, letterSpacing: 3 }}>
            ⚡ INS FORGE
          </div>
          <Tag label="AI-Powered" color={AMBER} />
        </div>
        <div style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Influence Network Syndication — AI creative brief generator for SeeWhy LIVE branded assets.
        </div>
      </div>

      {/* Asset type grid */}
      <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
        Choose Asset Type
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        {FORGE_TYPES.map(t => {
          const active = selected && selected.id === t.id;
          return (
            <div key={t.id} onClick={() => { setSelected(active ? null : t); setResult(null); setError(null); }}
              style={{
                background: active ? `${t.color}22` : BG3,
                border: `1px solid ${active ? t.color + '88' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all .15s',
              }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ ...T, fontSize: 12, color: active ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: 700, lineHeight: 1.3 }}>
                {t.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompt input */}
      {selected && !result && (
        <div style={{ background: BG3, border: `1px solid ${selected.color}44`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 15, color: selected.color, marginBottom: 10, letterSpacing: 1 }}>
            {selected.icon} {selected.label.toUpperCase()}
          </div>
          <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Creative Brief
          </div>

          {/* Quick preset chips */}
          {QUICK_PROMPTS[selected.id] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
              <div style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quick start</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {QUICK_PROMPTS[selected.id].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    style={{
                      ...T, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                      background: prompt === p ? `${selected.color}22` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${prompt === p ? selected.color + '66' : 'rgba(255,255,255,0.1)'}`,
                      color: prompt === p ? selected.color : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer', textAlign: 'left', letterSpacing: '0.02em',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.length > 42 ? p.slice(0, 42) + '…' : p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={`Describe your ${selected.label} — event details, theme, names, vibe…`}
            rows={3}
            style={{
              width: '100%', background: BG2, border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 8, padding: '10px 12px', color: '#fff', ...T, fontSize: 13,
              outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12,
            }}
          />
          {error && (
            <div style={{ ...T, fontSize: 12, color: '#ff6b6b', marginBottom: 10 }}>{error}</div>
          )}
          <button onClick={generate} disabled={loading || !prompt.trim()} style={{
            width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            background: loading || !prompt.trim() ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${selected.color}, ${selected.color}AA)`,
            color: loading || !prompt.trim() ? 'rgba(255,255,255,0.3)' : '#000',
            ...T, fontSize: 15, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all .15s',
          }}>
            {loading ? GEN_STEPS[genStep] : `⚡ FORGE ASSET`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: `linear-gradient(135deg, ${selected.color}18, ${BG3})`,
            border: `1px solid ${selected.color}55`, borderRadius: 14, padding: 18,
          }}>
            {/* Title + dimensions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 20, color: selected.color, letterSpacing: 1, lineHeight: 1 }}>
                  {result.title || 'CREATIVE ASSET'}
                </div>
                <div style={{ ...T, fontSize: 15, color: '#fff', fontWeight: 700, marginTop: 4 }}>
                  {result.headline}
                </div>
                {result.subline && (
                  <div style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {result.subline}
                  </div>
                )}
              </div>
              {result.dimensions && (
                <Tag label={result.dimensions.split(' ')[0]} color={selected.color} />
              )}
            </div>

            {/* Copy lines */}
            {result.copy_lines && result.copy_lines.length > 0 && (
              <div style={{ background: BG2, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  Copy Lines
                </div>
                {result.copy_lines.map((line, i) => (
                  <div key={i} style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${selected.color}55`, marginBottom: 3 }}>
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* Layout notes */}
            {result.layout_notes && (
              <div style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', marginBottom: 10 }}>
                📐 {result.layout_notes}
              </div>
            )}

            {/* Color palette */}
            {result.color_palette && result.color_palette.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Palette</span>
                {result.color_palette.map((hex, i) => (
                  <Swatch key={i} hex={hex} />
                ))}
                <span style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
                  {result.color_palette.join(' · ')}
                </span>
              </div>
            )}

            {/* Brand elements */}
            {result.brand_elements && result.brand_elements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {result.brand_elements.map((el, i) => (
                  <Tag key={i} label={el} color={selected.color} />
                ))}
              </div>
            )}

            {/* CTA */}
            {result.cta && (
              <div style={{ background: `${selected.color}18`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                <span style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 13, color: selected.color, letterSpacing: 1 }}>
                  CTA: {result.cta}
                </span>
              </div>
            )}

            {/* Dimensions badge */}
            {result.dimensions && (
              <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10 }}>
                📐 {result.dimensions}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyBrief} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${selected?.color || GOLD}44`,
              background: copied ? `${selected?.color || GOLD}18` : 'rgba(255,255,255,0.04)',
              color: copied ? selected?.color || GOLD : 'rgba(255,255,255,0.5)',
              ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all .2s',
            }}>
              {copied ? '✓ COPIED' : '📋 COPY BRIEF'}
            </button>
            <button onClick={reset} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid rgba(255,255,255,0.1)`,
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
              ...T, fontSize: 13, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all .15s',
            }}>
              ⚡ FORGE ANOTHER
            </button>
          </div>
        </div>
      )}

      {/* Placeholder when nothing selected */}
      {!selected && !result && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.15)', ...T, fontSize: 14 }}>
          Select an asset type above to begin forging
        </div>
      )}
    </div>
  );
}
