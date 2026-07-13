import React, { useReducer, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Heart, Star, Award, MapPin, Send, Calendar } from 'lucide-react';
import SpotlightBanner from '../components/community/SpotlightBanner';
import ShareToSocial from '../components/social/ShareToSocial';
import EngagementBadgesDisplay from '../components/live/EngagementBadgesDisplay';
import AnnouncementFeed from '../components/community/AnnouncementFeed';
import RealtimeLeaderboard from '../components/live/RealtimeLeaderboard';
import SocialLeaderboard from '../components/watchparty/SocialLeaderboard';
import OnlineUsersGrid from '../components/presence/OnlineUsersGrid';
import SpotlightSection from '../components/community/SpotlightSection';
import ContentRecommendations from '../components/social/ContentRecommendations';
import CollaborationMatcher from '../components/social/CollaborationMatcher';


const initState = {
  tab: 'wall',
  showCeremony: false,
  form: { name: '', years: '', region: '', quote: '', tribute: '' },
  submitting: false,
  submitted: false,
  localCandles: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, tab: action.payload };
    case 'TOGGLE_CEREMONY': return { ...state, showCeremony: !state.showCeremony };
    case 'SET_FORM': return { ...state, form: { ...state.form, [action.key]: action.value } };
    case 'SUBMIT_START': return { ...state, submitting: true };
    case 'SUBMIT_DONE': return { ...state, submitting: false, submitted: true, form: { name: '', years: '', region: '', quote: '', tribute: '' } };
    case 'LIGHT_CANDLE':
      return { ...state, localCandles: { ...state.localCandles, [action.id]: (state.localCandles[action.id] || 0) + 1 } };
    default: return state;
  }
}

function CandleFlicker() {
  return (
    <div style={{ fontSize: 20, animation: 'none', display: 'inline-block' }}>🕯</div>
  );
}

function LegendCard({ legend, localExtra, onLightCandle, isCeremony }) {
  var totalCandles = (legend.candles || 0) + (localExtra || 0);
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,10,10,0.95), rgba(30,15,15,0.9))',
      border: isCeremony ? '1px solid rgba(201,160,160,0.4)' : '1px solid rgba(201,160,160,0.15)',
      borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: isCeremony ? '0 0 30px rgba(201,160,160,0.1)' : 'none',
    }}>
      {isCeremony && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: -4 }}>
          <Star size={12} color="#C9A0A0" fill="#C9A0A0" />
          <span style={{ fontSize: 10, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>2026 HONORED LEGEND</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(201,160,160,0.15)', border: '1px solid rgba(201,160,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
          🎭
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif' }}>{legend.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{legend.years}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MapPin size={10} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{legend.region}</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(201,160,160,0.06)', border: '1px solid rgba(201,160,160,0.12)', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid rgba(201,160,160,0.3)' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.5 }}>"{legend.quote}"</div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif' }}>{legend.games_played}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>GAMES</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>{legend.titles_won}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>TITLES</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ff9999', fontFamily: 'Barlow Condensed, sans-serif' }}>{legend.tributes || 0}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>TRIBUTES</div>
        </div>
      </div>

      <button
        onClick={() => onLightCandle(legend.id)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: 'rgba(201,160,160,0.08)', border: '1px solid rgba(201,160,160,0.25)', borderRadius: 10, cursor: 'pointer', color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, transition: 'all 0.2s' }}
      >
        <CandleFlicker /> Light a Candle · {totalCandles}
      </button>
    </div>
  );
}

export default function FallenLegendsPage() {
  const [state, dispatch] = useReducer(reducer, initState);
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: userCommunity } = useQuery({
    queryKey: ['userCommunity', user?.id],
    queryFn: () => base44.entities.Community.filter({ owner_id: user?.id }).then(r => r[0] || null),
    enabled: !!user?.id,
  });
  const userCommunityId = userCommunity?.id || null;
  const { data: activeRoom } = useQuery({
    queryKey: ['activeRoom', user?.id],
    queryFn: () => base44.entities.Room.filter({ host_id: user?.id, status: 'live' }).then(r => r[0] || null),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
  const activeRoomId = activeRoom?.id || null;

  const { data: dbLegends } = useQuery({
    queryKey: ['fallen-legends'],
    queryFn: () => base44.entities.FallenLegend.filter({ approved: true }).catch(() => []),
  });

  var legends = dbLegends || [];
  var ceremony2026 = legends.filter(l => l.featured_year === 2026);

  const submitLegend = useMutation({
    mutationFn: () => base44.entities.FallenLegend.create({
      name: state.form.name,
      years: state.form.years,
      region: state.form.region,
      quote: state.form.quote,
      games_played: 0,
      titles_won: 0,
      candles: 0,
      tributes: 0,
      approved: false,
    }),
    onSuccess: () => {
      dispatch({ type: 'SUBMIT_DONE' });
      qc.invalidateQueries({ queryKey: ['fallen-legends'] });
    },
    onError: () => dispatch({ type: 'SUBMIT_DONE' }),
  });

  function handleSubmit() {
    if (!state.form.name || !state.form.years || !state.form.region) return;
    dispatch({ type: 'SUBMIT_START' });
    submitLegend.mutate();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0505', color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>

      {/* Ceremony Overlay */}
      {state.showCeremony && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 48 }}>🕯🕯🕯</div>
          <div style={{ fontSize: 14, color: 'rgba(201,160,160,0.7)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.3em' }}>WASHINGTON CLASSIC 2026</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif', textAlign: 'center' }}>IN MEMORIAM</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
            {ceremony2026.map(l => (
              <div key={l.id} style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                🕯 {l.name} · {l.years}
              </div>
            ))}
          </div>
          <button onClick={() => dispatch({ type: 'TOGGLE_CEREMONY' })} style={{ marginTop: 20, padding: '10px 28px', background: 'rgba(201,160,160,0.15)', border: '1px solid rgba(201,160,160,0.35)', borderRadius: 8, color: '#C9A0A0', fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>
            Close
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(20,5,5,0.98), rgba(10,5,5,0.95))', borderBottom: '1px solid rgba(201,160,160,0.15)', padding: '16px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
          <Flame size={20} color="#C9A0A0" />
          <div style={{ fontSize: 24, fontWeight: 900, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>FALLEN LEGENDS</div>
          <Flame size={20} color="#C9A0A0" />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>WASHINGTON CLASSIC MEMORIAL · HONORING THOSE WHO CAME BEFORE</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, borderBottom: '1px solid rgba(201,160,160,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        {['wall', 'ceremony', 'submit'].map(tab => (
          <button key={tab} onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
            style={{ padding: '11px 20px', background: 'none', border: 'none', borderBottom: state.tab === tab ? '2px solid #C9A0A0' : '2px solid transparent', color: state.tab === tab ? '#C9A0A0' : 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {tab === 'wall' ? '🕯 Memorial Wall' : tab === 'ceremony' ? '⭐ 2026 Ceremony' : '📝 Submit'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

        {/* MEMORIAL WALL */}
        {state.tab === 'wall' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {legends.filter(l => l.approved !== false).map(legend => (
                <LegendCard
                  key={legend.id}
                  legend={legend}
                  localExtra={state.localCandles[legend.id] || 0}
                  onLightCandle={id => dispatch({ type: 'LIGHT_CANDLE', id })}
                  isCeremony={legend.featured_year === 2026}
                />
              ))}
            </div>
          </div>
        )}

        {/* CEREMONY TAB */}
        {state.tab === 'ceremony' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🕯🕯🕯</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif' }}>2026 HONORED LEGENDS</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Washington Classic Memorial Ceremony</div>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_CEREMONY' })}
                style={{ marginTop: 16, padding: '10px 24px', background: 'rgba(201,160,160,0.15)', border: '1px solid rgba(201,160,160,0.35)', borderRadius: 8, color: '#C9A0A0', fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Flame size={14} /> Trigger Broadcast Ceremony
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {CEREMONY_2026.map(legend => (
                <LegendCard
                  key={legend.id}
                  legend={legend}
                  localExtra={state.localCandles[legend.id] || 0}
                  onLightCandle={id => dispatch({ type: 'LIGHT_CANDLE', id })}
                  isCeremony={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* SUBMIT TAB */}
        {state.tab === 'submit' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {state.submitted ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48 }}>🕯</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 12 }}>Nomination Submitted</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>The community admin will review your submission.</div>
                <button onClick={() => dispatch({ type: 'SET_TAB', payload: 'wall' })} style={{ marginTop: 20, padding: '10px 24px', background: 'rgba(201,160,160,0.15)', border: '1px solid rgba(201,160,160,0.3)', borderRadius: 8, color: '#C9A0A0', fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14 }}>
                  View Memorial Wall
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,160,160,0.15)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#C9A0A0', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 4 }}>Nominate a Legend</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Honor a player who shaped the domino community</div>
                {[
                  { key: 'name', label: 'Full Name *', placeholder: 'e.g. Big Sal Washington' },
                  { key: 'years', label: 'Years Active *', placeholder: 'e.g. 1965–2020' },
                  { key: 'region', label: 'Region *', placeholder: 'e.g. Pacific Northwest' },
                  { key: 'quote', label: 'Signature Quote', placeholder: 'Their most memorable words...' },
                  { key: 'tribute', label: 'Your Tribute Message', placeholder: 'Share a memory or tribute...' },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', marginBottom: 6 }}>{field.label}</label>
                    {field.key === 'tribute' || field.key === 'quote' ? (
                      <textarea
                        value={state.form[field.key]}
                        onChange={e => dispatch({ type: 'SET_FORM', key: field.key, value: e.target.value })}
                        placeholder={field.placeholder}
                        rows={3}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Rajdhani, sans-serif' }}
                      />
                    ) : (
                      <input
                        value={state.form[field.key]}
                        onChange={e => dispatch({ type: 'SET_FORM', key: field.key, value: e.target.value })}
                        placeholder={field.placeholder}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={handleSubmit}
                  disabled={state.submitting || !state.form.name || !state.form.years || !state.form.region}
                  style={{ width: '100%', padding: '13px', background: (!state.form.name || !state.form.years || !state.form.region) ? 'rgba(255,255,255,0.06)' : 'rgba(201,160,160,0.2)', border: '1px solid rgba(201,160,160,0.35)', borderRadius: 10, color: '#C9A0A0', fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Send size={15} /> {state.submitting ? 'Submitting...' : 'Submit Nomination'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
        <SpotlightBanner communityId={userCommunityId} isAdmin={false} />
        <ShareToSocial content={null} />
        <EngagementBadgesDisplay roomId={activeRoomId} userId={user?.id} creatorId={user?.id} />
        <AnnouncementFeed communityId={userCommunityId} />
        <RealtimeLeaderboard roomId={activeRoomId} creatorId={user?.id} />
        <SocialLeaderboard roomId={activeRoomId} />
        <SpotlightSection communityId={userCommunityId} />
        <OnlineUsersGrid compact maxVisible={10} />
        <ContentRecommendations />
        <CollaborationMatcher />
      </div>
    </div>
  );
}