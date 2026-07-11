import React, { useState, useEffect } from 'react';
const STEPS = ['role', 'username', 'done'];
export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    const u = localStorage.getItem('sw_username');
    const r = localStorage.getItem('sw_role');
    if (u && r) { window.location.href = '/'; }
  }, []);
  const advance = () => {
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 300);
  };
  const handleRoleSelect = (r) => {
    setRole(r);
    localStorage.setItem('sw_role', r);
    advance();
  };
  const handleUsernameSubmit = () => {
    const t = username.trim();
    if (!t || t.length < 2) { setError('At least 2 characters required.'); return; }
    if (t.length > 30) { setError('Max 30 characters.'); return; }
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(t)) { setError('Letters, numbers, _ - . only.'); return; }
    setError('');
    localStorage.setItem('sw_username', t);
    advance();
  };
  const S = {
    root:{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Courier Prime',monospace",position:'relative',overflow:'hidden'},
    card:{position:'relative',zIndex:1,width:'100%',maxWidth:480,padding:'48px 40px',background:'rgba(10,10,10,0.95)',border:'1px solid #1a1a1a',textAlign:'center'},
    logo:{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:6,marginBottom:32,lineHeight:1},
    dots:{display:'flex',justifyContent:'center',gap:8,marginBottom:40},
    dot:{width:8,height:8,borderRadius:'50%',transition:'all 0.3s'},
    wrap:{display:'flex',flexDirection:'column',alignItems:'center',gap:20},
    label:{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:4,color:'#555'},
    roleRow:{display:'flex',gap:16,width:'100%'},
    roleBtn:{flex:1,background:'transparent',border:'1px solid #2a2a2a',color:'#ccc',padding:'24px 12px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:8,transition:'all 0.2s',fontFamily:"'Courier Prime',monospace"},
    roleBtnA:{border:'1px solid #00FFB3',background:'rgba(0,255,179,0.05)',color:'#fff'},
    roleIcon:{fontSize:28},
    roleTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:3,color:'#00FFB3'},
    roleDesc:{fontSize:11,color:'#666',lineHeight:1.5,textAlign:'center'},
    input:{width:'100%',background:'transparent',border:'1px solid #00FFB3',borderRadius:0,color:'#fff',fontFamily:"'Courier Prime',monospace",fontSize:16,padding:'14px 16px',outline:'none',letterSpacing:2,textAlign:'center'},
    error:{color:'#ff4d4d',fontSize:12,letterSpacing:1},
    cta:{width:'100%',background:'#00FFB3',border:'none',color:'#000',fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:4,padding:'16px',cursor:'pointer'},
    doneIcon:{fontSize:48,color:'#00FFB3',fontFamily:'serif'},
    doneTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:42,letterSpacing:8,color:'#fff'},
    doneSub:{color:'#ccc',fontSize:14,lineHeight:2,letterSpacing:1},
  };
  const fade = {opacity:animating?0:1,transform:animating?'translateY(12px)':'translateY(0)',transition:'opacity 0.3s,transform 0.3s'};
  return (
    <div style={S.root}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime&display=swap\');'}</style>
      <div style={{...S.card,...fade}}>
        <div style={S.logo}><span style={{color:'#fff'}}>SEEWHY</span><span style={{color:'#00FFB3'}}> LIVE</span></div>
        <div style={S.dots}>{STEPS.map((_,i)=><div key={i} style={{...S.dot,background:i<=step?'#00FFB3':'#2a2a2a',boxShadow:i===step?'0 0 8px #00FFB3':'none'}}/>)}</div>
        {step===0&&<div style={S.wrap}>
          <p style={S.label}>I AM A</p>
          <div style={S.roleRow}>
            <button style={S.roleBtn} onClick={()=>handleRoleSelect('creator')}><span style={S.roleIcon}>🎥</span><span style={S.roleTitle}>CREATOR</span><span style={S.roleDesc}>Stream, broadcast,<br/>build your audience</span></button>
            <button style={S.roleBtn} onClick={()=>handleRoleSelect('viewer')}><span style={S.roleIcon}>👁️</span><span style={S.roleTitle}>VIEWER</span><span style={S.roleDesc}>Watch, tip, chat<br/>and discover</span></button>
          </div>
        </div>}
        {step===1&&<div style={S.wrap}>
          <p style={S.label}>CHOOSE YOUR NAME</p>
          <input style={S.input} type="text" placeholder="display name..." value={username} maxLength={30} autoFocus onChange={e=>{setUsername(e.target.value);setError('');}} onKeyDown={e=>e.key==='Enter'&&handleUsernameSubmit()}/>
          {error&&<p style={S.error}>{error}</p>}
          <button style={S.cta} onClick={handleUsernameSubmit}>CONTINUE →</button>
        </div>}
        {step===2&&<div style={S.wrap}>
          <div style={S.doneIcon}>✦</div>
          <p style={S.doneTitle}>YOU'RE IN</p>
          <p style={S.doneSub}>Welcome, <span style={{color:'#00FFB3'}}>{localStorage.getItem('sw_username')}</span><br/><span style={{color:'#888',fontSize:12}}>{localStorage.getItem('sw_role')==='creator'?'🎥 Creator':'👁️ Viewer'}</span></p>
          <button style={S.cta} onClick={()=>window.location.href='/'}>ENTER SEEWHY LIVE</button>
        </div>}
      </div>
    </div>
  );
}
