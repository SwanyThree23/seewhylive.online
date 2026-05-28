import React, { useState, useMemo } from 'react';
import AvatarPortrait from './AvatarPortrait.jsx';

var CATS = ['ALL', 'START', 'GO LIVE', 'MONEY', 'ENGAGE', 'COMMUNITY', 'ANALYTICS', 'AI', 'TECH'];

var CAT_COLORS = {
  'ALL':       '#7A6F90',
  'START':     '#00C9A7',
  'GO LIVE':   '#FF1A3C',
  'MONEY':     '#C9A84C',
  'ENGAGE':    '#C084FC',
  'COMMUNITY': '#4DA6FF',
  'ANALYTICS': '#E8FF47',
  'AI':        '#00DEC0',
  'TECH':      '#FF6B35',
};

var TIPS = [
  // ── GETTING STARTED ──────────────────────────────────────────────────────
  {
    id: 't1', cat: 'START', icon: '🚀', title: 'Go Live in 60 Seconds',
    summary: 'Your fastest path from offline to broadcasting.',
    steps: [
      'Open the ROOM tab and set your stream title + category',
      'Click GO LIVE — your RTMP stream key is auto-generated',
      'In OBS: Server → rtmp://2.24.194.112:1935/live  ·  Stream Key → your key',
      'Hit Start Streaming in OBS — you\'re live instantly'
    ],
    pro: 'Your stream key never appears on screen to viewers — it\'s encrypted in the vault.',
    tab: '🎙 ROOM',
  },
  {
    id: 't2', cat: 'START', icon: '🎭', title: 'Set Up Your Profile',
    summary: 'Your avatar, bio, and display name define your brand across the entire platform.',
    steps: [
      'Open SETTINGS → Profile tab',
      'Your deterministic octagonal avatar auto-generates from your username',
      'Pick an emoji to overlay on your avatar, write a 160-char bio',
      'Display name shows everywhere — make it memorable',
      'Hit SAVE PROFILE — updates across all tabs instantly'
    ],
    pro: 'Your AvatarPortrait is always consistent — viewers recognize you in leaderboards, chat, and collab panels.',
    tab: '⚙ SETTINGS',
  },
  {
    id: 't3', cat: 'START', icon: '📱', title: 'Install as a Mobile App',
    summary: 'SeeWhy LIVE is a PWA — install it for full-screen app experience with no browser chrome.',
    steps: [
      'On Android: tap the INSTALL button in the top header bar',
      'On iOS Safari: tap Share → Add to Home Screen',
      'The app launches full-screen with offline capability',
      'Push notifications work once installed'
    ],
    pro: 'Installed PWA loads 3× faster than the browser version and works on poor connections.',
    tab: 'Header bar',
  },
  {
    id: 't4', cat: 'START', icon: '📅', title: 'Schedule Upcoming Streams',
    summary: 'Schedule shows in advance so your audience knows when to tune in.',
    steps: [
      'Open SCHED tab and click + NEW EVENT',
      'Set title, category, date/time, and recurrence (weekly, biweekly, none)',
      'Scheduled events appear in your public profile',
      'Set recurring events to auto-populate your calendar'
    ],
    pro: 'Scheduled streams with recurring tags show your consistency — that builds loyal followings.',
    tab: '📅 SCHED',
  },

  // ── GO LIVE ───────────────────────────────────────────────────────────────
  {
    id: 't5', cat: 'GO LIVE', icon: '📡', title: 'OBS / Encoder Setup',
    summary: 'Configure your broadcast software to push to SeeWhy LIVE.',
    steps: [
      'OBS → Settings → Stream → Custom RTMP',
      'Server: rtmp://2.24.194.112:1935/live',
      'Stream Key: copy from ROOM tab (visible only when you\'re the creator)',
      'Recommended: 6000 kbps video, 160 kbps audio, x264, keyframe 2s',
      'Output resolution: 1920×1080 or 1280×720'
    ],
    pro: 'Set keyframe interval to exactly 2s to match HLS fragment length for lowest latency.',
    tab: '🎙 ROOM',
  },
  {
    id: 't6', cat: 'GO LIVE', icon: '📺', title: 'Simulcast to 5 Platforms',
    summary: 'FANOUT pushes your single RTMP stream to YouTube, TikTok, Twitch, Facebook, and custom RTMP simultaneously.',
    steps: [
      'Open FANOUT tab and add each platform\'s stream key',
      'Toggle each destination on/off per stream',
      'Click START FANOUT — all platforms receive your feed live',
      'Monitor per-platform status in the FANOUT dashboard'
    ],
    pro: 'Stream once, reach everywhere. Your SeeWhy viewers still see exclusive gifts and Watch Party sync that other platforms don\'t get.',
    tab: '📡 FANOUT',
  },
  {
    id: 't7', cat: 'GO LIVE', icon: '🟢', title: 'Green Room — Backstage',
    summary: 'The Green Room is your backstage before going live — coordinate guests, raise hands, review who\'s joining.',
    steps: [
      'Open GREEN ROOM before starting your stream',
      'Guests who raised their hand appear in the queue',
      'Approve or decline guests before they go on-screen',
      'Use the Quick Invite panel to DM specific viewers to join',
      'Run through your lineup — then go live'
    ],
    pro: 'Approve guests in Green Room before they\'re visible to the audience — no surprise drop-ins.',
    tab: '🟢 GREEN',
  },
  {
    id: 't8', cat: 'GO LIVE', icon: '🎬', title: 'Overlays & Lower-Thirds',
    summary: 'Brand your stream with custom overlays, tickers, and chyrons.',
    steps: [
      'Open OVERLAY tab to configure graphic layers',
      'BRAND tab controls logo, colors, and channel identity',
      'Ticker shows scrolling text at the bottom of your stream',
      'Use BRANDING → export to get a browser-source URL for OBS'
    ],
    pro: 'Lock your brand colors to your state colors (e.g. Washington = #004C97 / #69BE28) for instant recognition.',
    tab: '🎬 OVERLAY',
  },
  {
    id: 't9', cat: 'GO LIVE', icon: '▶', title: 'Replay & VOD',
    summary: 'Every stream can be replayed and stored in your VOD library.',
    steps: [
      'REPLAY tab shows all past sessions with timestamps',
      'VOD LIBRARY hosts imported YouTube content and your replays',
      'Share any VOD via the 📤 SHARE button to push it to live chat',
      'VODs are categorized by type — SPORTS, MUSIC, TECH, etc.'
    ],
    pro: 'A strong VOD library keeps viewers engaged between live sessions and helps new followers catch up.',
    tab: '▶ REPLAY',
  },

  // ── MONETIZATION ─────────────────────────────────────────────────────────
  {
    id: 't10', cat: 'MONEY', icon: '💎', title: '90/10 Revenue Split',
    summary: 'Every dollar earned on SeeWhy LIVE: 90¢ goes to you, 10¢ to the platform. Always.',
    steps: [
      'Gifts: viewer sends $9.99 Diamond → you receive $8.99',
      'PPV unlock: $4.99 match → you receive $4.49',
      'All amounts calculated server-side using Math.floor() — no rounding errors',
      'Revenue tracked in real-time on the DATA and DEEP tabs'
    ],
    pro: 'This split is encoded in the server and cannot be overridden by any stream config. It\'s immutable.',
    tab: '💰 MONEY',
  },
  {
    id: 't11', cat: 'MONEY', icon: '🎁', title: 'Super Gifts & Gift Tiers',
    summary: 'Viewers send animated gifts during your live — from $0.99 Roses to $19.99 Trophies.',
    steps: [
      'Gifts appear as full-screen overlays on all viewer screens',
      'Gift types: Rose 99¢ · Domino $1.99 · Fire $2.99 · Crown $4.99 · Diamond $9.99 · Trophy $19.99',
      'Each gift triggers an AURA AI shoutout automatically',
      'Top gifters appear on the leaderboard in the MONEY tab'
    ],
    pro: 'During PK Battles, gifts count as votes for your side — turn your gift system into competitive engagement.',
    tab: '💰 MONEY',
  },
  {
    id: 't12', cat: 'MONEY', icon: '🔐', title: 'PPV Paywalls',
    summary: 'Lock premium content behind a pay-per-view gate that viewers unlock once.',
    steps: [
      'In MONEY tab → PAYWALL section, set a price ($0.99–$99.99)',
      'Activate paywall before going live',
      'New viewers see a locked screen with the unlock price',
      'Existing viewers who already paid are grandfathered in',
      'Washington Classic quarterfinals use $4.99 PPV by default'
    ],
    pro: 'Combine PPV with a free preview window (first 5 min free) to hook viewers before the wall drops.',
    tab: '💰 MONEY',
  },
  {
    id: 't13', cat: 'MONEY', icon: '💸', title: 'Direct Pay Links',
    summary: 'Accept tips directly via PayPal, Cash App, Venmo, Zelle, and Chime — outside the platform.',
    steps: [
      'Open DIRECT PAY tab and enter your handles for each platform',
      'QR codes and direct links are auto-generated',
      'Share a direct pay link to chat with one click',
      'Works even when you\'re not streaming'
    ],
    pro: 'Zelle and Chime are instant bank transfers — no platform fees at all on those channels.',
    tab: '💸 DIRECT PAY',
  },
  {
    id: 't14', cat: 'MONEY', icon: '👕', title: 'Merch Store',
    summary: 'Sell branded merchandise directly to your audience.',
    steps: [
      'Open MERCH tab to browse and manage your product catalog',
      'Set items as LIMITED to create urgency (low stock badges appear)',
      'Sales appear in your analytics with revenue tracking',
      'Promote specific items live — the ANNOUNCE button posts to chat'
    ],
    pro: 'Limited-edition event merch (e.g. "Washington Classic 2026 Tee") sells out faster than evergreen items.',
    tab: '👕 MERCH',
  },
  {
    id: 't15', cat: 'MONEY', icon: '🎫', title: 'Subscriber Tiers',
    summary: 'Recurring monthly revenue from your most loyal viewers — three tiers.',
    steps: [
      'Fan $5/mo — ad-free chat, Fan badge',
      'Supporter $10/mo — exclusive streams, Supporter badge',
      'Ride or Die $20/mo — direct DMs, monthly shoutout, RoD badge',
      'Manage tiers in your PROFILE tab → Subscriber section',
      'Subscribers are grandfathered into Subscriber-Only chat mode'
    ],
    pro: 'Ride or Die members are your inner circle — give them early access to PPV events at no extra charge to reward loyalty.',
    tab: '👤 PROFILE',
  },

  // ── ENGAGEMENT ────────────────────────────────────────────────────────────
  {
    id: 't16', cat: 'ENGAGE', icon: '🎬', title: 'Watch Party — Sync Videos',
    summary: 'Play any YouTube video in perfect sync for every viewer on your stream — watch together in real time.',
    steps: [
      'Open WATCH tab during your live stream',
      'Paste a YouTube URL or Video ID and click LOAD',
      'Hit PLAY — all viewers\' players sync within 1 second',
      'Pause, seek, or switch videos — only you can control it',
      'Late joiners auto-sync to the current position'
    ],
    pro: 'Watch Party state is preserved server-side — if you lose connection and reconnect, the sync state restores automatically.',
    tab: '📺 WATCH',
  },
  {
    id: 't17', cat: 'ENGAGE', icon: '⚡', title: 'PK Battle — Head-to-Head',
    summary: 'Face another creator in a timed battle where viewers vote with gifts. Highest gift total wins.',
    steps: [
      'Open BATTLES tab and select INSTANT, RANKED, or CLANS',
      'Choose a rival from the roster or invite by username',
      'Set battle duration (5 / 10 / 30 min) and start',
      'Viewers gift to either side — the split bar shifts in real time',
      'Winner gets the viewers, trophy, and ELO points'
    ],
    pro: 'In PK Battles, gifts are 10× more likely when the score is close — amplify the moment by calling it out live.',
    tab: '⚡ BATTLES',
  },
  {
    id: 't18', cat: 'ENGAGE', icon: '🃏', title: 'FADES — Online Corruption',
    summary: 'FADES is SeeWhy\'s signature head-to-head domino arena battle format.',
    steps: [
      'Open FADES tab to view the arena and active challengers',
      'Challenge a rival or accept an incoming FADE',
      'Both players stream live side-by-side for viewers',
      'Viewers gift to support their chosen player',
      'State FADES Battles are tracked in the SHOWCASE leaderboard'
    ],
    pro: 'FADES battles within the Washington Classic earn you Showcase points — win enough to carry your state to the championship.',
    tab: '⚡ FADES',
  },
  {
    id: 't19', cat: 'ENGAGE', icon: '📊', title: 'Live Polls',
    summary: 'Launch real-time polls — SwanyBot handles voting, counting, and announcing results.',
    steps: [
      'BOT tab → POLLS section → create your question + up to 4 options',
      'Set poll duration (default 60s)',
      'Click LAUNCH POLL — it broadcasts to all viewers in chat',
      'Watch votes roll in live — results auto-announce when time ends',
      'Past polls are saved for analytics review'
    ],
    pro: 'Ask match predictions before PK Battles start — the anticipation drives more gift engagement.',
    tab: '🤖 SWANYBOT',
  },
  {
    id: 't20', cat: 'ENGAGE', icon: '🏆', title: 'Washington Classic',
    summary: 'The flagship domino tournament on SeeWhy LIVE — 8 states, bracket-style, live PPV matches.',
    steps: [
      'Open DC tab to view standings, bracket, and results',
      'Stream your state\'s matches live — viewers unlock PPV per match',
      'Vote on predictions for upcoming quarterfinals',
      'Launch State Fades Battles from the BATTLE sub-tab',
      'EXPAND sub-tab shows the Season 2 50-state roadmap'
    ],
    pro: 'Washington is undefeated — 8W, 0L, 1840 tiles. Hosting a FADES battle on DC draws the highest viewer counts of any format.',
    tab: '🎲 DC',
  },

  // ── COMMUNITY ─────────────────────────────────────────────────────────────
  {
    id: 't21', cat: 'COMMUNITY', icon: '🤝', title: 'Creator Collabs',
    summary: 'Invite other creators onto your stream as co-hosts or featured guests.',
    steps: [
      'Open COLLAB tab → DISCOVER to browse live creators',
      'Send a collab request — they accept or decline',
      'Accepted collabs appear in your active panel',
      'Both creator feeds merge for viewers to see side-by-side',
      'Use COLLAB for pre-planned joint streams'
    ],
    pro: 'Collabs are the fastest growth hack — your audience meets their audience. Schedule collab announcements 24h in advance.',
    tab: '🤝 COLLAB',
  },
  {
    id: 't22', cat: 'COMMUNITY', icon: '🛡', title: 'Guardian AI Moderation',
    summary: 'Automated chat protection that blocks spam, strips links, silences bots, and auto-enables Slow Mode under attack.',
    steps: [
      'Open GUARDIAN tab — Guardian is ON by default during live streams',
      'Toggle rules: CAPS FLOOD, REPEAT CHARS, EXTERNAL LINKS, EMOJI SPAM, SLOW MODE, NEW ACCOUNTS',
      'Add banned words — Guardian auto-blocks any message containing them',
      'Review FLAGGED tab for messages that need manual action',
      'Shadow ban bad actors so they think they\'re still chatting'
    ],
    pro: 'Guardian auto-escalates to Slow Mode when the block rate hits 15% — your chat stays clean without you touching anything.',
    tab: '🛡 GUARDIAN',
  },
  {
    id: 't23', cat: 'COMMUNITY', icon: '🤖', title: 'SwanyBot Automation',
    summary: 'SwanyBot runs your stream\'s chat on autopilot — greetings, gift hype, keyword triggers, and spam guard.',
    steps: [
      'BOT tab → RULES to toggle which events SwanyBot responds to',
      'Viewer join → auto-greeting; Gift received → hype message; New sub → shoutout',
      'TRIGGERS tab: add keyword→response pairs (e.g. !score → standings)',
      'MANUAL: broadcast any message to chat as the bot',
      'LOG tab shows every bot action in real time'
    ],
    pro: 'Add !discord, !merch, and !ppv keyword triggers — viewers who type these commands get instant info without you saying a word.',
    tab: '🤖 SWANYBOT',
  },
  {
    id: 't24', cat: 'COMMUNITY', icon: '🌐', title: 'Partner Portal',
    summary: 'Embed and feature Techmunity partner channels on your stream — AIverse, Domino Entertainment, Shy Girl, and more.',
    steps: [
      'Open PORTAL tab — switch between GRID and LIST views',
      'Click any channel to open its detail view',
      'FEATURE button embeds that channel\'s stream on your layout',
      'SHARE TO CHAT posts their channel link in your chat',
      'More Partner Channels shows related creators to explore'
    ],
    pro: 'Feature a partner channel during your downtime or break — keeps viewers engaged and builds cross-community loyalty.',
    tab: '🌐 PORTAL',
  },
  {
    id: 't25', cat: 'COMMUNITY', icon: '🏅', title: 'State Rankings & Showcase',
    summary: 'Compete for state-level dominoes supremacy — 8 states, weekly matches, live PPV quarterfinals.',
    steps: [
      'RANKS tab shows all 8 states sorted by rank, points, or W-L',
      'Click any state to see full roster, bio, and stats',
      'SHOWCASE tab drills into state details, brackets, and predictions',
      'PREDICT sub-tab lets viewers vote on match outcomes',
      'EXPAND sub-tab: apply to represent your state in Season 2'
    ],
    pro: 'Washington state has an 8-game win streak. Challenge them in FADES to shake up the leaderboard before Season 2.',
    tab: '🏅 RANKS',
  },
  {
    id: 't26', cat: 'COMMUNITY', icon: '📡', title: 'Social Share & Invites',
    summary: 'Share your stream link and invite your community to join in real time.',
    steps: [
      'SHARE tab → tap your stream link to copy it',
      'COMMUNITY view shows who\'s online/live in your network',
      'INVITE sends a direct notification to a specific user',
      'INVITE ALL ONLINE sends to every online community member at once',
      'MUTUAL badge shows who follows you back'
    ],
    pro: 'Use INVITE ALL ONLINE right when you go live — your most engaged followers join in the first 60 seconds and seed the chat.',
    tab: '📡 SHARE',
  },

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  {
    id: 't27', cat: 'ANALYTICS', icon: '📊', title: 'Real-Time Dashboard',
    summary: 'Live viewer count, chat velocity, gift rate, and revenue-per-minute — all updating every few seconds.',
    steps: [
      'DATA tab is your command center during a live stream',
      'Watch viewer count trend — a sudden drop signals you to change things up',
      'Chat velocity shows engagement health — below 5 msg/min is a warning sign',
      'Gift rate spikes during PK battles and call-outs — time them intentionally',
      'Revenue/min tells you which content formats monetize best'
    ],
    pro: 'Cross-reference the DATA tab with your stream timestamp — find the exact moment that spiked views and replicate it.',
    tab: '📊 DATA',
  },
  {
    id: 't28', cat: 'ANALYTICS', icon: '🔍', title: 'Analytics Deep Dive',
    summary: 'Post-stream analysis: top gifters, session comparisons, revenue trends, and creator leaderboards.',
    steps: [
      'DEEP tab shows detailed per-session breakdowns',
      'Gift leaderboard ranks your top supporters — acknowledge them by name next stream',
      'Session comparison shows which stream performed best and why',
      'Creator stats rank the platform\'s top performers for competitive context'
    ],
    pro: 'Your top 3 gifters should always get a personal shoutout at stream end — it multiplies their next session spend by 2-3×.',
    tab: '📊 DEEP',
  },
  {
    id: 't29', cat: 'ANALYTICS', icon: '🎞', title: 'Clip Engine',
    summary: 'Auto-captures highlight moments every 15 seconds during a live stream for instant replay and sharing.',
    steps: [
      'CLIPS tab auto-activates when you go live',
      'Every 15 seconds a new Live Clip is captured and timestamped',
      'SHOWCASE tab also shows live clip count in real time',
      'Review clips post-stream and export your best moments',
      'Push clips to VOD Library for evergreen content'
    ],
    pro: 'Every PK Battle points event is a potential viral clip. The Clip Engine captures them all automatically — review after every battle.',
    tab: '🎞 CLIPS',
  },

  // ── AI TOOLS ──────────────────────────────────────────────────────────────
  {
    id: 't30', cat: 'AI', icon: '🎤', title: 'AURA — AI Co-Host',
    summary: 'AURA is your AI co-host powered by Claude. It responds to viewer events, hypes gifts, pitches PPV, and keeps the energy alive.',
    steps: [
      'AURA tab → activate during your stream',
      'Use quick prompts: 90/10 pitch, FADES hype, multilingual shoutout, Golden Paywall pitch',
      'AURA automatically responds to gifts and viewer milestones',
      'Type a custom prompt to make AURA say exactly what you need',
      'AURA stays in character — energetic, hype, domino-culture aware'
    ],
    pro: 'Let AURA handle the grind commentary while you focus on the game — it sounds natural and never breaks character.',
    tab: '🤖 AURA',
  },
  {
    id: 't31', cat: 'AI', icon: '🎯', title: 'SwanAI Director',
    summary: 'SwanAI is your production director — strategic, decisive advice on what to do RIGHT NOW to maximize your stream.',
    steps: [
      'SWANAI tab → quick prompts: VIEWERS, REVENUE, COLLAB, CLIP, DROP',
      'Ask "What should I do right now?" with current viewer count as context',
      'SwanAI knows your RTMP setup, VPS, viewer count, and live status',
      'Type a custom situation for bespoke director advice',
      'Acts like an experienced live stream producer in your ear'
    ],
    pro: 'Use SwanAI when viewer count drops — it diagnoses the issue and gives a specific action to recover within the next 2 minutes.',
    tab: '🎯 SWANAI',
  },
  {
    id: 't32', cat: 'AI', icon: '⚙', title: 'N8N Workflow Automation',
    summary: 'Connect SeeWhy LIVE events to any external service — email, Discord, Sheets, Zapier, and more.',
    steps: [
      'N8N tab shows active automation workflows',
      'Trigger types: stream start, gift received, new subscriber, viewer milestone',
      'Actions: post to Discord, update Google Sheets, send email, trigger webhook',
      'Combine triggers + actions to build event-driven automation',
      'Workflows run server-side — no browser required'
    ],
    pro: 'Auto-post to Discord every time someone sends a Diamond or Trophy gift — turns each big moment into a community alert.',
    tab: '⚙ N8N',
  },

  // ── TECH ──────────────────────────────────────────────────────────────────
  {
    id: 't33', cat: 'TECH', icon: '🔑', title: 'Stream Keys & Vault',
    summary: 'Your RTMP stream key is encrypted at rest and never exposed to viewers or logs.',
    steps: [
      'KEYS tab shows your active stream key (creator-only view)',
      'Keys are AES-256-GCM encrypted in the SQLite vault',
      'Rotate your key anytime — old key deactivates immediately',
      'Add destination keys for FANOUT (YouTube, TikTok, etc.) separately'
    ],
    pro: 'Rotate your stream key after every major event as a security hygiene practice — takes 5 seconds.',
    tab: '🔑 KEYS',
  },
  {
    id: 't34', cat: 'TECH', icon: '📤', title: 'Upload & Import Content',
    summary: 'Upload videos, audio, and images directly into SeeWhy LIVE for overlays, VOD, and clips.',
    steps: [
      'UPLOAD tab → drag and drop or browse for files',
      'Supported: MP4, MOV, WebM, MP3, PNG, JPG, SVG',
      'Uploaded content is available in OVERLAY, VOD LIBRARY, and CLIPS',
      'Max file size: 50MB per upload'
    ],
    pro: 'Pre-upload your intro and outro videos — trigger them from OVERLAY as browser sources for a polished broadcast feel.',
    tab: '📤 UPLOAD',
  },
  {
    id: 't35', cat: 'TECH', icon: '🔌', title: 'MCP — Model Context Protocol',
    summary: 'Extend SeeWhy LIVE with external AI tools and data sources via the MCP integration layer.',
    steps: [
      'MCP tab shows connected tool servers',
      'Add an MCP server URL to plug in any Claude-compatible tool',
      'Tools appear as callable actions in AURA and SwanAI',
      'Use MCP to connect real-time sports scores, weather, custom databases'
    ],
    pro: 'Connect a domino tournament stats MCP server so AURA can cite live match data mid-stream without you looking anything up.',
    tab: '🔌 MCP',
  },
  {
    id: 't36', cat: 'TECH', icon: '⚙️', title: 'InsForge — System Monitor',
    summary: 'Real-time health dashboard for all server-side systems: database, RTMP, mediasoup, Stripe, AI bridge, nginx, PM2.',
    steps: [
      'FORGE tab shows live status for 10 subsystems',
      'Each service shows: status (healthy/warn/error), current value, uptime',
      'Click any service for details and recent log entries',
      'FORGE auto-alerts via toast if any service degrades',
      'Use FORGE to diagnose stream issues before calling support'
    ],
    pro: 'If your stream drops, check FORGE first — RTMP or mediasoup status will show exactly where the break is.',
    tab: '⚙️ FORGE',
  },
  {
    id: 't37', cat: 'TECH', icon: '🌍', title: 'HLS Playback URL',
    summary: 'Every active RTMP stream generates a public HLS URL for embedding in any player or website.',
    steps: [
      'While live, your HLS URL is: https://2.24.194.112/hls/<stream-key>.m3u8',
      'Use this URL in any HLS-compatible player (hls.js, Video.js, VLC)',
      'Embed your stream on any website with a <video> tag + hls.js',
      'HLS segments update every 2 seconds with 30s playlist depth',
      'Latency: ~6-10s end-to-end on a good connection'
    ],
    pro: 'Use the HLS URL to embed your stream on your own website while it simultaneously plays on SeeWhy LIVE.',
    tab: 'rtmp → /hls/',
  },
];

var CREATOR_CHECKLIST = [
  { id: 'c1', text: 'Profile setup — avatar, bio, display name', tab: 'SETTINGS' },
  { id: 'c2', text: 'OBS configured with RTMP server + stream key', tab: 'ROOM' },
  { id: 'c3', text: 'Guardian AI enabled and word filters set', tab: 'GUARDIAN' },
  { id: 'c4', text: 'SwanyBot rules on (greet, gift hype, spam guard)', tab: 'SWANYBOT' },
  { id: 'c5', text: 'AURA AI co-host activated', tab: 'AURA' },
  { id: 'c6', text: 'Schedule at least one upcoming event', tab: 'SCHED' },
  { id: 'c7', text: 'Merch store has at least one item live', tab: 'MERCH' },
  { id: 'c8', text: 'Direct Pay links configured (CashApp / Venmo)', tab: 'DIRECT PAY' },
  { id: 'c9', text: 'At least one FANOUT destination set up', tab: 'FANOUT' },
  { id: 'c10', text: 'App installed as PWA on phone', tab: 'Header' },
];

export default function CreatorTipsTab({ addToast, username }) {
  var [activeCat,   setActiveCat]   = useState('ALL');
  var [search,      setSearch]      = useState('');
  var [expanded,    setExpanded]    = useState({});
  var [checked,     setChecked]     = useState(function() {
    try { var s = localStorage.getItem('sw_checklist'); if (s) return JSON.parse(s); } catch(e) {}
    return {};
  });
  var [activeView,  setActiveView]  = useState('tips');  // 'tips' | 'checklist'

  function toggleExpand(id) {
    setExpanded(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = !prev[id];
      return next;
    });
  }

  function toggleCheck(id) {
    setChecked(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = !prev[id];
      try { localStorage.setItem('sw_checklist', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }

  var filtered = useMemo(function() {
    var q = search.toLowerCase();
    return TIPS.filter(function(t) {
      var catMatch = activeCat === 'ALL' || t.cat === activeCat;
      var searchMatch = !q
        || t.title.toLowerCase().indexOf(q) !== -1
        || t.summary.toLowerCase().indexOf(q) !== -1
        || t.cat.toLowerCase().indexOf(q) !== -1;
      return catMatch && searchMatch;
    });
  }, [activeCat, search]);

  var doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#07050A' }}>

      {/* Header */}
      <div style={{ padding: '14px 14px 0 14px', flexShrink: 0 }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.3),rgba(201,168,76,.1))', border: '1px solid rgba(201,168,76,.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AvatarPortrait username={username || 'creator'} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: '#E8C46A', letterSpacing: 3, lineHeight: 1 }}>CREATOR GUIDE</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9A90AA', marginTop: 2 }}>{'37 features · ' + TIPS.length + ' tips · ' + doneCount + '/' + CREATOR_CHECKLIST.length + ' launch checklist'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button onClick={function() { setActiveView('tips'); }} style={{ padding: '5px 12px', background: activeView === 'tips' ? 'rgba(201,168,76,.2)' : 'rgba(22,16,32,.6)', border: '1px solid ' + (activeView === 'tips' ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.07)'), borderRadius: 6, color: activeView === 'tips' ? '#E8C46A' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>TIPS</button>
            <button onClick={function() { setActiveView('checklist'); }} style={{ padding: '5px 12px', background: activeView === 'checklist' ? 'rgba(0,201,167,.15)' : 'rgba(22,16,32,.6)', border: '1px solid ' + (activeView === 'checklist' ? 'rgba(0,201,167,.4)' : 'rgba(255,255,255,.07)'), borderRadius: 6, color: activeView === 'checklist' ? '#00C9A7' : '#7A6F90', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}>CHECKLIST</button>
          </div>
        </div>

        {activeView === 'tips' && (
          <div>
            {/* Search */}
            <input
              value={search}
              onChange={function(e) { setSearch(e.target.value); }}
              placeholder="Search tips, features, tabs..."
              style={{ width: '100%', background: 'rgba(22,16,32,.8)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '9px 12px', color: '#EDE8F5', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
            />
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 10, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {CATS.map(function(cat) {
                var isA = activeCat === cat;
                var col = CAT_COLORS[cat] || '#7A6F90';
                return (
                  <button key={cat} onClick={function() { setActiveCat(cat); }}
                    style={{ flexShrink: 0, padding: '4px 10px', background: isA ? col + '22' : 'rgba(22,16,32,.6)', border: '1px solid ' + (isA ? col : 'rgba(255,255,255,.07)'), borderRadius: 20, color: isA ? col : '#7A6F90', fontFamily: "'DM Mono',monospace", fontSize: 8, cursor: 'pointer', letterSpacing: 1, transition: 'all .12s' }}>
                    {cat}
                  </button>
                );
              })}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#4A4060', marginBottom: 8, letterSpacing: 1 }}>{filtered.length} tip{filtered.length !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 80px 14px' }}>

        {/* ── CHECKLIST VIEW ── */}
        {activeView === 'checklist' && (
          <div>
            <div style={{ background: 'rgba(0,201,167,.06)', border: '1px solid rgba(0,201,167,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: '#00C9A7', letterSpacing: 2 }}>LAUNCH CHECKLIST</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', marginTop: 2 }}>Complete these before your first major stream</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#00C9A7', lineHeight: 1 }}>{doneCount}/{CREATOR_CHECKLIST.length}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7A6F90' }}>DONE</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 5, background: 'rgba(22,16,32,.8)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: (doneCount / CREATOR_CHECKLIST.length * 100) + '%', height: '100%', background: 'linear-gradient(90deg,#00C9A7,#00DEC0)', borderRadius: 3, transition: 'width .4s ease' }} />
            </div>
            {CREATOR_CHECKLIST.map(function(item) {
              var isDone = checked[item.id];
              return (
                <div key={item.id}
                  onClick={function() { toggleCheck(item.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: isDone ? 'rgba(0,201,167,.06)' : 'rgba(22,16,32,.6)', border: '1px solid ' + (isDone ? 'rgba(0,201,167,.25)' : 'rgba(255,255,255,.06)'), borderRadius: 10, padding: '12px 14px', marginBottom: 7, cursor: 'pointer', transition: 'all .15s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: isDone ? '#00C9A7' : 'rgba(22,16,32,.8)', border: '1.5px solid ' + (isDone ? '#00C9A7' : 'rgba(255,255,255,.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                    {isDone && <span style={{ color: '#07050A', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: isDone ? '#7A6F90' : '#EDE8F5', textDecoration: isDone ? 'line-through' : 'none' }}>{item.text}</div>
                  </div>
                  <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 4, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', flexShrink: 0 }}>{item.tab}</div>
                </div>
              );
            })}
            {doneCount === CREATOR_CHECKLIST.length && (
              <div style={{ background: 'linear-gradient(135deg,rgba(128,0,32,.3),rgba(201,168,76,.1))', border: '1px solid rgba(201,168,76,.4)', borderRadius: 12, padding: '16px', textAlign: 'center', marginTop: 10 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#E8C46A', letterSpacing: 3 }}>LAUNCH READY</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#9A90AA', marginTop: 4 }}>You\'re fully set up. Go live and build your audience.</div>
              </div>
            )}
          </div>
        )}

        {/* ── TIPS VIEW ── */}
        {activeView === 'tips' && filtered.map(function(tip) {
          var isOpen = expanded[tip.id];
          var col    = CAT_COLORS[tip.cat] || '#7A6F90';
          return (
            <div key={tip.id} style={{ background: 'rgba(22,16,32,.7)', border: '1px solid ' + (isOpen ? col + '44' : 'rgba(255,255,255,.06)'), borderRadius: 10, marginBottom: 8, overflow: 'hidden', transition: 'border .15s' }}>
              {/* Card header */}
              <div
                onClick={function() { toggleExpand(tip.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: col + '18', border: '1px solid ' + col + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{tip.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#EDE8F5', lineHeight: 1 }}>{tip.title}</div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: col, background: col + '18', border: '1px solid ' + col + '33', borderRadius: 3, padding: '1px 5px', flexShrink: 0, letterSpacing: 0.5 }}>{tip.cat}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#7A6F90', lineHeight: 1.4 }}>{tip.summary}</div>
                </div>
                <div style={{ color: '#4A4060', fontSize: 14, flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</div>
              </div>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ padding: '0 12px 12px 58px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ paddingTop: 10 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: col, letterSpacing: 2, marginBottom: 7 }}>HOW TO USE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                      {tip.steps.map(function(step, i) {
                        return (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: col + '22', border: '1px solid ' + col + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 7, color: col, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#C4BDD4', lineHeight: 1.4 }}>{step}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 7, padding: '7px 10px', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#C9A84C', letterSpacing: 1 }}>★ PRO TIP — </span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#C9A84C' }}>{tip.pro}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#4A4060' }}>TAB:</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: '#00C9A7', background: 'rgba(0,201,167,.08)', border: '1px solid rgba(0,201,167,.2)', borderRadius: 4, padding: '2px 7px' }}>{tip.tab}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {activeView === 'tips' && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#4A4060' }}>
            No tips match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
