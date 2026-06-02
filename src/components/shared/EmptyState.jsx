import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:48 }} className={className}>
      {Icon && <Icon style={{ width:64, height:64, opacity:0.3, marginBottom:16, color:'rgba(255,255,255,0.4)' }} />}
      <h3 style={{ fontSize:20, fontWeight:600, marginBottom:8 }}>{title}</h3>
      {description && (
        <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:24, maxWidth:448 }}>{description}</p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          style={{ padding:'8px 20px', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontFamily:'Barlow Condensed, sans-serif', fontSize:14 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
