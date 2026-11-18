import React, { useState, useEffect, useCallback } from 'react';
import { Webhook, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

var EVENTS = [
  { id: 'room.started',  label: 'Room Started',   color: '#00FF88' },
  { id: 'room.ended',    label: 'Room Ended',      color: '#FF2040' },
  { id: 'user.joined',   label: 'User Joined',     color: '#60A5FA' },
  { id: 'hand.raised',   label: 'Hand Raised',     color: '#FBBF24' },
  { id: 'battle.result', label: 'Battle Result',   color: '#C9A84C' },
];

var API = '/api/outbound-webhooks';

function getToken() {
  try {
    var tk = localStorage.getItem('app_token') || localStorage.getItem('auth_token') || '';
    return tk;
  } catch (_) { return ''; }
}

function apiFetch(path, opts) {
  var tk = getToken();
  var headers = Object.assign({ 'Content-Type': 'application/json' }, (opts && opts.headers) || {});
  if (tk) headers['Authorization'] = 'Bearer ' + tk;
  return fetch(API + path, Object.assign({}, opts || {}, { headers: headers }));
}

function SecretReveal(props) {
  var secret = props.secret;
  var [shown, setShown] = useState(false);
  var [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(secret).then(function() {
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 1800);
    }).catch(function() { toast.error('Copy failed'); });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px' }}>
      <code style={{ flex: 1, fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {shown ? secret : '•'.repeat(Math.min(secret.length, 40))}
      </code>
      <button onClick={function() { setShown(!shown); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
        {shown ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button onClick={copy} style={{ background: 'none', border: 'none', color: copied ? '#00FF88' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
        {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

export default function OutboundWebhooks(props) {
  var isHost = props.isHost;
  var [expanded, setExpanded] = useState(false);
  var [webhooks, setWebhooks] = useState([]);
  var [loading, setLoading] = useState(false);
  var [adding, setAdding] = useState(false);
  var [testing, setTesting] = useState(null);
  var [newSecret, setNewSecret] = useState(null); // { id, secret } shown once after creation
  var [newUrl, setNewUrl] = useState('');
  var [newEvents, setNewEvents] = useState(['room.started', 'room.ended', 'user.joined', 'hand.raised', 'battle.result']);

  var load = useCallback(function() {
    if (!isHost) return;
    setLoading(true);
    apiFetch('').then(function(r) {
      if (!r.ok) throw new Error('Failed');
      return r.json();
    }).then(function(d) {
      setWebhooks(d.webhooks || []);
    }).catch(function() {
      toast.error('Could not load webhooks');
    }).finally(function() {
      setLoading(false);
    });
  }, [isHost]);

  useEffect(function() {
    if (expanded) load();
  }, [expanded, load]);

  function toggleEvent(ev) {
    setNewEvents(function(prev) {
      return prev.includes(ev) ? prev.filter(function(e) { return e !== ev; }) : prev.concat([ev]);
    });
  }

  function handleAdd() {
    if (!newUrl.trim() || !newUrl.trim().startsWith('https://')) {
      toast.error('URL must start with https://');
      return;
    }
    setAdding(true);
    apiFetch('', {
      method: 'POST',
      body: JSON.stringify({ url: newUrl.trim(), events: newEvents }),
    }).then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'Failed'); });
      return r.json();
    }).then(function(d) {
      setNewUrl('');
      setNewSecret({ id: d.id, secret: d.secret });
      setWebhooks(function(prev) { return [{ id: d.id, url: d.url, events: d.events, active: true, created_at: d.created_at }].concat(prev); });
      toast.success('Webhook created');
    }).catch(function(e) {
      toast.error(e.message || 'Failed to create webhook');
    }).finally(function() { setAdding(false); });
  }

  function handleDelete(id) {
    apiFetch('/' + id, { method: 'DELETE' }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      setWebhooks(function(prev) { return prev.filter(function(w) { return w.id !== id; }); });
      toast.success('Webhook removed');
    }).catch(function() { toast.error('Failed to remove webhook'); });
  }

  function handleToggle(id, active) {
    apiFetch('/' + id, {
      method: 'PATCH',
      body: JSON.stringify({ active: !active }),
    }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      setWebhooks(function(prev) {
        return prev.map(function(w) { return w.id === id ? Object.assign({}, w, { active: !w.active }) : w; });
      });
    }).catch(function() { toast.error('Failed to update webhook'); });
  }

  function handleTest(id, url) {
    setTesting(id);
    apiFetch('/' + id + '/test', { method: 'POST' }).then(function(r) {
      if (!r.ok) throw new Error('Failed');
      toast.success('Test event fired to ' + url.slice(0, 40) + '…');
    }).catch(function() {
      toast.error('Test failed');
    }).finally(function() { setTesting(null); });
  }

  if (!isHost) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
      {/* Header toggle */}
      <button
        onClick={function() { setExpanded(!expanded); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
      >
        <Webhook size={16} style={{ color: '#C9A84C' }} />
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, textAlign: 'left' }}>Outbound Webhooks</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginRight: 4 }}>
          {webhooks.length > 0 && webhooks.length + ' configured'}
        </span>
        {expanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            SeeWhy sends HMAC-signed POST requests to your URL when these events happen.
            Verify with the <code style={{ color: '#C9A84C' }}>x-seewhy-signature</code> header.
          </p>

          {/* New secret banner — shown once */}
          {newSecret && (
            <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 12, color: '#00FF88', fontWeight: 700, margin: '0 0 6px' }}>Webhook secret — save this now, it won't be shown again</p>
              <SecretReveal secret={newSecret.secret} />
              <button onClick={function() { setNewSecret(null); }} style={{ marginTop: 8, background: 'none', border: 'none', fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0 }}>Dismiss</button>
            </div>
          )}

          {/* Add form */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="url"
              value={newUrl}
              onChange={function(e) { setNewUrl(e.target.value); }}
              placeholder="https://your-server.com/hooks/seewhy"
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EVENTS.map(function(ev) {
                var active = newEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    onClick={function() { toggleEvent(ev.id); }}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, cursor: 'pointer',
                      background: active ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.3)',
                      border: '1px solid ' + (active ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'),
                      color: active ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {ev.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !newUrl.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: adding ? 'not-allowed' : 'pointer',
                background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C',
                opacity: adding ? 0.6 : 1,
              }}
            >
              <Plus size={14} /> {adding ? 'Creating…' : 'Add Webhook'}
            </button>
          </div>

          {/* List */}
          {loading && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 8 }}>Loading…</div>
          )}
          {!loading && webhooks.length === 0 && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>No webhooks yet</p>
          )}
          {webhooks.map(function(wh) {
            return (
              <div key={wh.id} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: wh.active ? '#00FF88' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</span>
                  <button
                    onClick={function() { handleTest(wh.id, wh.url); }}
                    disabled={testing === wh.id}
                    style={{ background: 'none', border: 'none', fontSize: 11, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
                  >
                    {testing === wh.id ? '…' : 'Test'}
                  </button>
                  <button
                    onClick={function() { handleToggle(wh.id, wh.active); }}
                    style={{ background: 'none', border: 'none', fontSize: 11, color: wh.active ? '#FBBF24' : 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
                  >
                    {wh.active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={function() { handleDelete(wh.id); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.6)', cursor: 'pointer', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {Array.isArray(wh.events) && wh.events.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {wh.events.map(function(ev) {
                      var info = EVENTS.find(function(e) { return e.id === ev; });
                      return (
                        <span key={ev} style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: info ? info.color : 'rgba(255,255,255,0.4)' }}>
                          {info ? info.label : ev}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
