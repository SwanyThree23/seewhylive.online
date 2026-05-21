import React, { useState, useEffect, useRef } from 'react';

const RULE_LABELS = {
  viewer_join: 'Greet New Viewers',
  gift_received: 'Hype Gifts',
  spam_detected: 'Spam Guard',
  viewers_drop_20pct: 'Drop Alert',
  new_subscription: 'Sub Shoutout'
};

export default function SwanyBotTab({ socket, botLogs, roomId }) {
  const [rules, setRules] = useState({
    viewer_join: true,
    gift_received: true,
    spam_detected: true,
    viewers_drop_20pct: true,
    new_subscription: true
  });
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [botLogs]);

  function toggleRule(key) {
    const newVal = !rules[key];
    setRules((prev) => ({ ...prev, [key]: newVal }));
    if (socket) {
      socket.emit('bot-rule-toggle', { roomId, rule: key, enabled: newVal });
    }
  }

  function getLogIcon(event) {
    if (event === 'viewer_join') return '👋';
    if (event === 'gift_received') return '🎁';
    if (event === 'spam_detected') return '🛡';
    if (event === 'milestone_1000') return '🔥';
    if (event === 'viewers_drop') return '⚠️';
    if (event === 'new_subscription') return '🎉';
    return '🤖';
  }

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0') + ':' + d.getSeconds().toString().padStart(2,'0');
  }

  return (
    <div className="tab-panel">
      <div className="glass-card" style={{marginBottom:'1rem'}}>
        <h2 className="panel-title">🤖 SWANYBOT ENGINE</h2>
        <p className="panel-sub">Real-time event automation for SeeWhy LIVE</p>

        <div className="bot-rules-grid">
          {Object.keys(RULE_LABELS).map((key) => (
            <div key={key} className="bot-rule-row">
              <div className="bot-rule-info">
                <span className="bot-rule-icon">{getLogIcon(key)}</span>
                <span className="bot-rule-name">{RULE_LABELS[key]}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={rules[key]}
                  onChange={() => toggleRule(key)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card">
        <h3 className="panel-title">LIVE EVENT LOG</h3>
        <div className="bot-log-feed">
          {botLogs.length === 0 && (
            <div className="bot-log-empty">Waiting for events...</div>
          )}
          {botLogs.map((log) => (
            <div key={log.id || Math.random()} className={'bot-log-entry bot-log-entry--' + (log.event || 'info')}>
              <span className="bot-log-time">{formatTime(log.ts)}</span>
              <span className="bot-log-icon">{getLogIcon(log.event)}</span>
              <span className="bot-log-event">{log.event || 'event'}</span>
              <span className="bot-log-msg">{log.message || ''}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="glass-card" style={{marginTop:'1rem'}}>
        <h3 className="panel-title">AURA AI STATUS</h3>
        <div className="aura-status-grid">
          <div className="aura-stat">
            <div className="aura-stat-label">Model</div>
            <div className="aura-stat-value" style={{fontFamily:'DM Mono, monospace', fontSize:'0.75rem'}}>claude-sonnet-4-20250514</div>
          </div>
          <div className="aura-stat">
            <div className="aura-stat-label">Rate Limit</div>
            <div className="aura-stat-value">1 msg / 8s</div>
          </div>
          <div className="aura-stat">
            <div className="aura-stat-label">Messages</div>
            <div className="aura-stat-value">{botLogs.filter((l) => l.event === 'viewer_join' || l.event === 'gift_received' || l.event === 'new_subscription').length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
