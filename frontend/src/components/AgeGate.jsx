'use strict';
import React, { useState } from 'react';

var BG    = '#0E0C09';
var SURF  = '#1A1510';
var CARD  = '#241C12';
var GOLD  = '#C9A84C';
var BURG  = '#800020';
var TEXT  = '#F0E8D4';
var MUTED = '#8A7A62';
var BORDER = 'rgba(201,168,76,.2)';

export default function AgeGate({ role, onConfirm }) {
  var minAge = (role === 'host' || role === 'cohost') ? 21 : 18;
  var roleLabel = (role === 'host' || role === 'cohost') ? 'HOST / CO-HOST' : 'VIEWER';
  var [checked, setChecked] = useState(false);
  var [dobYear, setDobYear] = useState('');
  var [error, setError] = useState('');

  function handleConfirm() {
    if (!checked) { setError('You must confirm your age to continue'); return; }
    if (dobYear) {
      var yr = parseInt(dobYear, 10);
      var currentYear = new Date().getFullYear();
      var age = currentYear - yr;
      if (isNaN(yr) || yr < 1900 || yr > currentYear - minAge) {
        setError('You must be ' + minAge + ' or older to ' + (minAge === 21 ? 'host' : 'watch') + ' on SeeWhy LIVE');
        return;
      }
    }
    localStorage.setItem('sw_age_ok_' + (role === 'host' || role === 'cohost' ? 'host' : 'viewer'), '1');
    onConfirm();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes ageFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' }} />
      <div style={{ width: '100%', maxWidth: 380, animation: 'ageFade .4s ease' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔞</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: TEXT, letterSpacing: 4, lineHeight: 1 }}>SeeWhy LIVE</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, marginTop: 4, letterSpacing: 2 }}>AGE VERIFICATION REQUIRED</div>
        </div>

        {/* Card */}
        <div style={{ background: SURF, border: '1px solid ' + BORDER, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Role badge */}
          <div style={{ background: 'rgba(128,0,32,.18)', border: '1px solid rgba(128,0,32,.4)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 2 }}>JOINING AS</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: GOLD, letterSpacing: 2 }}>{roleLabel}</div>
          </div>

          {/* Age requirement */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: GOLD, lineHeight: 1 }}>{minAge}+</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, marginTop: 4 }}>
              You must be {minAge} years of age or older to {minAge === 21 ? 'stream as a host on' : 'watch content on'} SeeWhy LIVE
            </div>
          </div>

          {/* Optional birth year */}
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 6 }}>BIRTH YEAR (OPTIONAL)</div>
            <input
              type="number"
              placeholder={'e.g. ' + (new Date().getFullYear() - minAge - 5)}
              value={dobYear}
              onChange={function(e) { setDobYear(e.target.value); setError(''); }}
              style={{ width: '100%', boxSizing: 'border-box', background: CARD, border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '10px 14px', color: TEXT, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, outline: 'none' }}
            />
          </div>

          {/* Checkbox */}
          <div
            onClick={function() { setChecked(function(v) { return !v; }); setError(''); }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '12px 14px', background: checked ? 'rgba(201,168,76,.08)' : CARD, border: '1px solid ' + (checked ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.15)'), borderRadius: 10, transition: 'background .15s' }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (checked ? GOLD : MUTED), background: checked ? GOLD : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, transition: 'background .15s' }}>
              {checked && <span style={{ fontSize: 13, color: '#0E0C09', fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, color: TEXT, lineHeight: 1.4 }}>
              I confirm that I am <strong style={{ color: GOLD }}>{minAge} years of age or older</strong> and agree to SeeWhy LIVE's Terms of Service and Community Guidelines.
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: '#FF6B81', letterSpacing: .5, textAlign: 'center' }}>⚠ {error}</div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!checked}
            style={{ width: '100%', padding: '14px', background: checked ? 'linear-gradient(135deg,#800020,#C01838)' : 'rgba(26,21,16,.5)', border: '1px solid ' + (checked ? '#C01838' : 'rgba(201,168,76,.15)'), borderRadius: 10, color: checked ? GOLD : MUTED, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 3, cursor: checked ? 'pointer' : 'default', transition: 'background .2s' }}>
            ENTER SEEWHY LIVE
          </button>

          <div style={{ textAlign: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: MUTED, lineHeight: 1.6 }}>
            By continuing you certify that your age declaration is accurate.<br />
            Misrepresentation of age is a violation of our Terms of Service.
          </div>
        </div>
      </div>
    </div>
  );
}
