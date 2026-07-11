import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';


import SwanAIRecommendations from '../components/live/SwanAIRecommendations';
import MilestoneAlerts from '../components/creator/MilestoneAlerts';
import AlertConfig from '../components/live/AlertConfig';
import ShopDashboard from '../components/merch/ShopDashboard';
import BackgroundCustomizer from '../components/settings/BackgroundCustomizer';
import StreamGoals from '../components/live/StreamGoals';
import StreamerMonetizationCenter from '../components/monetization/StreamerMonetizationCenter';
import NotificationBell from '../components/shared/NotificationBell';
import RewardShop from '../components/loyalty/RewardShop';
import HostAlertCenter from '../components/live/HostAlertCenter';
import ViewerCount from '../components/live/ViewerCount';
import SwanyBotWidget from '../components/guide/ARIAWidget';
import CollaborationMatcher from '../components/social/CollaborationMatcher';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CreatorBridge from '../components/social/CreatorBridge';
const BG      = '#080B18';
const BG2     = '#0D1022';
const BG3     = '#13182C';
const GOLD    = '#D4AF37';
const CRIMSON = '#800020';
const PURPLE  = '#7B5EA7';
const PURPLE_L= '#A07BC4';
const T       = { fontFamily: 'Barlow Condensed, sans-serif' };

const GLOBAL_CSS = `
@keyframes glowTribute{0%,100%{box-shadow:0 0 8px #7B5EA744;}50%{box-shadow:0 0 28px #7B5EA799;}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
.glow-tribute{animation:glowTribute 2.5s ease infinite;}
`;

function GCard({ children, style, tribute }) {
  return (
    <div className={tribute ? 'glow-tribute' : ''}
      style={{
        borderRadius: 14, padding: 16,
        background: BG3,
        border: `1px solid ${tribute ? PURPLE + '55' : 'rgba(212,175,55,0.1)'}`,
        ...style,
      }}>
      {children}
    </div>
  );
}

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

function Btn({ label, icon, onClick, variant = 'gold', size = 'md', disabled, style }) {
  const variants = {
    gold:    `linear-gradient(135deg,${GOLD},#8A6F2E)`,
    ghost:   'transparent',
    ruby:    `linear-gradient(135deg,${CRIMSON},#B22340)`,
    tribute: `linear-gradient(135deg,${PURPLE},${PURPLE_L})`,
  };
  const textColors = { gold: '#07050A', ghost: GOLD, ruby: '#fff', tribute: '#fff' };
  const pads = { sm: '6px 12px', md: '10px 18px', lg: '14px 28px' };
  const fonts = { sm: 11, md: 13, lg: 15 };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: variants[variant] || variants.gold,
      color: textColors[variant] || '#fff',
      border: variant === 'ghost' ? `1px solid ${GOLD}66` : 'none',
      borderRadius: 999, padding: pads[size] || pads.md,
      fontSize: fonts[size] || 13, ...T, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      transition: 'all .15s', letterSpacing: 0.5,
      ...(style || {}),
    }}>
      {icon && <span style={{ marginRight: label ? 5 : 0 }}>{icon}</span>}
      {label}
    </button>
  );
}

const LEGENDS = [
  {
    id: 1, name: 'Big Bone Earl', years: '1958–2021', state: 'WA', photo: '🎯', color: PURPLE,
    bio: 'Pioneer of Pacific Northwest domino culture. Won the Regional 7-0 Championship 4 consecutive times. Founded the Seattle Domino Society in 1994.',
    achievements: ['4× Regional Champion', 'Founder: Seattle Domino Society', 'Mentored 200+ players', 'Hall of Fame 2019'],
  },
  {
    id: 2, name: 'Mama Joyce Thompson', years: '1962–2023', state: 'GA', photo: '👑', color: '#9C6B3C',
    bio: "Queen of Southern domino culture. Her community tournaments brought thousands together across Georgia and the Southeast for over 30 years.",
    achievements: ['Community Builder Award', '30-Year Teaching Legacy', 'ATL Domino Hall of Fame', 'Founded 12 Community Leagues'],
  },
  {
    id: 3, name: 'Fast Hands Rodriguez', years: '1971–2022', state: 'TX', photo: '⚡', color: '#C62828',
    bio: 'Speed play innovator. Set the world record for fastest 7-0 sweep at 4 minutes 12 seconds. ESPN feature subject in 2018.',
    achievements: ['World Speed Record Holder', 'TX State Champ 2009–2015', 'ESPN Feature 2018', '3× Nationals Finalist'],
  },
];

const INIT_MESSAGES = [
  { legendId: 1, author: 'CaliBonesOG', msg: 'Big Bone Earl — REST EASY LEGEND. You built this whole culture 🙏', time: '2 days ago' },
  { legendId: 2, author: 'SwanyThree23', msg: 'Mama Joyce your tournaments gave us all a home. We carry you forward ❤️', time: '1 week ago' },
  { legendId: 3, author: 'VibeNBones', msg: 'Fast Hands was the reason I got serious about domino. GOAT forever ⚡', time: '3 days ago' },
];

export default function TributeWall() {
  const [selected, setSelected] = useState(null);
  const [tributeMsg, setTributeMsg] = useState('');
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [aiWriting, setAiWriting] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [nominateName, setNominateName] = useState('');
  const [nominateState, setNominateState] = useState('');
  const [nominateBio, setNominateBio] = useState('');
  const [nominateOpen, setNominateOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function aiWriteTribute() {
    if (!selected || aiWriting) return;
    setAiWriting(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a heartfelt 2-3 sentence tribute message for ${selected.name} (${selected.years}, ${selected.state}), a domino legend. Their story: ${selected.bio} Achievements: ${selected.achievements.join(', ')}. Write in the voice of a fellow domino player paying respects — authentic, warm, community-rooted. No hashtags.`,
        response_json_schema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
      });
      setTributeMsg(res?.message || res?.toString?.() || '');
    } catch {
      setTributeMsg(`${selected.name}, your legacy lives in every domino game played in your honor. Thank you for building this culture. Rest easy, Legend. 🙏`);
    }
    setAiWriting(false);
  }

  function postTribute() {
    if (!tributeMsg.trim() || !selected) return;
    const now = new Date().toLocaleDateString();
    setMessages(m => [...m, { legendId: selected.id, author: 'You', msg: tributeMsg, time: now }]);
    setTributeMsg('');
  }

  function submitNomination() {
    if (!nominateName.trim()) return;
    setSubmitted(true);
    setTimeout(() => { setNominateOpen(false); setSubmitted(false); setNominateName(''); setNominateState(''); setNominateBio(''); }, 2200);
  }

  const EVENT_DETAILS = [
    { l: 'EVENT DATE', v: 'July 4, 2026' },
    { l: 'PRIZE POOL', v: '$2,500' },
    { l: 'MEMORIAL FUND', v: '5% of All Entry' },
    { l: 'FORMAT', v: 'State vs State' },
    { l: 'SPLIT', v: '85 / 10 / 5' },
    { l: 'PLATFORM', v: 'SeeWhy LIVE' },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: BG, padding: '16px 16px 96px' }}>
        <a href="/Leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 12 }} aria-label="Back to Leaderboard">← Leaderboard</a>

        {/* Hero */}
        <div className="glow-tribute" style={{
          background: `linear-gradient(135deg,${PURPLE}22,${BG3})`,
          border: `1px solid ${PURPLE}77`, borderRadius: 16, padding: 20,
          textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 44, marginBottom: 6 }}>🕊️</div>
          <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 30, color: PURPLE_L, letterSpacing: 4, lineHeight: 1 }}>
            IN LOVING MEMORY
          </div>
          <div style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 1.6, fontStyle: 'italic' }}>
            Honoring the legends who built domino culture — their legacy lives in every game
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <Btn label="TRIBUTE GAMING EVENT" variant="tribute" size="sm" onClick={() => setEventOpen(v => !v)} />
            <Btn label="+ NOMINATE A LEGEND" variant="ghost" size="sm" onClick={() => setNominateOpen(v => !v)} />
          </div>
        </div>

        {/* Event details */}
        {eventOpen && (
          <GCard tribute style={{ marginBottom: 14 }}>
            <div style={{ ...T, fontSize: 16, fontWeight: 900, color: PURPLE_L, marginBottom: 10, letterSpacing: 1 }}>
              🎯 TRIBUTE SOCIAL GAMING EVENT
            </div>
            <div style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 14 }}>
              Play in honor of our fallen legends. All entry fees are split 85/10/5 — creator, platform, and 5% directly to the memorial community fund.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {EVENT_DETAILS.map(({ l, v }) => (
                <div key={l} style={{ background: BG2, borderRadius: 8, padding: 10 }}>
                  <div style={{ ...T, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 15, color: PURPLE_L }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Link to="/StateVsState" style={{ textDecoration: 'none', flex: 1 }}>
                <Btn label="REGISTER TEAM" variant="tribute" size="sm" style={{ width: '100%' }} />
              </Link>
              <Btn label="SHARE" variant="ghost" size="sm" onClick={() => { try { navigator.share({ title: 'SeeWhy LIVE Tribute Gaming Event', url: window.location.href }); } catch(_) { navigator.clipboard.writeText(window.location.href).catch(() => {}); } }} />
              <Btn label="DONATE" variant="ghost" size="sm" onClick={() => window.open('https://seewhy.live/donate', '_blank', 'noopener,noreferrer')} />
            </div>
          </GCard>
        )}

        {/* Nominate form */}
        {nominateOpen && (
          <GCard style={{ marginBottom: 14, border: `1px solid ${GOLD}33` }}>
            <div style={{ ...T, fontSize: 15, fontWeight: 900, color: GOLD, marginBottom: 12 }}>+ NOMINATE A LEGEND</div>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ ...T, color: GOLD, fontSize: 15 }}>Nomination submitted. Thank you for honoring their legacy.</div>
              </div>
            ) : (
              <>
                <input value={nominateName} onChange={e => setNominateName(e.target.value)} placeholder="Full name"
                  style={{ width: '100%', background: BG2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', ...T, fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                <input value={nominateState} onChange={e => setNominateState(e.target.value)} placeholder="State / Region"
                  style={{ width: '100%', background: BG2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', ...T, fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                <textarea value={nominateBio} onChange={e => setNominateBio(e.target.value)} placeholder="Tell us about their legacy..."
                  rows={3} style={{ width: '100%', background: BG2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', ...T, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn label="SUBMIT NOMINATION" variant="gold" size="sm" style={{ flex: 1 }} onClick={submitNomination} disabled={!nominateName.trim()} />
                  <Btn label="CANCEL" variant="ghost" size="sm" onClick={() => setNominateOpen(false)} />
                </div>
              </>
            )}
          </GCard>
        )}

        {/* Section label */}
        <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Honoured Legends · {LEGENDS.length}
        </div>

        {/* Legend cards */}
        {LEGENDS.map(leg => {
          const isOpen = selected && selected.id === leg.id;
          return (
            <div key={leg.id} style={{ marginBottom: 12, cursor: 'pointer' }}
              onClick={() => setSelected(isOpen ? null : leg)}>
              <div style={{
                borderRadius: 14, padding: 16,
                background: BG3,
                border: `1px solid ${isOpen ? leg.color + '88' : leg.color + '33'}`,
                transition: 'border-color .2s',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                    background: `radial-gradient(circle,${leg.color}55,${BG3})`,
                    border: `2px solid ${leg.color}88`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                  }}>{leg.photo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 18, color: '#fff', letterSpacing: 1 }}>
                      {leg.name}
                    </div>
                    <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'Space Mono, monospace' }}>
                      {leg.years} · {leg.state}
                    </div>
                    <div style={{ ...T, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6, lineHeight: 1.6 }}>
                      {leg.bio}
                    </div>
                  </div>
                  <div style={{ color: isOpen ? leg.color : 'rgba(255,255,255,0.2)', fontSize: 18, transition: 'all .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                    ▾
                  </div>
                </div>

                {/* Expanded section */}
                {isOpen && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${leg.color}44`, paddingTop: 14 }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                      Achievements
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                      {leg.achievements.map(a => <Tag key={a} label={a} color={leg.color} />)}
                    </div>

                    <div style={{ ...T, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                      Community Tributes
                    </div>
                    {messages.filter(m => m.legendId === leg.id).map((m, i) => (
                      <div key={i} style={{ background: BG2, borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ ...T, fontSize: 12, color: leg.color, fontWeight: 700 }}>{m.author}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'Space Mono, monospace' }}>{m.time}</span>
                        </div>
                        <div style={{ ...T, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{m.msg}</div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <input value={tributeMsg} onChange={e => setTributeMsg(e.target.value)}
                        placeholder="Leave a tribute message..."
                        style={{
                          flex: 1, minWidth: 160, background: BG2, border: `1px solid ${leg.color}55`,
                          borderRadius: 999, padding: '8px 14px', color: '#fff', ...T, fontSize: 12, outline: 'none',
                        }} />
                      <Btn
                        label={aiWriting ? '✨ Writing…' : '✨ AI Write'}
                        variant="ghost"
                        size="sm"
                        onClick={aiWriteTribute}
                        disabled={aiWriting}
                        style={{ borderColor: PURPLE + '88', color: PURPLE_L, background: PURPLE + '14' }}
                      />
                      <Btn label="POST" variant="tribute" size="sm" onClick={postTribute} disabled={!tributeMsg.trim()} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom note */}
        <div style={{ ...T, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8 }}>
          🕊️ Their legacy lives in every game played on SeeWhy LIVE
        </div>

      </div>
      <SwanAIRecommendations roomId={null} currentLayout="default" viewerCount={0} />
      <MilestoneAlerts userId={null} roomId={null} />
      <SwanyBotWidget />
      <CollaborationMatcher />
      <ContentRecommendations />
      <CreatorBridge user={null} />
      <StreamGoals isHost={true} currentTips={0} currentSubs={0} currentViewers={0} />
      <StreamerMonetizationCenter />
      <NotificationBell />
      <RewardShop creatorId={null} roomId={null} currentUser={null} />
      <HostAlertCenter />
      <ViewerCount count={0} peakViewers={0} />
      <BackgroundCustomizer />
    </>
  );
}
