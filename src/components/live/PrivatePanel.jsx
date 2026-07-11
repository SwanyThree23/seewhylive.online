import React, { useState } from 'react';
import { Lock, Users, Plus, X, Eye, EyeOff, MessageSquare, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PANEL_TYPES = [
  { id: 'vip', label: 'VIP Room', icon: '👑', desc: 'Invite-only private chat & stage', color: '#d4af37' },
  { id: 'backstage', label: 'Backstage', icon: '🎭', desc: 'Host + guests only', color: '#800020' },
  { id: 'subscriber', label: 'Subscribers', icon: '⭐', desc: 'Paid subscribers only', color: '#7B5DA6' },
  { id: 'custom', label: 'Custom Group', icon: '🔒', desc: 'Manually invite users', color: '#D4AF37' },
];

export default function PrivatePanel({ isHost, currentUser }) {
  const [activePanels, setActivePanels] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [panelName, setPanelName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [expandedPanel, setExpandedPanel] = useState(null);

  const createPanel = () => {
    if (!selectedType || !panelName.trim()) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setActivePanels(prev => [...prev, {
      id: Date.now(),
      type: selectedType,
      name: panelName,
      code,
      members: [currentUser?.full_name || 'You'],
      messages: [],
      isExpanded: false,
    }]);
    setPanelName('');
    setSelectedType(null);
    setShowCreate(false);
  };

  const joinPanel = () => {
    const panel = activePanels.find(p => p.code === inviteCode.toUpperCase());
    if (!panel) {
      return;
    }
    setInviteCode('');
  };

  const removePanel = (id) => setActivePanels(prev => prev.filter(p => p.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#d4af37]" />
          <span className="text-sm font-semibold text-white">Private Panels</span>
          {activePanels.length > 0 && (
            <span style={{ fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:99, background:'rgba(212,175,55,0.2)', color:'#d4af37', border:'1px solid rgba(212,175,55,0.3)' }}>{activePanels.length}</span>
          )}
        </div>
        {isHost && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-6 h-6 rounded-full bg-[#d4af37]/10 hover:bg-[#d4af37]/20 flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
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
            <div className="bg-[rgba(212,175,55,0.05)] border border-[#d4af37]/20 rounded-xl p-3 space-y-3">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Create Private Panel</p>
              
              <div className="grid grid-cols-2 gap-1.5">
                {PANEL_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      selectedType?.id === type.id
                        ? 'border-[#d4af37] bg-[#d4af37]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <span className="text-base">{type.icon}</span>
                    <p className="text-[10px] font-semibold text-white mt-0.5">{type.label}</p>
                    <p className="text-[11px] text-white/40">{type.desc}</p>
                  </button>
                ))}
              </div>

              <input
                value={panelName}
                onChange={e => setPanelName(e.target.value)}
                placeholder="Panel name..."
                style={{ width:'100%', padding:'10px 14px', background:'rgba(17,8,34,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
              />

              <div className="flex gap-2">
                <button
                  style={{ flex:1, padding:'6px 12px', borderRadius:8, border:'none', background: (!selectedType || !panelName.trim()) ? 'rgba(212,175,55,0.4)' : '#d4af37', color:'#000', fontWeight:700, cursor: (!selectedType || !panelName.trim()) ? 'not-allowed' : 'pointer', fontSize:12 }}
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
            style={{ flex:1, padding:'10px 14px', background:'rgba(17,8,34,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' }}
          />
          <button style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#d4af37', color:'#000', fontWeight:700, cursor:'pointer', fontSize:12 }} onClick={joinPanel}>
            Join
          </button>
        </div>
      )}

      {/* Active panels */}
      <div className="space-y-2">
        {activePanels.map(panel => {
          const typeInfo = PANEL_TYPES.find(t => t.id === panel.type?.id) || PANEL_TYPES[0];
          const isExpanded = expandedPanel === panel.id;
          return (
            <div key={panel.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedPanel(isExpanded ? null : panel.id)}
              >
                <span className="text-sm">{typeInfo?.icon || '🔒'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{panel.name}</p>
                  <p className="text-[10px] text-white/40 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" /> {panel.members.length} member{panel.members.length !== 1 ? 's' : ''}
                    <span className="ml-2 font-mono text-[#d4af37]">#{panel.code}</span>
                  </p>
                </div>
                {isHost && (
                  <button onClick={e => { e.stopPropagation(); removePanel(panel.id); }}>
                    <X className="w-3.5 h-3.5 text-white/30 hover:text-red-400" />
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-white/5 p-3 space-y-2">
                  <div className="bg-black/30 rounded-lg p-2 h-24 overflow-y-auto text-[11px] text-white/50 text-center flex items-center justify-center">
                    <div>
                      <MessageSquare className="w-5 h-5 mx-auto mb-1 text-white/20" />
                      Private chat coming soon
                    </div>
                  </div>
                  {isHost && (
                    <p className="text-[10px] text-white/30 text-center">
                      Share invite code: <span className="text-[#d4af37] font-mono font-bold">#{panel.code}</span>
                    </p>
                  )}
                </div>
              )}
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