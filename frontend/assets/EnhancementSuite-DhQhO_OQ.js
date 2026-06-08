import{c1 as t,bZ as e}from"./index-48XyxRPY.js";const a={bg:"#0D0508",bgCard:"#120A0F",bgPanel:"#1A0E16",gold:"#C9A84C",goldDim:"#7A6230",cyan:"#00D4FF",cyanDim:"#00607A",text:"#F0E6D3",textMid:"#9A8470",textDim:"#4A3830",border:"#2A1A20",live:"#FF3B3B"},q=String.raw,y={"🔥 Hype":["🔥","🚀","💯","⚡","🎯","🏆","💎","👑","🌟","✨","💥","🎆","🎇","🎊","🎉"],"❤️ React":["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💖","💗","💓","💞","💝","❣️"],"😂 Vibes":["😂","🤣","😭","😍","🥰","😎","🤯","🥴","😤","🤩","🫶","👏","🙌","🤙","✌️"],"🎵 Music":["🎵","🎶","🎸","🎹","🎺","🥁","🎻","🎤","🎧","📻","🎼","🎷","🪗","🪘","🎙️"],"💰 Money":["💰","💵","💸","🤑","💳","💹","📈","🏦","💲","🪙","💴","💶","💷","🎰","💱"],"🌊 SeeWhy":["👁️","🌊","📡","🎬","📺","🎮","🕹️","🖥️","📱","💻","🛸","🌐","📡","🔴","⬛"]},X=["🔥","💯","❤️","😂","🚀","👑","💎","🎉"],J=[{id:"vod-001",title:"Late Night Lo-Fi Beats & Chill Session",creator:"DJ SwanyThree",creatorAvatar:"🎧",duration:"3:24:17",views:"12.4K",date:"2 days ago",thumbnail_color:"#1a0a20",chapters:[{time:"0:00",label:"Intro & Setup"},{time:"12:30",label:"Lo-Fi Set Begins"},{time:"1:04:15",label:"Q&A Break"},{time:"1:45:00",label:"Deep House Mix"},{time:"2:30:00",label:"Subscriber Shoutouts"},{time:"3:10:00",label:"Outro"}],tags:["Music","Lo-Fi","Chill"],highlights:3},{id:"vod-002",title:"DOMINO! ARENA Championship Finals 🏆",creator:"Domino King",creatorAvatar:"🎲",duration:"1:48:33",views:"8.7K",date:"4 days ago",thumbnail_color:"#200a0a",chapters:[{time:"0:00",label:"Tournament Bracket Reveal"},{time:"15:00",label:"Quarterfinals Begin"},{time:"42:00",label:"Semifinals"},{time:"1:10:00",label:"Championship Match"},{time:"1:40:00",label:"Trophy Ceremony"}],tags:["Gaming","Dominoes","Tournament"],highlights:7},{id:"vod-003",title:"AI Music Production Masterclass",creator:"SwanyBot Studio",creatorAvatar:"🤖",duration:"2:11:05",views:"5.2K",date:"1 week ago",thumbnail_color:"#0a1520",chapters:[{time:"0:00",label:"Intro to AI Music Tools"},{time:"20:00",label:"Suno Generation Demo"},{time:"55:00",label:"Mixing & Mastering with AI"},{time:"1:30:00",label:"Distribution Strategy"}],tags:["Music","AI","Tutorial"],highlights:4}],Q=[{id:"twitter",name:"X / Twitter",icon:"𝕏",color:"#1a1a1a",textColor:"#fff"},{id:"facebook",name:"Facebook",icon:"f",color:"#1877F2",textColor:"#fff"},{id:"instagram",name:"Instagram",icon:"◈",color:"#E1306C",textColor:"#fff"},{id:"tiktok",name:"TikTok",icon:"♪",color:"#010101",textColor:"#fff"},{id:"whatsapp",name:"WhatsApp",icon:"✉",color:"#25D366",textColor:"#fff"},{id:"telegram",name:"Telegram",icon:"✈",color:"#0088CC",textColor:"#fff"},{id:"discord",name:"Discord",icon:"◈",color:"#5865F2",textColor:"#fff"},{id:"copy",name:"Copy Link",icon:"⧉",color:a.bgPanel,textColor:a.gold}],Z=q`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Mono:wght@300;400;500&display=swap');

  .seewhy-app * { box-sizing: border-box; }

  .seewhy-app {
    background: ${a.bg};
    color: ${a.text};
    font-family: 'Cormorant Garamond', Georgia, serif;
    min-height: 100vh;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px 60px;
  }

  .sw-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 0 32px;
    border-bottom: 1px solid ${a.border};
    margin-bottom: 36px;
  }
  .sw-logo {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 1.6rem;
    color: ${a.gold};
    letter-spacing: -0.02em;
  }
  .sw-logo span { color: ${a.cyan}; }
  .sw-badge {
    background: ${a.live};
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 2px;
    margin-left: 10px;
    letter-spacing: 0.1em;
    vertical-align: middle;
  }
  .sw-header-meta {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    color: ${a.textMid};
    letter-spacing: 0.05em;
  }

  .sw-nav {
    display: flex;
    gap: 4px;
    margin-bottom: 40px;
    border-bottom: 1px solid ${a.border};
  }
  .sw-tab {
    padding: 10px 20px;
    background: none;
    border: none;
    color: ${a.textMid};
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .sw-tab:hover { color: ${a.text}; }
  .sw-tab.active { color: ${a.gold}; border-bottom-color: ${a.gold}; }
  .sw-tab-icon { margin-right: 6px; }

  .sw-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: ${a.text};
    margin-bottom: 8px;
  }
  .sw-section-sub {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 1.05rem;
    color: ${a.textMid};
    margin-bottom: 32px;
  }

  /* CHAT */
  .emoji-demo {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 24px;
    align-items: start;
  }
  .chat-window {
    background: ${a.bgCard};
    border: 1px solid ${a.border};
    border-radius: 12px;
    overflow: hidden;
    height: 520px;
    display: flex;
    flex-direction: column;
  }
  .chat-header {
    padding: 14px 18px;
    border-bottom: 1px solid ${a.border};
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${a.bgPanel};
  }
  .chat-live-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: ${a.live};
    box-shadow: 0 0 8px ${a.live};
    animation: swPulse 1.5s infinite;
  }
  @keyframes swPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .chat-title {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: ${a.textMid};
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .chat-count { margin-left: auto; font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${a.cyan}; }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: ${a.border} transparent;
  }
  .chat-msg { display: flex; gap: 10px; align-items: flex-start; animation: swMsgIn 0.3s ease; }
  @keyframes swMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .chat-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
    border: 1px solid ${a.border};
  }
  .chat-msg-name { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.gold}; margin-bottom: 3px; }
  .chat-msg-name.mod { color: ${a.cyan}; }
  .chat-msg-name.sub { color: #A855F7; }
  .chat-msg-text { font-family: 'Cormorant Garamond', serif; font-size: 0.92rem; color: ${a.text}; line-height: 1.4; }

  .quick-reactions {
    display: flex;
    gap: 6px;
    padding: 10px 16px;
    border-top: 1px solid ${a.border};
    border-bottom: 1px solid ${a.border};
    background: ${a.bgPanel};
    overflow-x: auto;
    scrollbar-width: none;
  }
  .quick-reaction-btn {
    background: none;
    border: 1px solid ${a.border};
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .quick-reaction-btn:hover { border-color: ${a.gold}; background: ${a.bgCard}; transform: scale(1.15); }
  .quick-reaction-btn.burst { animation: swEmojiPop 0.4s ease; }
  @keyframes swEmojiPop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }

  .chat-input-row { padding: 12px 16px; display: flex; gap: 8px; align-items: center; }
  .chat-input {
    flex: 1;
    background: ${a.bgPanel};
    border: 1px solid ${a.border};
    border-radius: 8px;
    padding: 8px 14px;
    color: ${a.text};
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: ${a.gold}; }
  .chat-input::placeholder { color: ${a.textDim}; }
  .emoji-trigger-btn, .send-btn {
    background: none;
    border: 1px solid ${a.border};
    border-radius: 8px;
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.15s;
    color: ${a.textMid};
  }
  .emoji-trigger-btn:hover { border-color: ${a.gold}; color: ${a.gold}; }
  .send-btn { background: ${a.gold}; border-color: ${a.gold}; color: ${a.bg}; font-size: 0.9rem; }
  .send-btn:hover { background: #D4B460; }

  /* EMOJI PICKER */
  .emoji-picker {
    background: ${a.bgCard};
    border: 1px solid ${a.border};
    border-radius: 12px;
    overflow: hidden;
    height: 520px;
    display: flex;
    flex-direction: column;
  }
  .emoji-picker-header { padding: 14px 16px; border-bottom: 1px solid ${a.border}; background: ${a.bgPanel}; }
  .emoji-picker-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: ${a.gold}; margin-bottom: 10px; }
  .emoji-search {
    width: 100%;
    background: ${a.bg};
    border: 1px solid ${a.border};
    border-radius: 6px;
    padding: 6px 12px;
    color: ${a.text};
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    outline: none;
  }
  .emoji-search:focus { border-color: ${a.cyan}; }
  .emoji-cats {
    display: flex;
    gap: 4px;
    padding: 10px 16px;
    border-bottom: 1px solid ${a.border};
    overflow-x: auto;
    scrollbar-width: none;
  }
  .emoji-cat-btn {
    background: none;
    border: 1px solid ${a.border};
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.75rem;
    cursor: pointer;
    white-space: nowrap;
    color: ${a.textMid};
    font-family: 'DM Mono', monospace;
    transition: all 0.15s;
  }
  .emoji-cat-btn.active, .emoji-cat-btn:hover { border-color: ${a.gold}; color: ${a.gold}; background: ${a.bgPanel}; }
  .emoji-grid {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    align-content: start;
    scrollbar-width: thin;
    scrollbar-color: ${a.border} transparent;
  }
  .emoji-btn { background: none; border: none; border-radius: 8px; padding: 8px; font-size: 1.3rem; cursor: pointer; transition: all 0.12s; line-height: 1; }
  .emoji-btn:hover { background: ${a.bgPanel}; transform: scale(1.2); }
  .emoji-picker-footer { padding: 10px 16px; border-top: 1px solid ${a.border}; display: flex; align-items: center; gap: 8px; }
  .emoji-preview { font-size: 1.6rem; }
  .emoji-preview-name { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${a.textMid}; }

  .reaction-float {
    position: fixed;
    pointer-events: none;
    font-size: 1.6rem;
    animation: swFloatUp 2s ease-out forwards;
    z-index: 9999;
  }
  @keyframes swFloatUp {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
  }

  /* VOD */
  .vod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; margin-bottom: 40px; }
  .vod-card {
    background: ${a.bgCard};
    border: 1px solid ${a.border};
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.25s;
  }
  .vod-card:hover { border-color: ${a.gold}; transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
  .vod-thumb { position: relative; height: 170px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
  .vod-thumb-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, ${a.bgCard}); }
  .vod-play-btn {
    position: absolute;
    width: 52px; height: 52px;
    background: rgba(0,0,0,0.7);
    border: 2px solid ${a.gold};
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: ${a.gold};
    font-size: 1.2rem;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
  }
  .vod-card:hover .vod-play-btn { background: ${a.gold}; color: ${a.bg}; transform: scale(1.1); }
  .vod-duration { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.85); color: ${a.text}; font-family: 'DM Mono', monospace; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; }
  .vod-highlights { position: absolute; top: 10px; left: 10px; background: ${a.live}; color: #fff; font-family: 'DM Mono', monospace; font-size: 0.62rem; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.05em; }
  .vod-info { padding: 16px; }
  .vod-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: ${a.text}; margin-bottom: 8px; line-height: 1.3; }
  .vod-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .vod-creator-name { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${a.gold}; }
  .vod-stats { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.textMid}; margin-left: auto; }
  .vod-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .vod-tag { background: ${a.bgPanel}; border: 1px solid ${a.border}; border-radius: 4px; padding: 2px 8px; font-family: 'DM Mono', monospace; font-size: 0.62rem; color: ${a.textMid}; text-transform: uppercase; letter-spacing: 0.06em; }

  /* VOD Modal */
  .vod-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(8px); animation: swFadeIn 0.2s ease; }
  @keyframes swFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .vod-player-container { background: ${a.bgCard}; border: 1px solid ${a.border}; border-radius: 16px; width: 100%; max-width: 900px; overflow: hidden; animation: swSlideUp 0.25s ease; }
  @keyframes swSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .vod-player-screen { height: 380px; display: flex; align-items: center; justify-content: center; position: relative; }
  .vod-player-ui { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 20px; background: linear-gradient(to top, rgba(0,0,0,0.95), transparent); }
  .vod-progress-bar { width: 100%; height: 4px; background: ${a.border}; border-radius: 2px; margin-bottom: 12px; cursor: pointer; }
  .vod-progress-fill { height: 100%; background: linear-gradient(90deg, ${a.gold}, ${a.cyan}); border-radius: 2px; transition: width 0.1s; }
  .vod-controls { display: flex; align-items: center; gap: 12px; }
  .vod-ctrl-btn { background: none; border: none; color: ${a.text}; font-size: 1.2rem; cursor: pointer; padding: 4px; transition: color 0.15s; }
  .vod-ctrl-btn:hover { color: ${a.gold}; }
  .vod-time { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: ${a.textMid}; margin-left: auto; }
  .vod-player-info { padding: 16px 20px; }
  .vod-player-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: ${a.text}; margin-bottom: 10px; }
  .vod-close-btn { position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.7); border: 1px solid ${a.border}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: ${a.textMid}; cursor: pointer; font-size: 1rem; transition: all 0.15s; z-index: 10; }
  .vod-close-btn:hover { border-color: ${a.gold}; color: ${a.gold}; }
  .vod-chapters { border-top: 1px solid ${a.border}; max-height: 200px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: ${a.border} transparent; }
  .chapters-label { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.textMid}; text-transform: uppercase; letter-spacing: 0.1em; padding: 10px 20px 6px; }
  .chapter-item { display: flex; align-items: center; gap: 12px; padding: 8px 20px; cursor: pointer; transition: background 0.15s; }
  .chapter-item:hover, .chapter-item.active { background: ${a.bgPanel}; }
  .chapter-time { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${a.cyan}; min-width: 50px; }
  .chapter-name { font-family: 'Cormorant Garamond', serif; font-size: 0.9rem; color: ${a.text}; }
  .chapter-dot { width: 6px; height: 6px; border-radius: 50%; background: ${a.border}; flex-shrink: 0; }
  .chapter-item.active .chapter-dot { background: ${a.gold}; }

  /* SHARE */
  .share-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .share-card { background: ${a.bgCard}; border: 1px solid ${a.border}; border-radius: 12px; overflow: hidden; }
  .share-card-header { padding: 16px 20px; border-bottom: 1px solid ${a.border}; background: ${a.bgPanel}; }
  .share-card-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: ${a.gold}; margin-bottom: 4px; }
  .share-card-sub { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.textMid}; text-transform: uppercase; letter-spacing: 0.06em; }
  .share-card-body { padding: 20px; }
  .stream-og-card { background: ${a.bgPanel}; border: 1px solid ${a.border}; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
  .stream-og-thumb { height: 120px; background: linear-gradient(135deg, #1a0a20, #0a1020); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; position: relative; }
  .stream-og-live-badge { position: absolute; top: 10px; left: 10px; background: ${a.live}; color: #fff; font-family: 'DM Mono', monospace; font-size: 0.6rem; padding: 2px 8px; border-radius: 3px; letter-spacing: 0.1em; display: flex; align-items: center; gap: 4px; }
  .stream-og-body { padding: 12px; }
  .stream-og-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; color: ${a.text}; margin-bottom: 4px; }
  .stream-og-meta { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.textMid}; }
  .stream-og-url { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: ${a.cyan}; opacity: 0.7; }
  .share-platforms { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .share-platform-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; border: 1px solid ${a.border}; border-radius: 10px; cursor: pointer; background: none; transition: all 0.2s; }
  .share-platform-btn:hover { transform: translateY(-2px); border-color: ${a.gold}; }
  .share-platform-btn.shared { border-color: #22C55E; background: rgba(34,197,94,0.05); }
  .share-platform-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; }
  .share-platform-name { font-family: 'DM Mono', monospace; font-size: 0.58rem; color: ${a.textMid}; text-align: center; text-transform: uppercase; letter-spacing: 0.04em; }
  .share-platform-btn.shared .share-platform-name { color: #22C55E; }
  .share-message-area { width: 100%; background: ${a.bg}; border: 1px solid ${a.border}; border-radius: 8px; padding: 10px 14px; color: ${a.text}; font-family: 'Cormorant Garamond', serif; font-size: 0.92rem; resize: none; outline: none; margin-bottom: 12px; min-height: 70px; line-height: 1.5; }
  .share-message-area:focus { border-color: ${a.gold}; }
  .copy-link-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .copy-link-input { flex: 1; background: ${a.bg}; border: 1px solid ${a.border}; border-radius: 6px; padding: 8px 12px; color: ${a.cyan}; font-family: 'DM Mono', monospace; font-size: 0.7rem; outline: none; }
  .copy-link-btn { background: ${a.gold}; border: none; border-radius: 6px; padding: 8px 16px; color: ${a.bg}; font-family: 'DM Mono', monospace; font-size: 0.7rem; font-weight: 500; cursor: pointer; transition: all 0.15s; letter-spacing: 0.05em; }
  .copy-link-btn:hover { background: #D4B460; }
  .copy-link-btn.copied { background: #22C55E; color: #fff; }
  .referral-card { background: linear-gradient(135deg, ${a.bgPanel}, ${a.bg}); border: 1px solid ${a.goldDim}; border-radius: 10px; padding: 16px; }
  .referral-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; color: ${a.gold}; margin-bottom: 6px; }
  .referral-desc { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.85rem; color: ${a.textMid}; margin-bottom: 12px; }
  .referral-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .referral-stat { text-align: center; padding: 10px; background: ${a.bg}; border-radius: 8px; border: 1px solid ${a.border}; }
  .referral-stat-val { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: ${a.gold}; display: block; }
  .referral-stat-label { font-family: 'DM Mono', monospace; font-size: 0.6rem; color: ${a.textMid}; text-transform: uppercase; letter-spacing: 0.06em; }
  .share-analytics-title { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.textMid}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
  .share-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .share-bar-label { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.textMid}; min-width: 70px; }
  .share-bar-track { flex: 1; height: 6px; background: ${a.border}; border-radius: 3px; overflow: hidden; }
  .share-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
  .share-bar-count { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${a.textMid}; min-width: 30px; text-align: right; }

  /* UTILITIES */
  .sw-btn { background: ${a.gold}; border: none; border-radius: 8px; padding: 10px 20px; color: ${a.bg}; font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; letter-spacing: 0.06em; text-transform: uppercase; }
  .sw-btn:hover { background: #D4B460; transform: translateY(-1px); }
  .sw-btn-outline { background: none; border: 1px solid ${a.gold}; color: ${a.gold}; }
  .sw-btn-outline:hover { background: rgba(201,168,76,0.1); }
  .feature-badge { display: inline-flex; align-items: center; gap: 6px; background: ${a.bgPanel}; border: 1px solid ${a.border}; border-radius: 20px; padding: 4px 12px; font-family: 'DM Mono', monospace; font-size: 0.65rem; color: ${a.textMid}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
  .feature-badge .dot { width: 5px; height: 5px; border-radius: 50%; background: ${a.cyan}; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; }
  .info-card { background: ${a.bgCard}; border: 1px solid ${a.border}; border-radius: 10px; padding: 20px; }
  .info-card-icon { font-size: 1.6rem; margin-bottom: 10px; }
  .info-card-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; color: ${a.text}; margin-bottom: 6px; }
  .info-card-desc { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.85rem; color: ${a.textMid}; line-height: 1.5; }

  @media (max-width: 768px) {
    .emoji-demo { grid-template-columns: 1fr; }
    .share-demo { grid-template-columns: 1fr; }
    .info-grid { grid-template-columns: 1fr; }
    .vod-grid { grid-template-columns: 1fr; }
  }
`,ee=[{id:1,user:"SwanyKing99",role:"mod",avatar:"👑",text:"Stream is live! 🔥🔥🔥",time:"21:04"},{id:2,user:"viewer_zara",role:"sub",avatar:"💜",text:"Finally here! Been waiting all day 😍",time:"21:04"},{id:3,user:"DominoFan23",role:"viewer",avatar:"🎲",text:"Let's gooooo 🚀💯",time:"21:05"},{id:4,user:"SwanyKing99",role:"mod",avatar:"👑",text:"Welcome everyone dropping in! ❤️🎉",time:"21:05"},{id:5,user:"MusicHead_Tony",role:"viewer",avatar:"🎵",text:"This beat is 🔥🔥 what's the track?",time:"21:06"},{id:6,user:"viewer_zara",role:"sub",avatar:"💜",text:"New sub here — loving the vibes! 💎👑",time:"21:06"}],ae=[{label:"Twitter/X",count:284,pct:92,color:a.cyan},{label:"Discord",count:197,pct:64,color:"#5865F2"},{label:"WhatsApp",count:143,pct:46,color:"#25D366"},{label:"TikTok",count:98,pct:32,color:"#FF0050"},{label:"Instagram",count:76,pct:25,color:"#E1306C"},{label:"Facebook",count:52,pct:17,color:"#1877F2"}];function oe(){const[d,P]=t.useState("emoji"),[j,N]=t.useState(ee),[c,p]=t.useState(""),[w,I]=t.useState("🔥 Hype"),[$,x]=t.useState(null),[R,k]=t.useState([]),[L,M]=t.useState(null),[m,C]=t.useState(""),[i,h]=t.useState(null),[g,f]=t.useState(!1),[F,s]=t.useState(22),[O,B]=t.useState(1),[S,D]=t.useState({}),[z,A]=t.useState(!1),[V,G]=t.useState("🔴 LIVE NOW on SeeWhy LIVE — join the stream! 🎵🔥"),E=t.useRef(null),b=t.useRef(null),u=t.useRef(null);t.useEffect(()=>{const r=document.createElement("style");return r.textContent=Z,document.head.appendChild(r),u.current=r,()=>{u.current&&document.head.removeChild(u.current)}},[]),t.useEffect(()=>{var r;(r=E.current)==null||r.scrollIntoView({behavior:"smooth"})},[j]),t.useEffect(()=>(g?b.current=setInterval(()=>{s(r=>r>=100?(f(!1),100):r+.3)},100):clearInterval(b.current),()=>clearInterval(b.current)),[g]);const T=t.useCallback(()=>{c.trim()&&(N(r=>[...r,{id:Date.now(),user:"You",role:"sub",avatar:"😎",text:c,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}]),p(""))},[c]),_=r=>{p(o=>o+r),x(r)},Y=(r,o)=>{M(r),setTimeout(()=>M(null),400);const n=o.currentTarget.getBoundingClientRect(),v=Date.now();k(l=>[...l,{id:v,emoji:r,x:n.left+n.width/2,y:n.top}]),setTimeout(()=>k(l=>l.filter(W=>W.id!==v)),2e3),N(l=>[...l,{id:v,user:"You",role:"sub",avatar:"😎",text:`${r} ${r} ${r}`,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}])},H=r=>{D(o=>({...o,[r]:!0})),setTimeout(()=>D(o=>{const n={...o};return delete n[r],n}),3e3)},K=()=>{A(!0),setTimeout(()=>A(!1),2500)},U=m?Object.values(y).flat().filter(r=>r.includes(m)):y[w]||[];return e.jsxs("div",{className:"seewhy-app",children:[R.map(r=>e.jsx("div",{className:"reaction-float",style:{left:r.x,top:r.y},children:r.emoji},r.id)),i&&e.jsx("div",{className:"vod-modal-backdrop",onClick:r=>r.target===r.currentTarget&&h(null),children:e.jsxs("div",{className:"vod-player-container",children:[e.jsxs("div",{className:"vod-player-screen",style:{background:i.thumbnail_color},children:[e.jsx("div",{style:{fontSize:"4rem"},children:i.creatorAvatar}),e.jsx("button",{className:"vod-close-btn",onClick:()=>h(null),children:"✕"}),e.jsxs("div",{className:"vod-player-ui",children:[e.jsx("div",{className:"vod-progress-bar",onClick:r=>{const o=r.currentTarget.getBoundingClientRect();s((r.clientX-o.left)/o.width*100)},children:e.jsx("div",{className:"vod-progress-fill",style:{width:`${F}%`}})}),e.jsxs("div",{className:"vod-controls",children:[e.jsx("button",{className:"vod-ctrl-btn",onClick:()=>s(r=>Math.max(0,r-5)),children:"⏮"}),e.jsx("button",{className:"vod-ctrl-btn",onClick:()=>f(r=>!r),children:g?"⏸":"▶"}),e.jsx("button",{className:"vod-ctrl-btn",onClick:()=>s(r=>Math.min(100,r+5)),children:"⏭"}),e.jsx("span",{className:"vod-time",children:i.duration})]})]})]}),e.jsxs("div",{className:"vod-player-info",children:[e.jsx("div",{className:"vod-player-title",children:i.title}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[e.jsx("span",{style:{fontSize:"1rem"},children:i.creatorAvatar}),e.jsx("span",{style:{fontFamily:"'DM Mono'",fontSize:"0.72rem",color:a.gold},children:i.creator}),e.jsxs("span",{style:{fontFamily:"'DM Mono'",fontSize:"0.68rem",color:a.textMid,marginLeft:"auto"},children:[i.views," views · ",i.date]})]})]}),e.jsxs("div",{className:"vod-chapters",children:[e.jsx("div",{className:"chapters-label",children:"Chapters"}),i.chapters.map((r,o)=>e.jsxs("div",{className:`chapter-item${O===o?" active":""}`,onClick:()=>{B(o),s(o/i.chapters.length*100)},children:[e.jsx("div",{className:"chapter-dot"}),e.jsx("span",{className:"chapter-time",children:r.time}),e.jsx("span",{className:"chapter-name",children:r.label})]},o))]})]})}),e.jsxs("div",{className:"sw-header",children:[e.jsx("div",{children:e.jsxs("div",{className:"sw-logo",children:["See",e.jsx("span",{children:"Why"})," LIVE ",e.jsx("span",{className:"sw-badge",children:"BETA"})]})}),e.jsx("div",{className:"sw-header-meta",children:"SwanyThree EntTech · Enhancement Suite v1.0"})]}),e.jsx("div",{className:"sw-nav",children:[{id:"emoji",icon:"😊",label:"Stream Chat Emojis"},{id:"vod",icon:"📹",label:"Stream Replay VODs"},{id:"share",icon:"📡",label:"Social Sharing"}].map(r=>e.jsxs("button",{className:`sw-tab${d===r.id?" active":""}`,onClick:()=>P(r.id),children:[e.jsx("span",{className:"sw-tab-icon",children:r.icon}),r.label]},r.id))}),d==="emoji"&&e.jsxs("div",{children:[e.jsxs("div",{className:"feature-badge",children:[e.jsx("div",{className:"dot"})," New Feature"]}),e.jsx("div",{className:"sw-section-title",children:"Stream Chat Emoji System"}),e.jsx("div",{className:"sw-section-sub",children:"Real-time emoji picker with categories, search, quick reactions, and floating burst animations"}),e.jsxs("div",{className:"emoji-demo",children:[e.jsxs("div",{className:"chat-window",children:[e.jsxs("div",{className:"chat-header",children:[e.jsx("div",{className:"chat-live-dot"}),e.jsx("span",{className:"chat-title",children:"Live Chat"}),e.jsx("span",{className:"chat-count",children:"1,247 watching"})]}),e.jsxs("div",{className:"chat-messages",children:[j.map(r=>e.jsxs("div",{className:"chat-msg",children:[e.jsx("div",{className:"chat-avatar",style:{background:r.role==="mod"?a.cyanDim:r.role==="sub"?"#2A1040":a.bgPanel},children:r.avatar}),e.jsxs("div",{children:[e.jsxs("div",{className:`chat-msg-name${r.role!=="viewer"?" "+r.role:""}`,children:[r.role==="mod"&&"🛡️ ",r.role==="sub"&&"⭐ ",r.user,e.jsx("span",{style:{color:a.textDim,marginLeft:6,fontFamily:"'DM Mono'",fontSize:"0.62rem"},children:r.time})]}),e.jsx("div",{className:"chat-msg-text",children:r.text})]})]},r.id)),e.jsx("div",{ref:E})]}),e.jsx("div",{className:"quick-reactions",children:X.map(r=>e.jsx("button",{className:`quick-reaction-btn${L===r?" burst":""}`,onClick:o=>Y(r,o),children:r},r))}),e.jsxs("div",{className:"chat-input-row",children:[e.jsx("input",{className:"chat-input",placeholder:"Say something amazing...",value:c,onChange:r=>p(r.target.value),onKeyDown:r=>r.key==="Enter"&&T()}),e.jsx("button",{className:"emoji-trigger-btn",children:"😊"}),e.jsx("button",{className:"send-btn",onClick:T,children:"→"})]})]}),e.jsxs("div",{className:"emoji-picker",children:[e.jsxs("div",{className:"emoji-picker-header",children:[e.jsx("div",{className:"emoji-picker-title",children:"Emoji Library"}),e.jsx("input",{className:"emoji-search",placeholder:"Search emojis...",value:m,onChange:r=>C(r.target.value)})]}),e.jsx("div",{className:"emoji-cats",children:Object.keys(y).map(r=>e.jsx("button",{className:`emoji-cat-btn${w===r&&!m?" active":""}`,onClick:()=>{I(r),C("")},children:r},r))}),e.jsx("div",{className:"emoji-grid",children:U.map((r,o)=>e.jsx("button",{className:"emoji-btn",onMouseEnter:()=>x(r),onMouseLeave:()=>x(null),onClick:()=>_(r),children:r},o))}),e.jsxs("div",{className:"emoji-picker-footer",children:[e.jsx("span",{className:"emoji-preview",children:$||"☁️"}),e.jsx("div",{children:e.jsx("div",{className:"emoji-preview-name",children:$?"Click to add to message":"Hover an emoji to preview"})})]})]})]}),e.jsxs("div",{className:"info-grid",children:[e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"⚡"}),e.jsx("div",{className:"info-card-title",children:"Quick Reaction Burst"}),e.jsx("div",{className:"info-card-desc",children:"One-tap emoji reactions with floating animation. Automatically broadcasts to chat for maximum engagement."})]}),e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"🔐"}),e.jsx("div",{className:"info-card-title",children:"AES-256 Chat Encryption"}),e.jsx("div",{className:"info-card-desc",children:"All chat messages pass through SwanyThree Vault Pro before Socket.IO broadcast — zero plaintext in transit."})]}),e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"🤖"}),e.jsx("div",{className:"info-card-title",children:"Guardian AI Filtering"}),e.jsx("div",{className:"info-card-desc",children:"Claude + toxic-bert ONNX ensemble (60/40) auto-moderates emoji spam and flags inappropriate reaction patterns."})]})]})]}),d==="vod"&&e.jsxs("div",{children:[e.jsxs("div",{className:"feature-badge",children:[e.jsx("div",{className:"dot"})," New Feature"]}),e.jsx("div",{className:"sw-section-title",children:"Stream Replay VODs"}),e.jsx("div",{className:"sw-section-sub",children:"Automatic recording, chapter indexing, and on-demand playback for every live session"}),e.jsxs("div",{style:{display:"flex",gap:16,marginBottom:28,flexWrap:"wrap"},children:[["All Replays","Music","Gaming","Tutorials","Highlights"].map(r=>e.jsx("button",{className:"sw-btn sw-btn-outline",style:{padding:"6px 16px",fontSize:"0.7rem"},children:r},r)),e.jsx("button",{className:"sw-btn",style:{marginLeft:"auto",padding:"6px 16px",fontSize:"0.7rem"},children:"+ Upload VOD"})]}),e.jsx("div",{className:"vod-grid",children:J.map(r=>e.jsxs("div",{className:"vod-card",onClick:()=>{h(r),s(0),f(!1)},children:[e.jsxs("div",{className:"vod-thumb",style:{background:`linear-gradient(135deg, ${r.thumbnail_color}, #0D0508)`},children:[e.jsx("span",{style:{fontSize:"2.5rem"},children:r.creatorAvatar}),e.jsx("div",{className:"vod-thumb-overlay"}),e.jsx("div",{className:"vod-play-btn",children:"▶"}),e.jsx("div",{className:"vod-duration",children:r.duration}),e.jsxs("div",{className:"vod-highlights",children:["⚡ ",r.highlights," Highlights"]})]}),e.jsxs("div",{className:"vod-info",children:[e.jsx("div",{className:"vod-title",children:r.title}),e.jsxs("div",{className:"vod-meta",children:[e.jsx("span",{children:r.creatorAvatar}),e.jsx("span",{className:"vod-creator-name",children:r.creator}),e.jsxs("span",{className:"vod-stats",children:[r.views," views · ",r.date]})]}),e.jsxs("div",{className:"vod-tags",children:[r.tags.map(o=>e.jsx("span",{className:"vod-tag",children:o},o)),e.jsxs("span",{className:"vod-tag",style:{marginLeft:"auto"},children:["📖 ",r.chapters.length," chapters"]})]})]})]},r.id))}),e.jsxs("div",{className:"info-grid",children:[e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"📡"}),e.jsx("div",{className:"info-card-title",children:"Auto-Record via MediaMTX"}),e.jsx("div",{className:"info-card-desc",children:"Every stream is captured by the MediaMTX RTMP server and stored in Hostinger VPS storage — zero manual effort."})]}),e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"📖"}),e.jsx("div",{className:"info-card-title",children:"AI Chapter Indexing"}),e.jsx("div",{className:"info-card-desc",children:"Aura AI co-host (Llama 3.3 70B) analyzes stream content to auto-generate chapter markers and scene labels."})]}),e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"💰"}),e.jsx("div",{className:"info-card-title",children:"Creator Revenue — 90/10"}),e.jsx("div",{className:"info-card-desc",children:"VOD tip jars and PPV replays follow the locked 90/10 split. Creator keeps 90%, always. No exceptions."})]})]})]}),d==="share"&&e.jsxs("div",{children:[e.jsxs("div",{className:"feature-badge",children:[e.jsx("div",{className:"dot"})," New Feature"]}),e.jsx("div",{className:"sw-section-title",children:"Social Sharing Integration"}),e.jsx("div",{className:"sw-section-sub",children:"One-click stream sharing, referral tracking, and viral growth tools built into every stream"}),e.jsxs("div",{className:"share-demo",children:[e.jsx("div",{children:e.jsxs("div",{className:"share-card",children:[e.jsxs("div",{className:"share-card-header",children:[e.jsx("div",{className:"share-card-title",children:"Share Your Stream"}),e.jsx("div",{className:"share-card-sub",children:"Reach more viewers instantly"})]}),e.jsxs("div",{className:"share-card-body",children:[e.jsxs("div",{className:"stream-og-card",children:[e.jsxs("div",{className:"stream-og-thumb",children:["🎵",e.jsxs("div",{className:"stream-og-live-badge",children:[e.jsx("div",{style:{width:5,height:5,borderRadius:"50%",background:"#fff"}})," LIVE"]})]}),e.jsxs("div",{className:"stream-og-body",children:[e.jsx("div",{className:"stream-og-title",children:"Late Night Lo-Fi Beats — SeeWhy LIVE"}),e.jsx("div",{className:"stream-og-meta",children:"DJ SwanyThree · 1,247 watching"}),e.jsx("div",{className:"stream-og-url",children:"seewhylive.com/live/swanythree"})]})]}),e.jsx("textarea",{className:"share-message-area",value:V,onChange:r=>G(r.target.value),rows:3}),e.jsxs("div",{className:"copy-link-row",children:[e.jsx("input",{className:"copy-link-input",readOnly:!0,value:"seewhylive.com/live/swanythree?ref=DJ_SwanyThree"}),e.jsx("button",{className:`copy-link-btn${z?" copied":""}`,onClick:K,children:z?"✓ Copied!":"Copy"})]}),e.jsx("div",{className:"share-platforms",children:Q.map(r=>e.jsxs("button",{className:`share-platform-btn${S[r.id]?" shared":""}`,onClick:()=>H(r.id),children:[e.jsx("div",{className:"share-platform-icon",style:{background:r.color,color:r.textColor},children:S[r.id]?"✓":r.icon}),e.jsx("span",{className:"share-platform-name",children:r.name})]},r.id))})]})]})}),e.jsxs("div",{children:[e.jsxs("div",{className:"referral-card",style:{marginBottom:20},children:[e.jsx("div",{className:"referral-title",children:"🎯 Your Referral Program"}),e.jsx("div",{className:"referral-desc",children:"Earn bonus revenue every time someone signs up through your stream link"}),e.jsxs("div",{className:"referral-stats",children:[e.jsxs("div",{className:"referral-stat",children:[e.jsx("span",{className:"referral-stat-val",children:"247"}),e.jsx("span",{className:"referral-stat-label",children:"Referrals"})]}),e.jsxs("div",{className:"referral-stat",children:[e.jsx("span",{className:"referral-stat-val",style:{color:a.cyan},children:"$182"}),e.jsx("span",{className:"referral-stat-label",children:"Earned"})]}),e.jsxs("div",{className:"referral-stat",children:[e.jsx("span",{className:"referral-stat-val",style:{color:"#22C55E"},children:"31"}),e.jsx("span",{className:"referral-stat-label",children:"Converted"})]})]})]}),e.jsxs("div",{className:"share-card",children:[e.jsxs("div",{className:"share-card-header",children:[e.jsx("div",{className:"share-card-title",children:"Share Analytics"}),e.jsx("div",{className:"share-card-sub",children:"Last 30 days · 850 total shares"})]}),e.jsxs("div",{className:"share-card-body",children:[e.jsx("div",{className:"share-analytics-title",children:"Platform Breakdown"}),ae.map(r=>e.jsxs("div",{className:"share-bar-row",children:[e.jsx("span",{className:"share-bar-label",children:r.label}),e.jsx("div",{className:"share-bar-track",children:e.jsx("div",{className:"share-bar-fill",style:{width:`${r.pct}%`,background:r.color}})}),e.jsx("span",{className:"share-bar-count",children:r.count})]},r.label))]})]})]})]}),e.jsxs("div",{className:"info-grid",style:{marginTop:28},children:[e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"🔗"}),e.jsx("div",{className:"info-card-title",children:"Smart Referral Links"}),e.jsx("div",{className:"info-card-desc",children:"Every share auto-appends your creator ref tag. Conversions tracked in GHL CRM pipeline and n8n automation."})]}),e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"📊"}),e.jsx("div",{className:"info-card-title",children:"Real-Time Share Analytics"}),e.jsx("div",{className:"info-card-desc",children:"Track which platforms drive the most new viewers, subscriptions, and revenue — updated live via Socket.IO."})]}),e.jsxs("div",{className:"info-card",children:[e.jsx("div",{className:"info-card-icon",children:"🎁"}),e.jsx("div",{className:"info-card-title",children:"Viral Growth Rewards"}),e.jsx("div",{className:"info-card-desc",children:"Share milestones unlock DominoCoins, badge upgrades, and bonus platform visibility in the discovery feed."})]})]})]})]})}export{oe as default};
