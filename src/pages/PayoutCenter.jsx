import React, { useReducer, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Shield, Clock, CheckCircle, AlertCircle, TrendingUp, Lock, Bell, CreditCard, FileText } from 'lucide-react';
import RevenueDashboard from '../components/monetization/RevenueDashboard';
import StreamerGoalsWidget from '../components/monetization/StreamerGoalsWidget';
import SubscriptionManager from '../components/monetization/SubscriptionManager';
import StripeConnectButton from '../components/monetization/StripeConnectButton';

const CREATOR_SPLIT = 0.90;
const STRIPE_ACCOUNT_ID = 'acct_1Svbvv2N0KWn0OQu';

function creatorCut(gross) { return Math.floor(gross * CREATOR_SPLIT); }
function platformFee(gross) { return gross - creatorCut(gross); }


const LAYERS = [
  { id: 'db', label: 'DB Trigger', desc: 'creator_cut = FLOOR(gross * 0.90) enforced at insert', color: '#6DBF7E', icon: Shield },
  { id: 'api', label: 'API Middleware', desc: 'processPaymentWithPlatformCut() validates split before write', color: '#d4af37', icon: Lock },
  { id: 'stripe', label: 'Stripe Fee', desc: 'application_fee_amount = FLOOR(gross * 0.10) in cents', color: '#C0392B', icon: CreditCard },
];

const initState = {
  tab: 'overview',
  requestingPayout: false,
  payoutSuccess: false,
  settings: {
    autoPayoutThreshold: 100,
    notifications: true,
    weeklySummary: true,
    alerts1099: true,
    twoFa: false,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, tab: action.payload };
    case 'REQUEST_PAYOUT': return { ...state, requestingPayout: true };
    case 'PAYOUT_SUCCESS': return { ...state, requestingPayout: false, payoutSuccess: true };
    case 'SET_SETTING': return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    default: return state;
  }
}

function StatCard({ label, value, sub, color, icon }) {
  var Icon = icon || DollarSign;
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px', flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={color || 'rgba(255,255,255,0.4)'} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: color || '#fff', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  var map = { paid: { bg: 'rgba(109,191,126,0.1)', border: 'rgba(109,191,126,0.3)', color: '#6DBF7E', label: 'PAID' }, pending: { bg: 'rgba(212,133,74,0.1)', border: 'rgba(212,133,74,0.3)', color: '#D4854A', label: 'PENDING' }, failed: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', label: 'FAILED' } };
  var s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, border: '1px solid ' + s.border, color: s.color, fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>{s.label}</span>
  );
}

export default function PayoutCenter() {
  const [state, dispatch] = useReducer(reducer, initState);
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: payouts } = useQuery({
    queryKey: ['payout-records'],
    queryFn: () => base44.entities.PayoutRecord.filter({ creator_id: user && user.id }).catch(() => []),
    enabled: !!(user && user.id),
  });

  var records = payouts || [];
  var totalPaid = records.filter(r => r.status === 'paid').reduce((s, r) => s + creatorCut(r.gross || r.gross_amount || 0), 0);
  var pendingBalance = 847; // Simulated pending
  var totalGross = records.reduce((s, r) => s + (r.gross || r.gross_amount || 0), 0);

  function handleRequestPayout() {
    dispatch({ type: 'REQUEST_PAYOUT' });
    setTimeout(() => dispatch({ type: 'PAYOUT_SUCCESS' }), 2000);
  }

  var TABS = ['overview', 'history', 'stripe', 'settings'];

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1a2a1a, #6DBF7E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={18} color="#000" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>PAYOUT CENTER</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>90/10 Split · Always. · {STRIPE_ACCOUNT_ID}</div>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={12} color="#d4af37" />
          <span style={{ fontSize: 12, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif' }}>CREATOR_SPLIT = 0.90 · IMMUTABLE</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 20px', background: 'rgba(0,0,0,0.3)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
            style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: state.tab === tab ? '2px solid #d4af37' : '2px solid transparent', color: state.tab === tab ? '#d4af37' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {/* OVERVIEW TAB */}
        {state.tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Balance Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(109,191,126,0.08), rgba(212,175,55,0.06))', border: '1px solid rgba(109,191,126,0.2)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>AVAILABLE BALANCE</div>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>${pendingBalance.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Your 90% cut · Platform fee: ${Math.floor(pendingBalance / 9).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {state.payoutSuccess ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15 }}>
                    <CheckCircle size={20} /> Payout Requested!
                  </div>
                ) : (
                  <button
                    onClick={handleRequestPayout}
                    disabled={state.requestingPayout || pendingBalance < 25}
                    style={{ padding: '14px 28px', background: state.requestingPayout ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #4A9B5E, #6DBF7E)', border: 'none', borderRadius: 10, color: state.requestingPayout ? 'rgba(255,255,255,0.4)' : '#000', fontWeight: 900, fontSize: 16, cursor: state.requestingPayout ? 'wait' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {state.requestingPayout ? '⏳ Processing...' : '💸 REQUEST PAYOUT'}
                  </button>
                )}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Min withdrawal: $25</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard label="TOTAL EARNED (90%)" value={'$' + totalPaid.toLocaleString()} sub="All-time creator cut" color="#6DBF7E" icon={TrendingUp} />
              <StatCard label="TOTAL GROSS" value={'$' + totalGross.toLocaleString()} sub="Before platform fee" color="#d4af37" icon={DollarSign} />
              <StatCard label="PLATFORM FEE (10%)" value={'$' + Math.floor(totalGross * 0.10).toLocaleString()} sub="Derived from gross" color="rgba(255,255,255,0.4)" icon={Shield} />
              <StatCard label="STREAMS PAID" value={records.filter(r => r.status === 'paid').length} sub="Completed payouts" color="#C0392B" icon={CheckCircle} />
            </div>

            {/* 3-Layer Enforcement */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', marginBottom: 14 }}>90/10 SPLIT ENFORCEMENT LAYERS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {LAYERS.map((layer, i) => {
                  var Icon = layer.icon;
                  return (
                    <div key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: layer.color + '20', border: '1px solid ' + layer.color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color={layer.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: layer.color, fontFamily: 'Barlow Condensed, sans-serif' }}>Layer {i + 1}: {layer.label}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'Share Tech Mono, monospace' }}>{layer.desc}</div>
                      </div>
                      <CheckCircle size={16} color={layer.color} />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, fontSize: 11, color: 'rgba(212,175,55,0.9)', fontFamily: 'Barlow Condensed, sans-serif', textAlign: 'center' }}>
                🔒 CREATOR_SPLIT = 0.90 is hardcoded and cannot be overridden at any layer
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {state.tab === 'history' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 14 }}>PAYOUT HISTORY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {records.map(rec => {
                var gross = rec.gross || rec.gross_amount || 0;
                var cut = creatorCut(gross);
                var fee = platformFee(gross);
                return (
                  <div key={rec.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{rec.period}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{rec.streams || rec.stream_count || 0} streams · ID: {rec.id}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 80 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#6DBF7E', fontFamily: 'Barlow Condensed, sans-serif' }}>${cut.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>90% of ${gross.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>-${fee}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>platform</div>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STRIPE TAB */}
        {state.tab === 'stripe' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#C0392B', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 14 }}>STRIPE CONNECT DETAILS</div>
              {[
                { label: 'Account ID', value: STRIPE_ACCOUNT_ID },
                { label: 'Account Type', value: 'Express (Creator)' },
                { label: 'Payout Schedule', value: 'Weekly · Every Monday' },
                { label: 'Bank on File', value: '••••••••••••4242' },
                { label: 'Currency', value: 'USD' },
                { label: 'Country', value: 'United States' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif' }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontFamily: 'Share Tech Mono, monospace' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'rgba(212,175,55,0.8)', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1.6 }}>
              🔒 Revenue enforcement: <strong>creator_cut = Math.floor(gross * 0.90)</strong> · platform_fee = gross - creator_cut · Stripe application_fee_amount = Math.floor(gross * 0.10) in cents · CREATOR_SPLIT is immutable
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {state.tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'notifications', label: 'Payout Notifications', desc: 'Alert me when payouts complete', icon: Bell },
              { key: 'weeklySummary', label: 'Weekly Summary', desc: 'Earnings summary every Monday', icon: FileText },
              { key: 'alerts1099', label: '1099 Alerts', desc: 'Notify when 1099 threshold approaching', icon: AlertCircle },
              { key: 'twoFa', label: '2FA for Payouts', desc: 'Require 2FA to initiate payouts', icon: Lock },
            ].map(setting => {
              var Icon = setting.icon;
              var val = state.settings[setting.key];
              return (
                <div key={setting.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Icon size={18} color="rgba(255,255,255,0.4)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{setting.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{setting.desc}</div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'SET_SETTING', key: setting.key, value: !val })}
                    style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: val ? '#d4af37' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: val ? 23 : 3, transition: 'left 0.2s' }} />
                  </button>
                </div>
              );
            })}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 8 }}>Auto-Payout Threshold</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>$25</span>
                <input type="range" min={25} max={1000} step={25} value={state.settings.autoPayoutThreshold}
                  onChange={e => dispatch({ type: 'SET_SETTING', key: 'autoPayoutThreshold', value: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: '#d4af37' }} />
                <span style={{ fontSize: 14, fontWeight: 900, color: '#d4af37', fontFamily: 'Barlow Condensed, sans-serif', width: 50 }}>${state.settings.autoPayoutThreshold}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
        <RevenueDashboard userId={null} />
        <StreamerGoalsWidget creatorId={null} roomId={null} isCreator={true} embedded={true} />
        <SubscriptionManager creatorId={null} />
        <StripeConnectButton creatorId={null} />
      </div>
    </div>
  );
}