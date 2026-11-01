import React from 'react';

/**
 * CornerBracket — broadcast corner bracket decoration for primary content cards.
 *
 * The corners are drawn by the .sw-bracket pseudo-elements in index.css, so the
 * wrapper is the only element needed:
 *
 *   <CornerBracket className="p-4 bg-sw-card">…</CornerBracket>
 */
export default function CornerBracket({ children, className = '', color, inset = 0 }) {
  return (
    <div
      className={`sw-bracket ${className}`}
      style={{
        '--sw-bracket-color': color || 'rgba(255,184,0,0.55)',
        '--sw-bracket-inset': `${inset}px`,
      }}
    >
      {children}
    </div>
  );
}