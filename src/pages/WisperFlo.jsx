import React, { useReducer, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Pin, Globe, Clock, Users, Lock, MessageSquare, ChevronDown } from 'lucide-react';
import { WhisperPanel } from '../components/live/DMWhisperPanel';
import AggregatedChat from '../components/live/AggregatedChat';
import GiftAnimation from '../components/live/GiftAnimation';
import EnhancedStreamChat from '../components/live/EnhancedStreamChat';

const GUARDIAN_FLAG_THRESHOLD = 0.50;
const CREATOR_SPLIT = 0.90;

const LANG_FLAGS = {
  en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', pt: '🇧🇷', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳',
};
const LANG_LABELS = { en: 'English', es: 'Español', fr: 'Français', pt: 'Português', ja: '日本語', ko: '한국어', zh: '中文' };

const SLOW_MODE_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '3s', value: 3 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
];

const GEM_EMOTES = ['💎', '🔥', '👑', '🚀', '❤️', '🌊', '⚡', '🏆'];

const SEED_MESSAGES = [
  { id: 'sm1', user_name: 'DominoKing_WA', content: 'Let\'s GOOO Washington Classic! 🏆', lang: 'en', created_date: new Date(Date.now() - 120000).toISOString(), pinned: false },
  { id: 'sm2', user_name: 'CaliBones_Fan', content: '¡Qué partido tan increíble! El equipo está jugando de maravilla esta noche 🔥', lang: 'es', created_date: new Date(Date.now() - 90000).toISOString(), pinned: false },
  { id: 'sm3', user_name: 'SwanyFan99', content: 'SwanyThree23 the GOAT no debate! 👑', lang: 'en', created_date: new Date(Date.now() - 60000).toISOString(), pinned: true },
  { id: 'sm4', user_name: 'VibeNBones', content: 'C\'est incroyable ce stream! Bravo à tous! 🎉', lang: 'fr', created_date: new Date(Date.now() - 30000).toISOString(), pinned: false },
];

const initState = {
  input: '',
  slowMode: 0,
  lastSent: 0,
  subscriberOnly: false,
  translateTarget: 'en',
  showTranslateMenu: false,
  showSettings: false,
  expandedMsg: null,
  translationCache: {},
  translating: null,
  pinnedMsgs: ['sm3'],
  localMessages: [],
  gemCounts: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT': return { ...state, input: action.payload };
    case 'SET_SLOW_MODE': return { ...state, slowMode: action.payload };
    case 'TOGGLE_SUB_ONLY': return { ...state, subscriberOnly: !state.subscriberOnly };
    case 'SET_TRANSLATE_TARGET': return { ...state, translateTarget: action.payload, showTranslateMenu: false };
    case 'TOGGLE_TRANSLATE_MENU': return { ...state, showTranslateMenu: !state.showTranslateMenu };
    case 'TOGGLE_SETTINGS': return { ...state, showSettings: !state.showSettings };
    case 'SET_EXPANDED': return { ...state, expandedMsg: state.expandedMsg === action.payload ? null : action.payload };
    case 'SET_TRANSLATION': return { ...state, translationCache: { ...state.translationCache, [action.key]: action.value }, translating: null };
    case 'SET_TRANSLATING': return { ...state, translating: action.payload };
    case 'PIN_MSG': {
      var pins = state.pinnedMsgs;
      if (pins.includes(action.payload)) return { ...state, pinnedMsgs: pins.filter(p => p !== action.payload) };
      if (pins.length >= 3) return { ...state, pinnedMsgs: [...pins.slice(1), action.payload] };
      return { ...state, pinnedMsgs: [...pins, action.payload] };
    }
    case 'ADD_LOCAL': return { ...state, localMessages: [...state.localMessages, action.payload], input: '', lastSent: Date.now() };
    case 'ADD_GEM': return { ...state, gemCounts: { ...state.gemCounts, [action.msgId]: ((state.gemCounts[action.msgId] || 0) + 1) } };
    default: return state;
  }
}

function LangBadge({ lang }) {
  var flag = LANG_FLAGS[lang] || '🌐';
  return <span style={{ fontSize: 11, opacity: 0.7 }} title={LANG_LABELS[lang] || lang}>{flag}</span>;
}

function MsgBubble({ msg, isHost, pinned, expanded, onExpand, onPin, onGem, gemCount, onTranslate, translation, translating }) {
  var isSystem = msg.system;
  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '4px 12px' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>{msg.content}</span>
      </div>
    );
  }
  return (
    <div
      onClick={() => onExpand(msg.id)}
      style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: 8, background: expanded ? 'rgba(212,175,55,0.06)' : 'transparent', transition: 'background 0.15s', borderLeft: pinned ? '2px solid #d4af37' : '2px solid transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: msg.is_moderator ? '#00FF88' : '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', flexShrink: 0 }}>
          {msg.is_moderator && <span style={{ fontSize: 10, color: '#00FF88', marginRight: 4 }}>MOD</span>}
          {msg.user_name || 'Viewer'}
        </span>
        <LangBadge lang={msg.lang || 'en'} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, wordBreak: 'break-word' }}>{msg.content}</span>
      </div>
      {translation && (
        <div style={{ fontSize: 12, color: 'rgba(0,212,255,0.7)', marginTop: 3, fontStyle: 'italic', paddingLeft: 2 }}>↳ {translation}</div>
      )}
      {expanded && (
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <button onClick={e => { e.stopPropagation(); onGem(msg.id); }}
            style={{ padding: '3px 8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, color: '#d4af37', fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
            💎 {gemCount || 0}
          </button>
          {isHost && (
            <button onClick={e => { e.stopPropagation(); onPin(msg.id); }}
              style={{ padding: '3px 8px', background: pinned ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: pinned ? '#d4af37' : 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
              <Pin size={10} style={{ display: 'inline', marginRight: 4 }} />{pinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onTranslate(msg); }}
            style={{ padding: '3px 8px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6, color: '#00d4ff', fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
            {translating ? '...' : '🌐 Translate'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function WisperFlo({ roomId, isHost, currentUser }) {
  const [state, dispatch] = useReducer(reducer, initState);
  const qc = useQueryClient();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  var uid = currentUser && currentUser.id;
  var resolvedRoomId = roomId || 'wisperflo-demo';

  const { data: dbMessages } = useQuery({
    queryKey: ['wisperflo-msgs', resolvedRoomId],
    queryFn: () => base44.entities.Message.filter({ room_id: resolvedRoomId }, '-created_date', 60).then(r => r.reverse()).catch(() => []),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (!resolvedRoomId) return;
    var unsub = base44.entities.Message.subscribe(event => {
      if (event.data && event.data.room_id === resolvedRoomId && event.type === 'create') {
        qc.invalidateQueries({ queryKey: ['wisperflo-msgs', resolvedRoomId] });
      }
    });
    return unsub;
  }, [resolvedRoomId]);

  var allMessages = [...SEED_MESSAGES, ...(dbMessages || []), ...state.localMessages];
  var pinned = allMessages.filter(m => state.pinnedMsgs.includes(m.id));

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  var slowCooldown = state.slowMode > 0 ? Math.max(0, state.slowMode - Math.floor((Date.now() - state.lastSent) / 1000)) : 0;
  var canSend = state.input.trim() && slowCooldown === 0;

  async function sendMsg() {
    if (!canSend) return;
    var content = state.input.trim().slice(0, 500);
    var local = { id: 'local_' + Date.now(), user_name: (currentUser && currentUser.full_name) || 'You', content, lang: 'en', created_date: new Date().toISOString(), user_id: uid };
    dispatch({ type: 'ADD_LOCAL', payload: local });
    if (uid) {
      base44.entities.Message.create({ room_id: resolvedRoomId, user_id: uid, user_name: (currentUser && currentUser.full_name) || 'You', content }).catch(() => {});
    }
  }

  async function handleTranslate(msg) {
    var cacheKey = msg.id + '_' + state.translateTarget;
    if (state.translationCache[cacheKey]) return;
    dispatch({ type: 'SET_TRANSLATING', payload: msg.id });
    var result = await base44.functions.invoke('translateText', { text: msg.content, target_language: state.translateTarget }).catch(() => null);
    var translated = (result && result.data && result.data.translated_text) || msg.content;
    dispatch({ type: 'SET_TRANSLATION', key: cacheKey, value: translated });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#07050A', fontFamily: 'Rajdhani, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <MessageSquare size={14} color="#d4af37" />
        <span style={{ fontSize: 13, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>WISPERFLO</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>MULTILINGUAL CHAT</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {/* Translate selector */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => dispatch({ type: 'TOGGLE_TRANSLATE_MENU' })}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
              <Globe size={11} /> {LANG_FLAGS[state.translateTarget]} <ChevronDown size={10} />
            </button>
            {state.showTranslateMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: '#1a0a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, zIndex: 50, minWidth: 130, padding: 4 }}>
                {Object.entries(LANG_FLAGS).map(([code, flag]) => (
                  <button key={code} onClick={() => dispatch({ type: 'SET_TRANSLATE_TARGET', payload: code })}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px', background: state.translateTarget === code ? 'rgba(212,175,55,0.1)' : 'none', border: 'none', cursor: 'pointer', color: state.translateTarget === code ? '#d4af37' : 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', borderRadius: 6 }}>
                    {flag} {LANG_LABELS[code]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
            style={{ padding: '3px 8px', background: state.showSettings ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
            ⚙
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {state.showSettings && (
        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>Slow Mode:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {SLOW_MODE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => dispatch({ type: 'SET_SLOW_MODE', payload: opt.value })}
                    style={{ padding: '2px 8px', borderRadius: 99, border: state.slowMode === opt.value ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)', background: state.slowMode === opt.value ? 'rgba(212,175,55,0.15)' : 'transparent', color: state.slowMode === opt.value ? '#d4af37' : 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {isHost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <Lock size={12} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>Sub Only</span>
                <button onClick={() => dispatch({ type: 'TOGGLE_SUB_ONLY' })}
                  style={{ width: 32, height: 16, borderRadius: 8, border: 'none', background: state.subscriberOnly ? '#d4af37' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: state.subscriberOnly ? 18 : 2, transition: 'left 0.2s' }} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div style={{ padding: '6px 12px', background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.12)', flexShrink: 0 }}>
          {pinned.map(msg => (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Pin size={10} color="#d4af37" />
              <span style={{ fontSize: 11, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{msg.user_name}:</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{msg.content.slice(0, 60)}{msg.content.length > 60 ? '...' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {allMessages.map(msg => (
          <MsgBubble
            key={msg.id}
            msg={msg}
            isHost={isHost}
            pinned={state.pinnedMsgs.includes(msg.id)}
            expanded={state.expandedMsg === msg.id}
            onExpand={id => dispatch({ type: 'SET_EXPANDED', payload: id })}
            onPin={id => dispatch({ type: 'PIN_MSG', payload: id })}
            onGem={id => dispatch({ type: 'ADD_GEM', msgId: id })}
            gemCount={state.gemCounts[msg.id]}
            onTranslate={handleTranslate}
            translation={state.translationCache[msg.id + '_' + state.translateTarget]}
            translating={state.translating === msg.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Gem emotes */}
      <div style={{ display: 'flex', gap: 4, padding: '4px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, overflowX: 'auto' }}>
        {GEM_EMOTES.map(e => (
          <button key={e} onClick={() => { dispatch({ type: 'SET_INPUT', payload: state.input + e }); inputRef.current && inputRef.current.focus(); }}
            style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6, flexShrink: 0 }}>{e}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={state.input}
          onChange={e => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && canSend && sendMsg()}
          placeholder={slowCooldown > 0 ? `Slow mode: ${slowCooldown}s` : state.subscriberOnly ? 'Subscribers only' : 'Send a message...'}
          disabled={slowCooldown > 0}
          maxLength={500}
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'Rajdhani, sans-serif' }}
        />
        <button onClick={sendMsg} disabled={!canSend}
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: canSend ? 'rgba(212,175,55,0.8)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, cursor: canSend ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
          <Send size={15} color={canSend ? '#000' : 'rgba(255,255,255,0.3)'} />
        </button>
      </div>
      <WhisperPanel roomId={null} currentUser={null} />
      <AggregatedChat roomId={null} currentUser={null} isHost={false} onMessagesChange={() => {}} />
      <GiftAnimation event={null} onDone={() => {}} />
      <EnhancedStreamChat roomId={null} userId={null} userName={null} userRole={null} />
    </div>
  );
}