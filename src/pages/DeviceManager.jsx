import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Trash2, Pencil, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = '#C9A84C';
const BG   = '#0E0C09';
const TEXT = '#F0E8D4';
const CARD_BG = 'rgba(255,255,255,0.04)';

function deviceIcon(name) {
  if (!name) return Monitor;
  var n = name.toLowerCase();
  if (n.indexOf('mobile') !== -1 || n.indexOf('android') !== -1 || n.indexOf('iphone') !== -1) return Smartphone;
  return Monitor;
}

function daysAgo(dateStr) {
  if (!dateStr) return '';
  var ms = Date.now() - new Date(dateStr).getTime();
  var days = Math.floor(ms / 86400000);
  if (days === 0) return 'Added today';
  if (days === 1) return 'Added 1 day ago';
  return 'Added ' + days + ' days ago';
}

export default function DeviceManager() {
  const [devices, setDevices]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editingId, setEditingId]   = useState(null);
  const [editName, setEditName]     = useState('');
  const [saving, setSaving]         = useState(false);

  function fetchDevices() {
    setLoading(true);
    fetch('/api/push/subscriptions', {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') }
    })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        setDevices(data.subscriptions || []);
        setLoading(false);
      })
      .catch(function() {
        toast.error('Could not load devices');
        setLoading(false);
      });
  }

  useEffect(function() { fetchDevices(); }, []);

  function handleRename(deviceId) {
    if (!editName.trim()) return;
    setSaving(true);
    fetch('/api/push/subscriptions/' + deviceId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '')
      },
      body: JSON.stringify({ deviceName: editName.trim() })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) {
          setDevices(function(prev) {
            return prev.map(function(d) {
              return d.device_id === deviceId ? Object.assign({}, d, { device_name: editName.trim() }) : d;
            });
          });
          toast.success('Device renamed');
        } else {
          toast.error(data.error || 'Rename failed');
        }
        setEditingId(null);
        setSaving(false);
      })
      .catch(function() {
        toast.error('Rename failed');
        setEditingId(null);
        setSaving(false);
      });
  }

  function handleRemove(deviceId) {
    fetch('/api/push/subscriptions/' + deviceId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') }
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) {
          setDevices(function(prev) { return prev.filter(function(d) { return d.device_id !== deviceId; }); });
          toast.success('Device removed');
        } else {
          toast.error(data.error || 'Remove failed');
        }
      })
      .catch(function() { toast.error('Remove failed'); });
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: GOLD }}>Device Manager</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(240,232,212,0.5)' }}>
              Manage push notification devices and remote sign-out
            </p>
          </div>
          <button
            onClick={fetchDevices}
            style={{ background: 'none', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '6px 10px', color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Device list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(240,232,212,0.4)' }}>Loading…</div>
        ) : devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(240,232,212,0.4)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
            <Smartphone size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No devices registered for push notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {devices.map(function(device) {
              var Icon = deviceIcon(device.device_name);
              var isEditing = editingId === device.device_id;
              return (
                <div
                  key={device.device_id || device.id}
                  style={{ background: CARD_BG, border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <Icon size={22} style={{ color: GOLD, flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={function(e) { setEditName(e.target.value); }}
                        onKeyDown={function(e) { if (e.key === 'Enter') handleRename(device.device_id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                        maxLength={60}
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid ' + GOLD, borderRadius: 6, padding: '4px 8px', color: TEXT, fontSize: 14, width: '100%' }}
                      />
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {device.device_name || 'Unknown device'}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'rgba(240,232,212,0.45)', marginTop: 2 }}>
                      {daysAgo(device.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={function() { handleRename(device.device_id); }}
                        disabled={saving}
                        aria-label="Save device name"
                        style={{ background: GOLD, border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Check size={14} color={BG} />
                      </button>
                      <button
                        onClick={function() { setEditingId(null); }}
                        aria-label="Cancel rename"
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={14} color={TEXT} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={function() { setEditingId(device.device_id); setEditName(device.device_name || ''); }}
                        aria-label="Rename device"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Pencil size={14} color={GOLD} />
                      </button>
                      <button
                        onClick={function() { handleRemove(device.device_id); }}
                        aria-label="Remove device"
                        style={{ background: 'rgba(255,26,60,0.1)', border: '1px solid rgba(255,26,60,0.25)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} color="#FF1A3C" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(240,232,212,0.35)', textAlign: 'center' }}>
          Removing a device stops push notifications on that browser. It does not sign you out.
        </p>
      </div>
    </div>
  );
}
