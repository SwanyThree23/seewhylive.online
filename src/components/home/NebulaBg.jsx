import React from 'react';

export default function NebulaBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Deep space base */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(8,11,24,0.9) 0%, transparent 70%)',
      }} />
      {/* Gold nebula top-right */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      {/* Burgundy nebula bottom-left */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(128,0,32,0.18) 0%, transparent 70%)',
        filter: 'blur(50px)',
      }} />
      {/* Cyan accent */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
    </div>
  );
}