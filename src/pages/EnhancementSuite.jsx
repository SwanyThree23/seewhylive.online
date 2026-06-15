import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// ─── CRITERION VAULT DESIGN SYSTEM ───────────────────────────────────────────
const CV = {
  bg:       "#0D0508",
  bgCard:   "#120A0F",
  bgPanel:  "#1A0E16",
  gold:     "#C9A84C",
  goldDim:  "#7A6230",
  cyan:     "#D4854A",
  cyanDim:  "#8A5020",
  burgundy: "#800020",
  burgundyDim: "#3D0010",
  text:     "#F0E6D3",
  textMid:  "#9A8470",
  textDim:  "#4A3830",
  border:   "#2A1A20",
  live:     "#FF3B3B",
};

const css = String.raw;

const EMOJI_CATEGORIES = {
  "🔥 Hype": ["🔥","🚀","💯","⚡","🎯","🏆","💎","👑","🌟","✨","💥","🎆","🎇","🎊","🎉"],
  "❤️ React": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💖","💗","💓","💞","💝","❣️"],
  "😂 Vibes": ["😂","🤣","😭","😍","🥰","😎","🤯","🥴","😤","🤩","🫶","👏","🙌","🤙","✌️"],
  "🎵 Music": ["🎵","🎶","🎸","🎹","🎺","🥁","🎻","🎤","🎧","📻","🎼","🎷","🪗","🪘","🎙️"],
  "💰 Money": ["💰","💵","💸","🤑","💳","💹","📈","🏦","💲","🪙","💴","💶","💷","🎰","💱"],
  "🌊 SeeWhy": ["👁️","🌊","📡","🎬","📺","🎮","🕹️","🖥️","📱","💻","🛸","🌐","📡","🔴","⬛"],
};

const QUICK_REACTIONS = ["🔥","💯","❤️","😂","🚀","👑","💎","🎉"];

const SHARE_PLATFORMS = [
  { id: "twitter", name: "X / Twitter", icon: "𝕏", color: "#1a1a1a", textColor: "#fff" },
  { id: "facebook", name: "Facebook", icon: "f", color: "#1877F2", textColor: "#fff" },
  { id: "instagram", name: "Instagram", icon: "◈", color: "#E1306C", textColor: "#fff" },
  { id: "tiktok", name: "TikTok", icon: "♪", color: "#010101", textColor: "#fff" },
  { id: "whatsapp", name: "WhatsApp", icon: "✉", color: "#25D366", textColor: "#fff" },
  { id: "telegram", name: "Telegram", icon: "✈", color: "#0088CC", textColor: "#fff" },
  { id: "discord", name: "Discord", icon: "◈", color: "#D4854A", textColor: "#fff" },
  { id: "copy", name: "Copy Link", icon: "⧉", color: CV.bgPanel, textColor: CV.gold },
];

const GLOBAL_STYLES = css`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Mono:wght@300;400;500&display=swap');

  .seewhy-app * { box-sizing: border-box; }

  .seewhy-app {
    background: ${CV.bg};
    color: ${CV.text};
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
    border-bottom: 1px solid ${CV.border};
    margin-bottom: 36px;
  }
  .sw-logo {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    font-size: 1.6rem;
    color: ${CV.gold};
    letter-spacing: -0.02em;
  }
  .sw-logo span { color: ${CV.cyan}; }
  .sw-badge {
    background: ${CV.live};
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
    color: ${CV.textMid};
    letter-spacing: 0.05em;
  }

  .sw-nav {
    display: flex;
    gap: 4px;
    margin-bottom: 40px;
    border-bottom: 1px solid ${CV.border};
  }
  .sw-tab {
    padding: 10px 20px;
    background: none;
    border: none;
    color: ${CV.textMid};
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .sw-tab:hover { color: ${CV.text}; }
  .sw-tab.active { color: ${CV.gold}; border-bottom-color: ${CV.gold}; }
  .sw-tab-icon { margin-right: 6px; }

  .sw-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: ${CV.text};
    margin-bottom: 8px;
  }
  .sw-section-sub {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 1.05rem;
    color: ${CV.textMid};
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
    background: ${CV.bgCard};
    border: 1px solid ${CV.border};
    border-radius: 12px;
    overflow: hidden;
    height: 520px;
    display: flex;
    flex-direction: column;
  }
  .chat-header {
    padding: 14px 18px;
    border-bottom: 1px solid ${CV.border};
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${CV.bgPanel};
  }
  .chat-live-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: ${CV.live};
    box-shadow: 0 0 8px ${CV.live};
    animation: swPulse 1.5s infinite;
  }
  @keyframes swPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .chat-title {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: ${CV.textMid};
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .chat-count { margin-left: auto; font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${CV.cyan}; }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: ${CV.border} transparent;
  }
  .chat-msg { display: flex; gap: 10px; align-items: flex-start; animation: swMsgIn 0.3s ease; }
  @keyframes swMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .chat-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
    border: 1px solid ${CV.border};
  }
  .chat-msg-name { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.gold}; margin-bottom: 3px; }
  .chat-msg-name.mod { color: ${CV.cyan}; }
  .chat-msg-name.sub { color: #D4854A; }
  .chat-msg-text { font-family: 'Cormorant Garamond', serif; font-size: 0.92rem; color: ${CV.text}; line-height: 1.4; }

  .quick-reactions {
    display: flex;
    gap: 6px;
    padding: 10px 16px;
    border-top: 1px solid ${CV.border};
    border-bottom: 1px solid ${CV.border};
    background: ${CV.bgPanel};
    overflow-x: auto;
    scrollbar-width: none;
  }
  .quick-reaction-btn {
    background: none;
    border: 1px solid ${CV.border};
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .quick-reaction-btn:hover { border-color: ${CV.gold}; background: ${CV.bgCard}; transform: scale(1.15); }
  .quick-reaction-btn.burst { animation: swEmojiPop 0.4s ease; }
  @keyframes swEmojiPop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }

  .chat-input-row { padding: 12px 16px; display: flex; gap: 8px; align-items: center; }
  .chat-input {
    flex: 1;
    background: ${CV.bgPanel};
    border: 1px solid ${CV.border};
    border-radius: 8px;
    padding: 8px 14px;
    color: ${CV.text};
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: ${CV.gold}; }
  .chat-input::placeholder { color: ${CV.textDim}; }
  .emoji-trigger-btn, .send-btn {
    background: none;
    border: 1px solid ${CV.border};
    border-radius: 8px;
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.15s;
    color: ${CV.textMid};
  }
  .emoji-trigger-btn:hover { border-color: ${CV.gold}; color: ${CV.gold}; }
  .send-btn { background: ${CV.gold}; border-color: ${CV.gold}; color: ${CV.bg}; font-size: 0.9rem; }
  .send-btn:hover { background: #D4B460; }

  /* EMOJI PICKER */
  .emoji-picker {
    background: ${CV.bgCard};
    border: 1px solid ${CV.border};
    border-radius: 12px;
    overflow: hidden;
    height: 520px;
    display: flex;
    flex-direction: column;
  }
  .emoji-picker-header { padding: 14px 16px; border-bottom: 1px solid ${CV.border}; background: ${CV.bgPanel}; }
  .emoji-picker-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: ${CV.gold}; margin-bottom: 10px; }
  .emoji-search {
    width: 100%;
    background: ${CV.bg};
    border: 1px solid ${CV.border};
    border-radius: 6px;
    padding: 6px 12px;
    color: ${CV.text};
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    outline: none;
  }
  .emoji-search:focus { border-color: ${CV.cyan}; }
  .emoji-cats {
    display: flex;
    gap: 4px;
    padding: 10px 16px;
    border-bottom: 1px solid ${CV.border};
    overflow-x: auto;
    scrollbar-width: none;
  }
  .emoji-cat-btn {
    background: none;
    border: 1px solid ${CV.border};
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.75rem;
    cursor: pointer;
    white-space: nowrap;
    color: ${CV.textMid};
    font-family: 'DM Mono', monospace;
    transition: all 0.15s;
  }
  .emoji-cat-btn.active, .emoji-cat-btn:hover { border-color: ${CV.gold}; color: ${CV.gold}; background: ${CV.bgPanel}; }
  .emoji-grid {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    align-content: start;
    scrollbar-width: thin;
    scrollbar-color: ${CV.border} transparent;
  }
  .emoji-btn { background: none; border: none; border-radius: 8px; padding: 8px; font-size: 1.3rem; cursor: pointer; transition: all 0.12s; line-height: 1; }
  .emoji-btn:hover { background: ${CV.bgPanel}; transform: scale(1.2); }
  .emoji-picker-footer { padding: 10px 16px; border-top: 1px solid ${CV.border}; display: flex; align-items: center; gap: 8px; }
  .emoji-preview { font-size: 1.6rem; }
  .emoji-preview-name { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${CV.textMid}; }

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
    background: ${CV.bgCard};
    border: 1px solid ${CV.border};
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.25s;
  }
  .vod-card:hover { border-color: ${CV.gold}; transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
  .vod-thumb { position: relative; height: 170px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
  .vod-thumb-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, ${CV.bgCard}); }
  .vod-play-btn {
    position: absolute;
    width: 52px; height: 52px;
    background: rgba(0,0,0,0.7);
    border: 2px solid ${CV.gold};
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: ${CV.gold};
    font-size: 1.2rem;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
  }
  .vod-card:hover .vod-play-btn { background: ${CV.gold}; color: ${CV.bg}; transform: scale(1.1); }
  .vod-duration { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.85); color: ${CV.text}; font-family: 'DM Mono', monospace; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; }
  .vod-highlights { position: absolute; top: 10px; left: 10px; background: ${CV.live}; color: #fff; font-family: 'DM Mono', monospace; font-size: 0.62rem; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.05em; }
  .vod-info { padding: 16px; }
  .vod-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: ${CV.text}; margin-bottom: 8px; line-height: 1.3; }
  .vod-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .vod-creator-name { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${CV.gold}; }
  .vod-stats { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.textMid}; margin-left: auto; }
  .vod-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .vod-tag { background: ${CV.bgPanel}; border: 1px solid ${CV.border}; border-radius: 4px; padding: 2px 8px; font-family: 'DM Mono', monospace; font-size: 0.62rem; color: ${CV.textMid}; text-transform: uppercase; letter-spacing: 0.06em; }

  /* VOD Modal */
  .vod-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(8px); animation: swFadeIn 0.2s ease; }
  @keyframes swFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .vod-player-container { background: ${CV.bgCard}; border: 1px solid ${CV.border}; border-radius: 16px; width: 100%; max-width: 900px; overflow: hidden; animation: swSlideUp 0.25s ease; }
  @keyframes swSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .vod-player-screen { height: 380px; display: flex; align-items: center; justify-content: center; position: relative; }
  .vod-player-ui { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 20px; background: linear-gradient(to top, rgba(0,0,0,0.95), transparent); }
  .vod-progress-bar { width: 100%; height: 4px; background: ${CV.border}; border-radius: 2px; margin-bottom: 12px; cursor: pointer; }
  .vod-progress-fill { height: 100%; background: linear-gradient(90deg, ${CV.gold}, ${CV.cyan}); border-radius: 2px; transition: width 0.1s; }
  .vod-controls { display: flex; align-items: center; gap: 12px; }
  .vod-ctrl-btn { background: none; border: none; color: ${CV.text}; font-size: 1.2rem; cursor: pointer; padding: 4px; transition: color 0.15s; }
  .vod-ctrl-btn:hover { color: ${CV.gold}; }
  .vod-time { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: ${CV.textMid}; margin-left: auto; }
  .vod-player-info { padding: 16px 20px; }
  .vod-player-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: ${CV.text}; margin-bottom: 10px; }
  .vod-close-btn { position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.7); border: 1px solid ${CV.border}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: ${CV.textMid}; cursor: pointer; font-size: 1rem; transition: all 0.15s; z-index: 10; }
  .vod-close-btn:hover { border-color: ${CV.gold}; color: ${CV.gold}; }
  .vod-chapters { border-top: 1px solid ${CV.border}; max-height: 200px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: ${CV.border} transparent; }
  .chapters-label { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.textMid}; text-transform: uppercase; letter-spacing: 0.1em; padding: 10px 20px 6px; }
  .chapter-item { display: flex; align-items: center; gap: 12px; padding: 8px 20px; cursor: pointer; transition: background 0.15s; }
  .chapter-item:hover, .chapter-item.active { background: ${CV.bgPanel}; }
  .chapter-time { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: ${CV.cyan}; min-width: 50px; }
  .chapter-name { font-family: 'Cormorant Garamond', serif; font-size: 0.9rem; color: ${CV.text}; }
  .chapter-dot { width: 6px; height: 6px; border-radius: 50%; background: ${CV.border}; flex-shrink: 0; }
  .chapter-item.active .chapter-dot { background: ${CV.gold}; }

  /* SHARE */
  .share-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .share-card { background: ${CV.bgCard}; border: 1px solid ${CV.border}; border-radius: 12px; overflow: hidden; }
  .share-card-header { padding: 16px 20px; border-bottom: 1px solid ${CV.border}; background: ${CV.bgPanel}; }
  .share-card-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: ${CV.gold}; margin-bottom: 4px; }
  .share-card-sub { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.textMid}; text-transform: uppercase; letter-spacing: 0.06em; }
  .share-card-body { padding: 20px; }
  .stream-og-card { background: ${CV.bgPanel}; border: 1px solid ${CV.border}; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
  .stream-og-thumb { height: 120px; background: linear-gradient(135deg, #0F1428, #0D1022); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; position: relative; }
  .stream-og-live-badge { position: absolute; top: 10px; left: 10px; background: ${CV.live}; color: #fff; font-family: 'DM Mono', monospace; font-size: 0.6rem; padding: 2px 8px; border-radius: 3px; letter-spacing: 0.1em; display: flex; align-items: center; gap: 4px; }
  .stream-og-body { padding: 12px; }
  .stream-og-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; color: ${CV.text}; margin-bottom: 4px; }
  .stream-og-meta { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.textMid}; }
  .stream-og-url { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: ${CV.cyan}; opacity: 0.7; }
  .share-platforms { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .share-platform-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; border: 1px solid ${CV.border}; border-radius: 10px; cursor: pointer; background: none; transition: all 0.2s; }
  .share-platform-btn:hover { transform: translateY(-2px); border-color: ${CV.gold}; }
  .share-platform-btn.shared { border-color: #6DBF7E; background: rgba(109,191,126,0.05); }
  .share-platform-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; }
  .share-platform-name { font-family: 'DM Mono', monospace; font-size: 0.58rem; color: ${CV.textMid}; text-align: center; text-transform: uppercase; letter-spacing: 0.04em; }
  .share-platform-btn.shared .share-platform-name { color: #6DBF7E; }
  .share-message-area { width: 100%; background: ${CV.bg}; border: 1px solid ${CV.border}; border-radius: 8px; padding: 10px 14px; color: ${CV.text}; font-family: 'Cormorant Garamond', serif; font-size: 0.92rem; resize: none; outline: none; margin-bottom: 12px; min-height: 70px; line-height: 1.5; }
  .share-message-area:focus { border-color: ${CV.gold}; }
  .copy-link-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .copy-link-input { flex: 1; background: ${CV.bg}; border: 1px solid ${CV.border}; border-radius: 6px; padding: 8px 12px; color: ${CV.cyan}; font-family: 'DM Mono', monospace; font-size: 0.7rem; outline: none; }
  .copy-link-btn { background: ${CV.gold}; border: none; border-radius: 6px; padding: 8px 16px; color: ${CV.bg}; font-family: 'DM Mono', monospace; font-size: 0.7rem; font-weight: 500; cursor: pointer; transition: all 0.15s; letter-spacing: 0.05em; }
  .copy-link-btn:hover { background: #D4B460; }
  .copy-link-btn.copied { background: #6DBF7E; color: #fff; }
  .referral-card { background: linear-gradient(135deg, ${CV.bgPanel}, ${CV.bg}); border: 1px solid ${CV.goldDim}; border-radius: 10px; padding: 16px; }
  .referral-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; color: ${CV.gold}; margin-bottom: 6px; }
  .referral-desc { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.85rem; color: ${CV.textMid}; margin-bottom: 12px; }
  .referral-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .referral-stat { text-align: center; padding: 10px; background: ${CV.bg}; border-radius: 8px; border: 1px solid ${CV.border}; }
  .referral-stat-val { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: ${CV.gold}; display: block; }
  .referral-stat-label { font-family: 'DM Mono', monospace; font-size: 0.6rem; color: ${CV.textMid}; text-transform: uppercase; letter-spacing: 0.06em; }
  .share-analytics-title { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.textMid}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
  .share-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .share-bar-label { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.textMid}; min-width: 70px; }
  .share-bar-track { flex: 1; height: 6px; background: ${CV.border}; border-radius: 3px; overflow: hidden; }
  .share-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
  .share-bar-count { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: ${CV.textMid}; min-width: 30px; text-align: right; }

  /* UTILITIES */
  .sw-btn { background: ${CV.gold}; border: none; border-radius: 8px; padding: 10px 20px; color: ${CV.bg}; font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; letter-spacing: 0.06em; text-transform: uppercase; }
  .sw-btn:hover { background: #D4B460; transform: translateY(-1px); }
  .sw-btn-outline { background: none; border: 1px solid ${CV.gold}; color: ${CV.gold}; }
  .sw-btn-outline:hover { background: rgba(201,168,76,0.1); }
  .feature-badge { display: inline-flex; align-items: center; gap: 6px; background: ${CV.bgPanel}; border: 1px solid ${CV.border}; border-radius: 20px; padding: 4px 12px; font-family: 'DM Mono', monospace; font-size: 0.65rem; color: ${CV.textMid}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
  .feature-badge .dot { width: 5px; height: 5px; border-radius: 50%; background: ${CV.cyan}; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; }
  .info-card { background: ${CV.bgCard}; border: 1px solid ${CV.border}; border-radius: 10px; padding: 20px; }
  .info-card-icon { font-size: 1.6rem; margin-bottom: 10px; }
  .info-card-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; color: ${CV.text}; margin-bottom: 6px; }
  .info-card-desc { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.85rem; color: ${CV.textMid}; line-height: 1.5; }

  @media (max-width: 768px) {
    .emoji-demo { grid-template-columns: 1fr; }
    .share-demo { grid-template-columns: 1fr; }
    .info-grid { grid-template-columns: 1fr; }
    .vod-grid { grid-template-columns: 1fr; }
  }
`;

function fmtAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function EnhancementSuite() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const roomId = new URLSearchParams(window.location.search).get('room_id');
  const [activeTab, setActiveTab] = useState("emoji");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("🔥 Hype");
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [burstingBtn, setBurstingBtn] = useState(null);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [selectedVod, setSelectedVod] = useState(null);
  const [vodPlaying, setVodPlaying] = useState(false);
  const [vodProgress, setVodProgress] = useState(22);
  const [activeChapter, setActiveChapter] = useState(1);
  const [sharedPlatforms, setSharedPlatforms] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareMessage, setShareMessage] = useState("🔴 LIVE NOW on SeeWhy LIVE — join the stream! 🎵🔥");
  const messagesEndRef = useRef(null);
  const progressTimerRef = useRef(null);
  const styleRef = useRef(null);

  const { data: clips = [] } = useQuery({
    queryKey: ['enhancement-clips'],
    queryFn: () => base44.entities.Clip.list('-created_date', 12),
  });

  const { data: recentMessages = [] } = useQuery({
    queryKey: ['enhancement-messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 20),
  });

  const { data: shareActivities = [] } = useQuery({
    queryKey: ['share-activities'],
    queryFn: () => base44.entities.Activity.filter({ type: 'share' }),
  });

  const displayVods = clips.map(c => ({
    id: c.id,
    title: c.title || 'Untitled Recording',
    creator: c.creator_name || 'Creator',
    creatorAvatar: '🎬',
    duration: c.duration || '–',
    views: c.view_count ? c.view_count.toLocaleString() : '0',
    date: c.created_date ? fmtAgo(c.created_date) : '',
    thumbnail_color: '#0F1428',
    chapters: (() => { try { return Array.isArray(c.chapters) ? c.chapters : JSON.parse(c.chapters || '[]'); } catch { return []; } })(),
    tags: (() => { try { return Array.isArray(c.tags) ? c.tags : JSON.parse(c.tags || '[]'); } catch { return []; } })(),
    highlights: c.highlights || 0,
  }));

  const SHARE_ANALYTICS_DATA = (() => {
    const defs = [
      { label: 'Twitter/X', color: CV.cyan },
      { label: 'Discord',   color: '#D4854A' },
      { label: 'WhatsApp',  color: '#25D366' },
      { label: 'TikTok',    color: '#FF0050' },
      { label: 'Instagram', color: '#E1306C' },
      { label: 'Facebook',  color: '#1877F2' },
    ];
    const counts = defs.map(d => shareActivities.filter(a => a.title?.toLowerCase().includes(d.label.toLowerCase())).length);
    const maxCount = Math.max(...counts, 1);
    return defs.map((d, i) => ({ ...d, count: counts[i], pct: Math.round((counts[i] / maxCount) * 100) }));
  })();

  useEffect(() => {
    if (recentMessages.length > 0 && messages.length === 0) {
      setMessages(recentMessages.slice().reverse().slice(0, 20).map(m => ({
        id: m.id,
        user: m.user_name || 'viewer',
        role: m.is_mod ? 'mod' : m.is_subscriber ? 'sub' : 'viewer',
        avatar: '💬',
        text: m.content || '',
        time: new Date(m.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })));
    }
  }, [recentMessages]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { if (styleRef.current) document.head.removeChild(styleRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (vodPlaying) {
      progressTimerRef.current = setInterval(() => {
        setVodProgress(p => {
          if (p >= 100) { setVodPlaying(false); return 100; }
          return p + 0.3;
        });
      }, 100);
    } else {
      clearInterval(progressTimerRef.current);
    }
    return () => clearInterval(progressTimerRef.current);
  }, [vodPlaying]);

  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(), user: "You", role: "sub", avatar: "😎",
      text: chatInput,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setChatInput("");
  }, [chatInput]);

  const addEmoji = (emoji) => {
    setChatInput(prev => prev + emoji);
    setHoveredEmoji(emoji);
  };

  const fireReaction = (emoji, e) => {
    setBurstingBtn(emoji);
    setTimeout(() => setBurstingBtn(null), 400);
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji, x: rect.left + rect.width / 2, y: rect.top }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2000);
    setMessages(prev => [...prev, {
      id, user: "You", role: "sub", avatar: "😎",
      text: `${emoji} ${emoji} ${emoji}`,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }]);
  };

  const handleShare = (platformId) => {
    setSharedPlatforms(prev => ({ ...prev, [platformId]: true }));
    setTimeout(() => setSharedPlatforms(prev => { const n = { ...prev }; delete n[platformId]; return n; }), 3000);
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredEmojis = emojiSearch
    ? Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(emojiSearch))
    : EMOJI_CATEGORIES[activeCategory] || [];

  return (
    <div className="seewhy-app">
      {floatingReactions.map(r => (
        <div key={r.id} className="reaction-float" style={{ left: r.x, top: r.y }}>{r.emoji}</div>
      ))}

      {selectedVod && (
        <div className="vod-modal-backdrop" onClick={e => e.target === e.currentTarget && setSelectedVod(null)}>
          <div className="vod-player-container">
            <div className="vod-player-screen" style={{ background: selectedVod.thumbnail_color }}>
              <div style={{ fontSize: "4rem" }}>{selectedVod.creatorAvatar}</div>
              <button className="vod-close-btn" onClick={() => setSelectedVod(null)}>✕</button>
              <div className="vod-player-ui">
                <div className="vod-progress-bar" onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setVodProgress(((e.clientX - rect.left) / rect.width) * 100);
                }}>
                  <div className="vod-progress-fill" style={{ width: `${vodProgress}%` }} />
                </div>
                <div className="vod-controls">
                  <button className="vod-ctrl-btn" onClick={() => setVodProgress(p => Math.max(0, p - 5))}>⏮</button>
                  <button className="vod-ctrl-btn" onClick={() => setVodPlaying(p => !p)}>{vodPlaying ? "⏸" : "▶"}</button>
                  <button className="vod-ctrl-btn" onClick={() => setVodProgress(p => Math.min(100, p + 5))}>⏭</button>
                  <span className="vod-time">{selectedVod.duration}</span>
                </div>
              </div>
            </div>
            <div className="vod-player-info">
              <div className="vod-player-title">{selectedVod.title}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: "1rem" }}>{selectedVod.creatorAvatar}</span>
                <span style={{ fontFamily: "'DM Mono'", fontSize: "0.72rem", color: CV.gold }}>{selectedVod.creator}</span>
                <span style={{ fontFamily: "'DM Mono'", fontSize: "0.68rem", color: CV.textMid, marginLeft: "auto" }}>
                  {selectedVod.views} views · {selectedVod.date}
                </span>
              </div>
            </div>
            <div className="vod-chapters">
              <div className="chapters-label">Chapters</div>
              {selectedVod.chapters.map((ch, i) => (
                <div key={i}
                  className={`chapter-item${activeChapter === i ? " active" : ""}`}
                  onClick={() => { setActiveChapter(i); setVodProgress((i / selectedVod.chapters.length) * 100); }}>
                  <div className="chapter-dot" />
                  <span className="chapter-time">{ch.time}</span>
                  <span className="chapter-name">{ch.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sw-header">
        <div>
          <div className="sw-logo">See<span>Why</span> LIVE <span className="sw-badge">BETA</span></div>
        </div>
        <div className="sw-header-meta">SwanyThree EntTech · Enhancement Suite v1.0</div>
      </div>

      <div className="sw-nav">
        {[
          { id: "emoji", icon: "😊", label: "Stream Chat Emojis" },
          { id: "vod", icon: "📹", label: "Stream Replay VODs" },
          { id: "share", icon: "📡", label: "Social Sharing" },
        ].map(t => (
          <button key={t.id} className={`sw-tab${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
            <span className="sw-tab-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* EMOJI TAB */}
      {activeTab === "emoji" && (
        <div>
          <div className="feature-badge"><div className="dot" /> New Feature</div>
          <div className="sw-section-title">Stream Chat Emoji System</div>
          <div className="sw-section-sub">Real-time emoji picker with categories, search, quick reactions, and floating burst animations</div>
          <div className="emoji-demo">
            <div className="chat-window">
              <div className="chat-header">
                <div className="chat-live-dot" />
                <span className="chat-title">Live Chat</span>
                <span className="chat-count">1,247 watching</span>
              </div>
              <div className="chat-messages">
                {messages.map(msg => (
                  <div key={msg.id} className="chat-msg">
                    <div className="chat-avatar" style={{
                      background: msg.role === "mod" ? CV.cyanDim : msg.role === "sub" ? "#2A1040" : CV.bgPanel
                    }}>{msg.avatar}</div>
                    <div>
                      <div className={`chat-msg-name${msg.role !== "viewer" ? " " + msg.role : ""}`}>
                        {msg.role === "mod" && "🛡️ "}
                        {msg.role === "sub" && "⭐ "}
                        {msg.user}
                        <span style={{ color: CV.textDim, marginLeft: 6, fontFamily: "'DM Mono'", fontSize: "0.62rem" }}>{msg.time}</span>
                      </div>
                      <div className="chat-msg-text">{msg.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="quick-reactions">
                {QUICK_REACTIONS.map(e => (
                  <button key={e} className={`quick-reaction-btn${burstingBtn === e ? " burst" : ""}`} onClick={ev => fireReaction(e, ev)}>{e}</button>
                ))}
              </div>
              <div className="chat-input-row">
                <input className="chat-input" placeholder="Say something amazing..." value={chatInput}
                  onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
                <button className="emoji-trigger-btn">😊</button>
                <button className="send-btn" onClick={sendMessage}>→</button>
              </div>
            </div>
            <div className="emoji-picker">
              <div className="emoji-picker-header">
                <div className="emoji-picker-title">Emoji Library</div>
                <input className="emoji-search" placeholder="Search emojis..." value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} />
              </div>
              <div className="emoji-cats">
                {Object.keys(EMOJI_CATEGORIES).map(cat => (
                  <button key={cat} className={`emoji-cat-btn${activeCategory === cat && !emojiSearch ? " active" : ""}`}
                    onClick={() => { setActiveCategory(cat); setEmojiSearch(""); }}>{cat}</button>
                ))}
              </div>
              <div className="emoji-grid">
                {filteredEmojis.map((emoji, i) => (
                  <button key={i} className="emoji-btn"
                    onMouseEnter={() => setHoveredEmoji(emoji)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    onClick={() => addEmoji(emoji)}>{emoji}</button>
                ))}
              </div>
              <div className="emoji-picker-footer">
                <span className="emoji-preview">{hoveredEmoji || "☁️"}</span>
                <div>
                  <div className="emoji-preview-name">{hoveredEmoji ? "Click to add to message" : "Hover an emoji to preview"}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="info-grid">
            <div className="info-card"><div className="info-card-icon">⚡</div><div className="info-card-title">Quick Reaction Burst</div><div className="info-card-desc">One-tap emoji reactions with floating animation. Automatically broadcasts to chat for maximum engagement.</div></div>
            <div className="info-card"><div className="info-card-icon">🔐</div><div className="info-card-title">AES-256 Chat Encryption</div><div className="info-card-desc">All chat messages pass through SwanyThree Vault Pro before Socket.IO broadcast — zero plaintext in transit.</div></div>
            <div className="info-card"><div className="info-card-icon">🤖</div><div className="info-card-title">Guardian AI Filtering</div><div className="info-card-desc">Claude + toxic-bert ONNX ensemble (60/40) auto-moderates emoji spam and flags inappropriate reaction patterns.</div></div>
          </div>
        </div>
      )}

      {/* VOD TAB */}
      {activeTab === "vod" && (
        <div>
          <div className="feature-badge"><div className="dot" /> New Feature</div>
          <div className="sw-section-title">Stream Replay VODs</div>
          <div className="sw-section-sub">Automatic recording, chapter indexing, and on-demand playback for every live session</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
            {["All Replays", "Music", "Gaming", "Tutorials", "Highlights"].map(f => (
              <button key={f} className="sw-btn sw-btn-outline" style={{ padding: "6px 16px", fontSize: "0.7rem" }}>{f}</button>
            ))}
            <button className="sw-btn" style={{ marginLeft: "auto", padding: "6px 16px", fontSize: "0.7rem" }}>+ Upload VOD</button>
          </div>
          <div className="vod-grid">
            {displayVods.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: CV.textMid, fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                No recordings yet — go live to start capturing VODs
              </div>
            )}
            {displayVods.map(vod => (
              <div key={vod.id} className="vod-card" onClick={() => { setSelectedVod(vod); setVodProgress(0); setVodPlaying(false); }}>
                <div className="vod-thumb" style={{ background: `linear-gradient(135deg, ${vod.thumbnail_color}, #0D0508)` }}>
                  <span style={{ fontSize: "2.5rem" }}>{vod.creatorAvatar}</span>
                  <div className="vod-thumb-overlay" />
                  <div className="vod-play-btn">▶</div>
                  <div className="vod-duration">{vod.duration}</div>
                  <div className="vod-highlights">⚡ {vod.highlights} Highlights</div>
                </div>
                <div className="vod-info">
                  <div className="vod-title">{vod.title}</div>
                  <div className="vod-meta">
                    <span>{vod.creatorAvatar}</span>
                    <span className="vod-creator-name">{vod.creator}</span>
                    <span className="vod-stats">{vod.views} views · {vod.date}</span>
                  </div>
                  <div className="vod-tags">
                    {vod.tags.map(t => <span key={t} className="vod-tag">{t}</span>)}
                    <span className="vod-tag" style={{ marginLeft: "auto" }}>📖 {vod.chapters.length} chapters</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="info-grid">
            <div className="info-card"><div className="info-card-icon">📡</div><div className="info-card-title">Auto-Record via MediaMTX</div><div className="info-card-desc">Every stream is captured by the MediaMTX RTMP server and stored in Hostinger VPS storage — zero manual effort.</div></div>
            <div className="info-card"><div className="info-card-icon">📖</div><div className="info-card-title">AI Chapter Indexing</div><div className="info-card-desc">Aura AI co-host (Llama 3.3 70B) analyzes stream content to auto-generate chapter markers and scene labels.</div></div>
            <div className="info-card"><div className="info-card-icon">💰</div><div className="info-card-title">Creator Revenue — 90/10</div><div className="info-card-desc">VOD tip jars and PPV replays follow the locked 90/10 split. Creator keeps 90%, always. No exceptions.</div></div>
          </div>
        </div>
      )}

      {/* SHARE TAB */}
      {activeTab === "share" && (
        <div>
          <div className="feature-badge"><div className="dot" /> New Feature</div>
          <div className="sw-section-title">Social Sharing Integration</div>
          <div className="sw-section-sub">One-click stream sharing, referral tracking, and viral growth tools built into every stream</div>
          <div className="share-demo">
            <div>
              <div className="share-card">
                <div className="share-card-header">
                  <div className="share-card-title">Share Your Stream</div>
                  <div className="share-card-sub">Reach more viewers instantly</div>
                </div>
                <div className="share-card-body">
                  <div className="stream-og-card">
                    <div className="stream-og-thumb">
                      🎵
                      <div className="stream-og-live-badge">
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} /> LIVE
                      </div>
                    </div>
                    <div className="stream-og-body">
                      <div className="stream-og-title">Late Night Lo-Fi Beats — SeeWhy LIVE</div>
                      <div className="stream-og-meta">DJ SwanyThree · 1,247 watching</div>
                      <div className="stream-og-url">seewhylive.com/live/swanythree</div>
                    </div>
                  </div>
                  <textarea className="share-message-area" value={shareMessage} onChange={e => setShareMessage(e.target.value)} rows={3} />
                  <div className="copy-link-row">
                    <input className="copy-link-input" readOnly value="seewhylive.com/live/swanythree?ref=DJ_SwanyThree" />
                    <button className={`copy-link-btn${copiedLink ? " copied" : ""}`} onClick={handleCopyLink}>
                      {copiedLink ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="share-platforms">
                    {SHARE_PLATFORMS.map(p => (
                      <button key={p.id} className={`share-platform-btn${sharedPlatforms[p.id] ? " shared" : ""}`} onClick={() => handleShare(p.id)}>
                        <div className="share-platform-icon" style={{ background: p.color, color: p.textColor }}>
                          {sharedPlatforms[p.id] ? "✓" : p.icon}
                        </div>
                        <span className="share-platform-name">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="referral-card" style={{ marginBottom: 20 }}>
                <div className="referral-title">🎯 Your Referral Program</div>
                <div className="referral-desc">Earn bonus revenue every time someone signs up through your stream link</div>
                <div className="referral-stats">
                  <div className="referral-stat"><span className="referral-stat-val">247</span><span className="referral-stat-label">Referrals</span></div>
                  <div className="referral-stat"><span className="referral-stat-val" style={{ color: CV.cyan }}>$182</span><span className="referral-stat-label">Earned</span></div>
                  <div className="referral-stat"><span className="referral-stat-val" style={{ color: "#6DBF7E" }}>31</span><span className="referral-stat-label">Converted</span></div>
                </div>
              </div>
              <div className="share-card">
                <div className="share-card-header">
                  <div className="share-card-title">Share Analytics</div>
                  <div className="share-card-sub">Last 30 days · 850 total shares</div>
                </div>
                <div className="share-card-body">
                  <div className="share-analytics-title">Platform Breakdown</div>
                  {SHARE_ANALYTICS_DATA.map(row => (
                    <div key={row.label} className="share-bar-row">
                      <span className="share-bar-label">{row.label}</span>
                      <div className="share-bar-track">
                        <div className="share-bar-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                      </div>
                      <span className="share-bar-count">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="info-grid" style={{ marginTop: 28 }}>
            <div className="info-card"><div className="info-card-icon">🔗</div><div className="info-card-title">Smart Referral Links</div><div className="info-card-desc">Every share auto-appends your creator ref tag. Conversions tracked in GHL CRM pipeline and n8n automation.</div></div>
            <div className="info-card"><div className="info-card-icon">📊</div><div className="info-card-title">Real-Time Share Analytics</div><div className="info-card-desc">Track which platforms drive the most new viewers, subscriptions, and revenue — updated live via Socket.IO.</div></div>
            <div className="info-card"><div className="info-card-icon">🎁</div><div className="info-card-title">Viral Growth Rewards</div><div className="info-card-desc">Share milestones unlock DominoCoins, badge upgrades, and bonus platform visibility in the discovery feed.</div></div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CoStreamPanel roomId={roomId} />
        <SpotlightBanner communityId={null} isAdmin={false} />
        <OverlayThemeBuilder creatorId={user?.id} />
        <SoundboardWidget roomId={roomId} isHost={true} />
        <RoomBrandingEditor roomId={roomId} isHost={true} />
        <CollaborationMatcher />
        <ContentRecommendations />
        <AutomatedHighlightReels streamSession={null} />
      </div>
    </div>
  );
}