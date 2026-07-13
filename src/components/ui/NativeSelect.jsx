import React from 'react';

const GOLD = '#D4AF37';
const CRIMSON = '#800020';

export default function NativeSelect({ value, onChange, options = [], placeholder, style, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={Object.assign({
        appearance: 'none',
        WebkitAppearance: 'none',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${CRIMSON}66`,
        borderRadius: 8,
        color: '#F5E6D3',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        padding: '10px 32px 10px 12px',
        minHeight: 44,
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(GOLD)}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
      }, style || {})}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(function(opt) {
        var val = typeof opt === 'object' ? opt.value : opt;
        var label = typeof opt === 'object' ? opt.label : opt;
        return (
          <option key={val} value={val} style={{ background: '#1a0f0f', color: '#F5E6D3' }}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
