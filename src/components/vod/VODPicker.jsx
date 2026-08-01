import React from 'react';

export default function VODPicker({ vods = [], selected, onSelect, placeholder = 'Select a recording…' }) {
  return (
    <select
      value={selected?.id || ''}
      onChange={e => {
        const vod = vods.find(v => v.id === e.target.value) || null;
        onSelect(vod);
      }}
      style={{
        width: '100%',
        background: '#0D0D1A',
        color: '#E0E0E0',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 14,
        fontFamily: 'Barlow Condensed, sans-serif',
      }}
    >
      <option value="">{placeholder}</option>
      {vods.map(v => (
        <option key={v.id} value={v.id}>
          {v.title || v.filename || v.id}
        </option>
      ))}
    </select>
  );
}
