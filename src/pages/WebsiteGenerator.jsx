import React, { useState, useRef } from 'react';
import { Globe, Sparkles, Copy, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const BG   = '#07050A';
const GOLD = '#C9A84C';
const BURG = '#6B1F2A';
const DIM  = 'rgba(255,255,255,0.45)';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const TEMPLATES = [
  {
    id: 'streaming',
    label: 'Streaming Landing Page',
    desc: 'Promote your live channel with schedule, highlights & subscribe CTA',
    prompt: `Create a modern, dark-themed streaming landing page for a creator named {name}.
Include: hero section with channel name and tagline "{tagline}", live schedule section,
recent highlights gallery (placeholder cards), social links, and a "Watch Live" CTA button.
Style: obsidian black (#07050A) background, gold (#C9A84C) accents, Barlow Condensed font,
mobile-first responsive. Output complete self-contained HTML with embedded CSS.`,
  },
  {
    id: 'event',
    label: 'Event Page',
    desc: 'Announce a live event, tournament, or watch party with countdown',
    prompt: `Create an event announcement page for "{name}" — event: "{tagline}".
Include: hero with event name, JS countdown timer, date/time/location details,
register button, agenda/schedule section, FAQ accordion.
Style: dark (#07050A bg), burgundy (#6B1F2A) and gold (#C9A84C) accents, bold typography.
Output complete self-contained HTML with embedded CSS and JS.`,
  },
  {
    id: 'bio',
    label: 'Creator Bio Page',
    desc: 'Personal brand page with stats, links, and content portfolio',
    prompt: `Create a creator bio page for "{name}" — tagline: "{tagline}".
Include: profile hero with avatar placeholder, bio paragraph, stats row (followers/streams/hours),
social links grid, content categories, contact/booking section.
Style: obsidian dark, gold highlights, clean card layout.
Output complete self-contained HTML with embedded CSS.`,
  },
  {
    id: 'domino',
    label: 'Domino Event Page',
    desc: 'NDL/UDL/CaliBones tournament page with bracket & schedule',
    prompt: `Create a domino tournament event page for "{name}" — event: "{tagline}".
Include: hero with tournament name and gold trophy icon, bracket placeholder,
event schedule table, registration section, sponsor logos area, livestream embed placeholder.
Style: obsidian black, gold (#C9A84C) and burgundy (#6B1F2A) accents, sports aesthetic.
Output complete self-contained HTML with embedded CSS.`,
  },
];

export default function WebsiteGenerator() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const [templateId, setTemplateId] = useState('streaming');
  const [creatorName, setCreatorName] = useState(user?.full_name || '');
  const [tagline, setTagline] = useState('');
  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState('');
  const [tab, setTab] = useState('preview'); // 'preview' | 'code'
  const iframeRef = useRef(null);

  const selectedTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];

  async function generate() {
    const name = creatorName.trim() || 'Creator';
    const tl   = tagline.trim()  || selectedTemplate.desc;
    setGenerating(true);
    setHtml('');
    try {
      const finalPrompt = selectedTemplate.prompt
        .replace(/\{name\}/g, name)
        .replace(/\{tagline\}/g, tl);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: finalPrompt,
        add_context_from_internet: false,
      });
      const raw = typeof result === 'string' ? result : (result?.choices?.[0]?.message?.content ?? result?.text ?? '');
      // Extract HTML block if wrapped in ```html ... ```
      const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
      setHtml(match ? match[1].trim() : raw.trim());
      setTab('preview');
      toast.success('Site generated!');
    } catch (err) {
      toast.error('Generation failed — check your OpenRouter key in Settings.');
    } finally {
      setGenerating(false);
    }
  }

  function copyHtml() {
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => toast.success('HTML copied!')).catch(() => {});
  }

  function downloadHtml() {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(creatorName || 'site').toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, ...T, paddingBottom: 32 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(7,5,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
          <Globe style={{ width: 16, height: 16, color: GOLD }} />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, ...T }}>Website Generator</h1>
          <p style={{ fontSize: 11, color: DIM, ...T }}>AI-powered site builder</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Template picker */}
        <div style={{ borderRadius: 14, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Template</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplateId(t.id)} style={{
                padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                background: templateId === t.id ? `${GOLD}18` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${templateId === t.id ? GOLD + '55' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.15s',
              }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: templateId === t.id ? GOLD : 'rgba(255,255,255,0.8)', ...T }}>{t.label}</p>
                <p style={{ fontSize: 10, color: DIM, marginTop: 2, ...T }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ borderRadius: 14, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>Customize</p>
          <div>
            <label style={{ fontSize: 11, color: DIM, ...T }}>Creator / Brand Name</label>
            <input
              value={creatorName}
              onChange={e => setCreatorName(e.target.value)}
              placeholder="e.g. SwanyThree, CaliBones Nation…"
              style={{
                marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.25)',
                color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: DIM, ...T }}>Tagline / Event Title</label>
            <input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="e.g. Where champions are made, August 2026 Austin…"
              style={{
                marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.25)',
                color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              padding: '11px 20px', borderRadius: 10, cursor: generating ? 'not-allowed' : 'pointer',
              background: generating ? 'rgba(201,168,76,0.08)' : `${GOLD}22`,
              border: `1px solid ${generating ? 'rgba(201,168,76,0.15)' : GOLD + '55'}`,
              color: generating ? DIM : GOLD,
              fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...T,
              transition: 'all 0.15s',
            }}
          >
            {generating
              ? <><RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><Sparkles style={{ width: 14, height: 14 }} /> Generate Site</>
            }
          </button>
        </div>

        {/* Output */}
        {html && (
          <div style={{ borderRadius: 14, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(201,168,76,0.2)', overflow: 'hidden' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', gap: 8 }}>
              {['preview', 'code'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                  background: tab === t ? `${GOLD}20` : 'transparent',
                  border: `1px solid ${tab === t ? GOLD + '40' : 'transparent'}`,
                  color: tab === t ? GOLD : DIM, ...T,
                }}>
                  {t === 'preview' ? 'Preview' : 'HTML Code'}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={copyHtml} title="Copy HTML" style={{ padding: '5px 8px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer' }}>
                <Copy style={{ width: 13, height: 13 }} />
              </button>
              <button onClick={downloadHtml} title="Download .html" style={{ padding: '5px 8px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer' }}>
                <Download style={{ width: 13, height: 13 }} />
              </button>
            </div>

            {tab === 'preview' ? (
              <iframe
                ref={iframeRef}
                srcDoc={html}
                sandbox="allow-scripts"
                title="Generated site preview"
                style={{ width: '100%', height: 520, border: 'none', background: '#fff', display: 'block' }}
              />
            ) : (
              <pre style={{
                margin: 0, padding: 16, overflowX: 'auto', maxHeight: 520,
                fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)',
                fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {html}
              </pre>
            )}
          </div>
        )}

        {/* Usage hint */}
        {!html && !generating && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12, ...T }}>
            Pick a template, enter your details, and hit Generate Site.<br />
            Your complete HTML file will appear here — ready to host anywhere.
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
