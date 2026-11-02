import React, { useState, useRef, useEffect } from 'react';
import { Lock, Users, Plus, X, MessageSquare, Crown, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PANEL_TYPES = [
  { id: 'vip', label: 'VIP Room', icon: '👑', desc: 'Invite-only private chat & stage', color: '#FFB800' },
  { id: 'backstage', label: 'Backstage', icon: '🎭', desc: 'Host + guests only', color: '#FF1564' },
  { id: 'subscriber', label: 'Subscribers', icon: '⭐', desc: 'Paid subscribers only', color: '#8B5CF6' },
  { id: 'custom', label: 'Custom Group', icon: '🔒', desc: 'Manually invite users', color: '#FFB800' },
];

const PANEL_CAPS = { vip: 5, backstage: 10, subscriber: 20, custom: 15 };

function PanelChat({ panel, currentUser, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [panel.messages.length]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(panel.id, trimmed, currentUser?.full_name || 'You');
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="border-t border-white/5 p-3 space-y-2">
      {/* Message list */}
      <div
        className="rounded-lg p-2 overflow-y-auto space-y-1.5"
        style={{ height: 112, background: 'rgba(0,0,0,0.3)' }}
      >
        {panel.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-4 h-4 mb-1" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>No messages yet — say something</p>
          </div>
        ) : (
          panel.messages.map((msg) => (
            <div key={msg.id} className="flex gap-1.5">
              <div
                className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black"
                style={{ background: 'rgba(255,184,0,0.25)', color: '#FFB800', marginTop: 1 }}
              >
                {msg.sender[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold" style={{ color: '#FFB800' }}>{msg.sender} </span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{msg.text}</span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Private message…"
          maxLength={280}
          style={{
            flex: 1, height: 30, padding: '0 10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,184,0,0.2)',
            borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none',
            fontFamily: 'Barlow Condensed, sans-serif',
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: text.trim() ? '#FF1564' : 'rgba(255,21,100,0.3)',
            color: '#FFB800', cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={12} />
        </button>
      </div>

      {/* Invite code */}
      <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Invite code: <span className="font-mono font-bold" style={{ color: '#FFB800' }}>#{panel.code}</span>
      </p>
    </div>
  );
}

export default function PrivatePanel({ isHost, currentUser }) {
  const [activePanels, setActivePanels] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [panelName, setPanelName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [membersOpenId, setMembersOpenId] = useState(null);

  const createPanel = () => {
    if (!selectedType || !panelName.trim()) return;
    const arr = new Uint8Array(4);
    crypto.getRandomValues(arr);
    const code = Array.from(arr).map(b => b.toString(36)).join('').toUpperCase().slice(0, 6);
    const newPanel = {
      id: Date.now(),
      type: selectedType,
      name: panelName,
      code,
      members: [currentUser?.full_name || 'You'],
      messages: [],
    };
    setActivePanels(prev => [...prev, newPanel]);
    setExpandedPanel(newPanel.id);
    setPanelName('');
    setSelectedType(null);
    setShowCreate(false);
  };

  const joinPanel = () => {
    const panel = activePanels.find(p => p.code === inviteCode.toUpperCase());
    if (!panel) return;
    const cap = PANEL_CAPS[panel.type?.id || panel.type] || 10;
    if (panel.members.length >= cap) return;
    const name = currentUser?.full_name || 'Guest';
    setActivePanels(prev => prev.map(p =>
      p.id === panel.id && !p.members.includes(name)
        ? { ...p, members: [...p.members, name], lastJoined: name }
        : p
    ));
    setExpandedPanel(panel.id);
    setInviteCode('');
  };

  const sendMessage = (panelId, text, sender) => {
    setActivePanels(prev => prev.map(p =>
      p.id === panelId
        ? { ...p, messages: [...p.messages, { id: Date.now(), sender, text, ts: Date.now() }] }
        : p
    ));
  };

  const removePanel = (id) => {
    setActivePanels(prev => prev.filter(p => p.id !== id));
    if (expandedPanel === id) setExpandedPanel(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#FFB800]" />
          <span className="text-sm font-semibold text-white">Private Panels</span>
          {activePanels.length > 0 && (
            <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(255,184,0,0.2)', color:'#FFB800', border:'1px solid rgba(255,184,0,0.3)' }}>
              {activePanels.length}
            </span>
          )}
        </div>
        {isHost && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-6 h-6 rounded-full bg-[#FFB800]/10 hover:bg-[#FFB800]/20 flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5 text-[#FFB800]" />
          </button>
        )}
      </div>

      {/* Create panel */}
      <AnimatePresence>
        {showCreate && isHost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[rgba(255,184,0,0.05)] border border-[#FFB800]/20 rounded-xl p-3 space-y-3">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Create Private Panel</p>

              <div className="grid grid-cols-2 gap-1.5">
                {PANEL_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      selectedType?.id === type.id
                        ? 'border-[#FFB800] bg-[#FFB800]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <span className="text-base">{type.icon}</span>
                    <p className="text-[10px] font-semibold text-white mt-0.5">{type.label}</p>
                    <p className="text-[11px] text-white/40">{type.desc}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: type.color, opacity: 0.7 }}>max {PANEL_CAPS[type.id]}</p>
                  </button>
                ))}
              </div>

              <input
                value={panelName}
                onChange={e => setPanelName(e.target.value)}
                placeholder="Panel name..."
                style={{ width:'100%', padding:'10px 14px', background:'rgba(3,3,10,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
              />

              <div className="flex gap-2">
                <button
                  style={{ flex:1, padding:'6px 12px', borderRadius:8, border:'none', background: (!selectedType || !panelName.trim()) ? 'rgba(255,184,0,0.4)' : '#FFB800', color:'#000', fontWeight:700, cursor: (!selectedType || !panelName.trim()) ? 'not-allowed' : 'pointer', fontSize:12 }}
                  onClick={createPanel}
                  disabled={!selectedType || !panelName.trim()}
                >
                  Create Panel
                </button>
                <button style={{ padding:'6px 12px', borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:12 }} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join with code */}
      {!isHost && (
        <div className="flex gap-2">
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="Enter invite code..."
            style={{ flex:1, padding:'10px 14px', background:'rgba(3,3,10,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
          />
          <button style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#FFB800', color:'#000', fontWeight:700, cursor:'pointer', fontSize:12 }} onClick={joinPanel}>
            Join
          </button>
        </div>
      )}

      {/* Active panels */}
      <div className="space-y-2">
        {activePanels.map(panel => {
          const typeInfo = PANEL_TYPES.find(t => t.id === panel.type?.id) || PANEL_TYPES[0];
          const isExpanded = expandedPanel === panel.id;
          const unread = !isExpanded ? panel.messages.length : 0;
          return (
            <div key={panel.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedPanel(isExpanded ? null : panel.id)}
              >
                <span className="text-sm">{typeInfo?.icon || '🔒'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-white truncate">{panel.name}</p>
                    {unread > 0 && (
                      <span style={{ fontSize:9, fontWeight:900, padding:'1px 5px', borderRadius:99, background:'#FF1564', color:'#FFB800' }}>
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={e => { e.stopPropagation(); setMembersOpenId(membersOpenId === panel.id ? null : panel.id); }}
                      className="text-[10px] text-white/40 flex items-center gap-1 hover:text-white/60"
                    >
                      <Users className="w-2.5 h-2.5" />
                      {panel.members.length}/{PANEL_CAPS[panel.type?.id || panel.type] || 10}
                      {panel.members.length >= (PANEL_CAPS[panel.type?.id || panel.type] || 10) && (
                        <span className="ml-1 text-[9px] text-[#FF2040]">FULL</span>
                      )}
                    </button>
                    <span className="ml-1 font-mono text-[#FFB800] text-[10px]">#{panel.code}</span>
                    {panel.lastJoined && (
                      <span className="ml-1 text-[9px] text-[#00FF88] animate-pulse">+{panel.lastJoined.split(' ')[0]} joined</span>
                    )}
                  </div>
                </div>
                {isHost && (
                  <button onClick={e => { e.stopPropagation(); removePanel(panel.id); }}>
                    <X className="w-3.5 h-3.5 text-white/30 hover:text-[#FF2040]" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {membersOpenId === panel.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2 border-t border-white/5 flex flex-wrap gap-1.5">
                      {panel.members.map((m, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.2)' }}>{m}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <PanelChat panel={panel} currentUser={currentUser} onSend={sendMessage} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {activePanels.length === 0 && !showCreate && (
        <p className="text-[10px] text-white/20 text-center py-2">
          {isHost ? 'Create a private panel for VIPs, backstage, or subscribers' : 'No private panels available'}
        </p>
      )}
    </div>
  );
}