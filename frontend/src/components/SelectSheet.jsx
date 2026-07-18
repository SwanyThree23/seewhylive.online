import React, { useState } from 'react';
import BottomSheet from './BottomSheet.jsx';

export default function SelectSheet(props) {
  var label    = props.label;
  var value    = props.value;
  var options  = props.options;   // array of strings or { value, label }
  var onChange = props.onChange;
  var style    = props.style || {};

  var [open, setOpen] = useState(false);

  function getLabel(opt) {
    return typeof opt === 'string' ? opt : opt.label;
  }
  function getValue(opt) {
    return typeof opt === 'string' ? opt : opt.value;
  }

  var displayLabel = (function() {
    for (var i = 0; i < options.length; i++) {
      if (getValue(options[i]) === value) return getLabel(options[i]);
    }
    return value || 'Select…';
  })();

  return (
    <div>
      <button
        onClick={function() { setOpen(true); }}
        style={Object.assign({
          width: '100%',
          background: '#0E0C09',
          border: '1px solid rgba(201,168,76,.18)',
          borderRadius: 7,
          padding: '9px 32px 9px 10px',
          minHeight: 44,
          color: '#F0E8D4',
          fontFamily: "'DM Mono',monospace",
          fontSize: 9,
          textAlign: 'left',
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23C9A84C' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }, style)}
      >
        {displayLabel}
      </button>

      <BottomSheet open={open} onClose={function() { setOpen(false); }} title={label}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {options.map(function(opt) {
            var v = getValue(opt);
            var l = getLabel(opt);
            var isSelected = v === value;
            return (
              <div
                key={v}
                onClick={function() {
                  onChange(v);
                  setOpen(false);
                }}
                style={{
                  padding: '12px 14px',
                  minHeight: 44,
                  borderRadius: 8,
                  background: isSelected ? 'rgba(128,0,32,.2)' : 'rgba(36,28,18,.6)',
                  border: '1px solid ' + (isSelected ? 'rgba(128,0,32,.4)' : 'rgba(201,168,76,.08)'),
                  color: isSelected ? '#C9A84C' : '#F0E8D4',
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <span>{l}</span>
                {isSelected && <span style={{ color: '#C9A84C', fontSize: 16 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}