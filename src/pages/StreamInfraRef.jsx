import { useState } from "react";

const TABS = [
  { id: "rtmp",      icon: "📡", label: "RTMP" },
  { id: "webrtc",   icon: "🌐", label: "WebRTC" },
  { id: "webhooks", icon: "🔔", label: "Webhooks" },
  { id: "connect",  icon: "🔌", label: "Connect" },
  { id: "nginx",    icon: "⚙️", label: "Nginx/VPS" },
  { id: "supabase", icon: "🗄️", label: "Supabase" },
  { id: "env",      icon: "🔑", label: ".env" },
  { id: "status",   icon: "🚦", label: "Deploy Status" },
];

const Badge = ({ type, children }) => {
  const styles = {
    live:     "bg-green-500/20 text-green-300 border border-green-500/40",
    pending:  "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
    critical: "bg-red-500/20 text-red-300 border border-red-500/40",
    info:     "bg-blue-500/20 text-blue-300 border border-blue-500/40",
    gold:     "bg-yellow-600/20 text-yellow-200 border border-yellow-600/40",
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-bold ${styles[type] || styles.info}`}>
      {children}
    </span>
  );
};

const Code = ({ children, copy = true }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative flex items-center gap-2 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-emerald-300 my-1">
      <span className="flex-1 break-all">{children}</span>
      {copy && (
        <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white text-[10px] transition-all ml-2 shrink-0">
          {copied ? "✓" : "copy"}
        </button>
      )}
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40">{title}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
    {children}
  </div>
);

const Row = ({ label, value, badge, pending }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5">
    <span className="text-white/50 text-xs font-mono shrink-0 w-44">{label}</span>
    <div className="flex items-center gap-2 flex-1 flex-wrap justify-end">
      {pending ? (
        <Badge type="pending">⚠ pending</Badge>
      ) : (
        <span className="text-white/90 text-xs font-mono text-right break-all">{value}</span>
      )}
      {badge && <Badge type={badge.type}>{badge.label}</Badge>}
    </div>
  </div>
);

const CheckItem = ({ done, children }) => (
  <div className={`flex items-start gap-3 py-1.5 text-sm ${done ? "text-white/40 line-through" : "text-white/80"}`}>
    <span className={`mt-0.5 text-xs shrink-0 ${done ? "text-green-400" : "text-white/30"}`}>{done ? "✓" : "○"}</span>
    {children}
  </div>
);

// ── RTMP ──────────────────────────────────────────────────────────────────────
function RTMPTab() {
  return (
    <div>
      <Section title="OBS Encoder Settings">
        <Row label="Service"             value="Custom..." badge={{ type: "info", label: "OBS" }} />
        <Row label="Server (Ingest URL)" value="rtmp://seewhylive.online/live" badge={{ type: "live", label: "active" }} />
        <Row label="Stream Key Format"   value="sw_{username}live" />
        <Row label="Encoder"             value="x264 or NVENC H.264" />
        <Row label="Rate Control"        value="CBR" />
        <Row label="Bitrate"             value="4500–6000 Kbps (1080p)" />
        <Row label="Keyframe Interval"   value="2 seconds (forced)" />
        <Row label="CPU Usage Preset"    value="veryfast" />
        <Row label="Profile"             value="high" />
        <Row label="Audio Bitrate"       value="160 Kbps" />
        <Row label="Audio Sample Rate"   value="44.1 kHz" />
      </Section>

      <Section title="MediaMTX Config">
        <Row label="Config Path"         value="/etc/mediamtx/mediamtx.yml" />
        <Row label="RTMP Port"           value=":1935" badge={{ type: "live", label: "open" }} />
        <Row label="HLS Port"            value=":8888" badge={{ type: "live", label: "open" }} />
        <Row label="API Port"            value=":9997" />
        <Row label="HLS Segment Duration" value="2s" />
        <Row label="HLS Playlist Length" value="6 segments" />
        <Row label="PM2 Process"         value="mediamtx" badge={{ type: "live", label: "running" }} />
      </Section>

      <Section title="Stream Key API Endpoints">
        <div className="text-xs text-white/50 mb-2">Base: https://seewhylive.online/api</div>
        <Code>POST /stream/key/generate</Code>
        <Code>GET  /stream/key/:userId</Code>
        <Code>POST /stream/key/rotate</Code>
        <Code>POST /stream/key/validate</Code>
      </Section>

      <Section title="Multi-Platform Fanout (FFmpeg)">
        {[
          { name: "YouTube Live",  url: "rtmp://a.rtmp.youtube.com/live2/{key}",                        badge: "live" },
          { name: "Twitch",        url: "rtmp://live.twitch.tv/live/{key}",                              badge: "live" },
          { name: "Facebook Live", url: "rtmps://live-api-s.facebook.com:443/rtmp/{key}",               badge: "live" },
          { name: "X (Twitter)",   url: "rtmp://ingest.pscp.tv:80/x/{key}",                             badge: "live" },
          { name: "Kick.com",      url: "rtmp://fa723fc1b171.global-contribute.live-video.net/app/{key}", badge: "live" },
          { name: "LinkedIn Live", url: "rtmp://4.rtmp.linkedin.com/live/{key}",                        badge: "live" },
          { name: "TikTok Live",   url: "rtmp://push.tiktokv.com/live/{key}",                           badge: "live" },
        ].map((p) => (
          <div key={p.name} className="flex items-center gap-3 py-2 border-b border-white/5">
            <Badge type={p.badge}>{p.badge}</Badge>
            <span className="text-white/70 text-xs w-32 shrink-0">{p.name}</span>
            <span className="text-emerald-300/70 text-xs font-mono break-all">{p.url}</span>
          </div>
        ))}
        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded p-3 text-xs text-yellow-200">
          ⚠ YouTube Data API v3 key required for auto-stream-title injection — <Badge type="pending">pending</Badge>
        </div>
      </Section>
    </div>
  );
}

// ── WebRTC ────────────────────────────────────────────────────────────────────
function WebRTCTab() {
  return (
    <div>
      <Section title="MediaSoup SFU Config">
        <Row label="Process File"    value="/var/www/seewhylive/backend/mediasoup.js" />
        <Row label="Announced IP"    value="2.24.194.112" badge={{ type: "live", label: "production" }} />
        <Row label="RTC Min Port"    value="10000" />
        <Row label="RTC Max Port"    value="10100" />
        <Row label="Workers"         value="os.cpus().length" />
        <Row label="Video Codec"     value="VP8 + H.264" />
        <Row label="DTLS State"      value="connected (confirmed)" badge={{ type: "live", label: "✓" }} />
      </Section>

      <Section title="WHIP / WHEP Endpoints">
        <div className="text-xs text-white/50 mb-2">Browser-native ingest/egress</div>
        <Code>{"POST https://seewhylive.online/whip/{streamKey}"}</Code>
        <Code>{"GET  https://seewhylive.online/whep/{streamKey}"}</Code>
      </Section>

      <Section title="LiveKit Credentials (VPS .env)">
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-3 text-xs text-red-200">
          🔴 All 3 LiveKit keys are pending — add to /var/www/seewhylive/.env and ecosystem.config.js
        </div>
        <Row label="LIVEKIT_URL"        pending />
        <Row label="LIVEKIT_API_KEY"    pending />
        <Row label="LIVEKIT_API_SECRET" pending />
        <div className="mt-2 text-xs text-white/40">Token gen: livekit-server-sdk → AccessToken → addGrant → toJwt()</div>
      </Section>

      <Section title="Stage Roles & Permissions">
        {[
          { role: "Host",        perms: "publish video/audio, manage guests, start/stop stream, Guardian override" },
          { role: "Co-Host",     perms: "publish video/audio, invite guests, moderate chat" },
          { role: "Guest",       perms: "publish video/audio when granted, chat" },
          { role: "Viewer",      perms: "subscribe only, chat (post-paywall)" },
          { role: "Guardian AI", perms: "read-only socket observer, moderation emit" },
        ].map((s) => (
          <div key={s.role} className="py-2 border-b border-white/5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[#D4AF37] text-xs font-mono font-bold">{s.role}</span>
            </div>
            <p className="text-white/50 text-xs">{s.perms}</p>
          </div>
        ))}
      </Section>

      <Section title="7-Step User Connection Flow">
        {[
          "User authenticates via Supabase (JWT issued)",
          "Frontend requests LiveKit token from /api/livekit/token",
          "Backend validates JWT, generates AccessToken with role grants",
          "Browser connects to LiveKit room via SDK",
          "MediaSoup SFU negotiates ICE/DTLS",
          "Viewer hits Golden Paywall at 120s (PREVIEW_SECS)",
          "Post-payment: full room subscription granted via socket event",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 py-2 border-b border-white/5">
            <span className="text-[#800020] font-mono text-xs font-bold shrink-0 w-5">{i + 1}</span>
            <span className="text-white/70 text-xs">{step}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ── Webhooks ──────────────────────────────────────────────────────────────────
function WebhooksTab() {
  return (
    <div>
      <Section title="Stripe Webhook">
        <Row label="Endpoint"               value="https://seewhylive.online/api/webhooks/stripe" badge={{ type: "live", label: "registered" }} />
        <Row label="STRIPE_WEBHOOK_SECRET"  pending />
        <Row label="Signing"                value="Stripe-Signature header, 300s tolerance" />
        <div className="mt-3 text-xs text-white/40 mb-2 font-mono uppercase tracking-wider">Wired Events → 90/10 Split Logic</div>
        {[
          "payment_intent.succeeded",
          "payment_intent.payment_failed",
          "customer.subscription.created",
          "customer.subscription.updated",
          "customer.subscription.deleted",
          "account.updated (Connect)",
          "transfer.created",
          "charge.refunded",
        ].map((ev) => (
          <div key={ev} className="flex items-center gap-3 py-1.5 border-b border-white/5">
            <Badge type="live">wired</Badge>
            <span className="text-emerald-300 text-xs font-mono">{ev}</span>
          </div>
        ))}
        <div className="mt-3 bg-black/30 rounded p-3 text-xs text-white/50 font-mono">
          CREATOR_SHARE = 0.90 · PLATFORM_FEE = 0.10<br />
          Math.floor() enforced · 4-layer audit
        </div>
      </Section>

      <Section title="n8n Workflow Router">
        <Row label="n8n Instance"   value="techmunity.app.n8n.cloud" badge={{ type: "live", label: "running" }} />
        <Row label="Webhook Base"   value="https://techmunity.app.n8n.cloud/webhook/" />
        <div className="mt-3 space-y-2">
          {[
            { chain: "stream.started → Discord/Slack notify + YouTube title inject", status: "live" },
            { chain: "payment.success → Supabase update + Stripe transfer",          status: "live" },
            { chain: "guardian.ban → socket emit + DB log + admin alert",             status: "live" },
            { chain: "subscription.created → welcome email sequence",                status: "pending" },
            { chain: "stream.ended → VOD processing + clip generation",              status: "pending" },
            { chain: "tip.received → overlay trigger + leaderboard update",          status: "live" },
          ].map((w) => (
            <div key={w.chain} className="flex items-start gap-2 py-1.5 border-b border-white/5">
              <Badge type={w.status}>{w.status}</Badge>
              <span className="text-white/60 text-xs">{w.chain}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Socket.IO Event Map">
        {[
          { event: "stream:start",      dir: "server→client", desc: "Broadcast start to all room members" },
          { event: "stream:end",        dir: "server→client", desc: "Cleanup, paywall reset" },
          { event: "tip:received",      dir: "server→client", desc: "Overlay trigger + amount" },
          { event: "guardian:action",   dir: "server→client", desc: "Ban/warn/flag payload" },
          { event: "aura:message",      dir: "server→client", desc: "AURA AI co-host response" },
          { event: "watchparty:sync",   dir: "server→client", desc: "Sub-300ms playback sync" },
          { event: "panel:invite",      dir: "client→server", desc: "Host invites guest to panel" },
        ].map((e) => (
          <div key={e.event} className="py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37] font-mono text-xs">{e.event}</span>
              <Badge type="info">{e.dir}</Badge>
            </div>
            <p className="text-white/40 text-xs mt-0.5">{e.desc}</p>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ── Connect ───────────────────────────────────────────────────────────────────
function ConnectTab() {
  const [creatorDone, setCreatorDone] = useState(Array(9).fill(false));
  const creatorSteps = [
    "Confirm Supabase auth is live (test login at seewhylive.online)",
    "Verify OBS stream key: sw_{your_username}live",
    "Set OBS server to rtmp://seewhylive.online/live",
    "Confirm Stripe Connect account onboarded (acct_1Svbvv2N0KWn00Qu)",
    "Set STRIPE_WEBHOOK_SECRET in .env + ecosystem.config.js",
    "Test Golden Paywall at 120s preview with a viewer account",
    "Activate n8n stream.started workflow",
    "Verify MediaMTX is running: pm2 status mediamtx",
    "Do a 60s test stream — confirm HLS playback at /live/{streamKey}/index.m3u8",
  ];

  return (
    <div>
      <Section title="Creator Go-Live Checklist">
        <div className="text-xs text-white/40 mb-3">Tap to mark complete</div>
        {creatorSteps.map((step, i) => (
          <div key={i} onClick={() => setCreatorDone((d) => d.map((v, j) => (j === i ? !v : v)))} className="cursor-pointer">
            <CheckItem done={creatorDone[i]}>{step}</CheckItem>
          </div>
        ))}
        <div className="mt-2 text-xs text-[#D4AF37] font-mono">{creatorDone.filter(Boolean).length} / 9 complete</div>
      </Section>

      <Section title="Monetization Tiers">
        {[
          { tier: "Bronze",      price: "$1/mo",       perks: "Chat access, basic emotes" },
          { tier: "Silver",      price: "$5/mo",       perks: "HD stream, no ads, loyalty badge" },
          { tier: "Gold",        price: "$15/mo",      perks: "4K stream, co-watch access, AURA chat priority" },
          { tier: "Tip",         price: "Any amount",  perks: "Overlay alert, leaderboard" },
          { tier: "Watch Party", price: "Per event",   perks: "Sync playback, group chat room" },
        ].map((t) => (
          <div key={t.tier} className="flex items-center gap-4 py-2 border-b border-white/5">
            <span className="text-[#D4AF37] font-mono text-xs font-bold w-16">{t.tier}</span>
            <span className="text-white font-mono text-xs w-20">{t.price}</span>
            <span className="text-white/50 text-xs">{t.perks}</span>
          </div>
        ))}
      </Section>

      <Section title="Auth Endpoints">
        <Code>POST /api/auth/register</Code>
        <Code>POST /api/auth/login</Code>
        <Code>POST /api/auth/logout</Code>
        <Code>GET  /api/auth/me</Code>
        <Code>POST /api/auth/refresh</Code>
        <Row label="Supabase Project" value="rxlgywvfclyjdfyvfvyc" />
        <Row label="Auth Provider"    value="Supabase GoTrue + JWT" />
      </Section>

      <Section title="OBS WebSocket Bridge">
        <Row label="Plugin"       value="obs-websocket v5.x" />
        <Row label="Default Port" value="4455" />
        <Code>POST /api/obs/scene-switch</Code>
        <Code>POST /api/obs/stream-start</Code>
        <Code>POST /api/obs/stream-stop</Code>
        <Code>GET  /api/obs/status</Code>
      </Section>

      <Section title="PWA Install">
        <Row label="Manifest"        value="/public/manifest.json" badge={{ type: "live", label: "present" }} />
        <Row label="Service Worker"  value="/public/sw.js" />
        <Row label="Install Prompt"  value="beforeinstallprompt event captured" />
        <Row label="iOS Install"     value="Add to Home Screen via Safari Share" />
      </Section>
    </div>
  );
}

// ── Nginx/VPS ─────────────────────────────────────────────────────────────────
function NginxTab() {
  return (
    <div>
      <Section title="VPS Info">
        <Row label="Production VPS" value="2.24.194.112 / srv1581658.hstgr.cloud" badge={{ type: "live", label: "production" }} />
        <Row label="n8n VPS"        value="2.24.198.112 / srv1587098.hstgr.cloud" badge={{ type: "live", label: "automation" }} />
        <Row label="Provider"       value="Hostinger" />
        <Row label="OS"             value="Ubuntu 24" />
        <Row label="Web Root"       value="/var/www/seewhylive/" />
        <Row label="Frontend Build" value="/var/www/seewhylive/frontend/dist/" />
        <Row label="Backend"        value="/var/www/seewhylive/backend/" />
        <Row label="PM2 Config"     value="/var/www/seewhylive/ecosystem.config.js" />
        <Row label="Stable Backup"  value="App.jsx.bak.stable_20260505_1632" />
      </Section>

      <Section title="Nginx Config">
        <Row label="Config File"         value="/etc/nginx/sites-available/seewhylive" />
        <Row label="Symlink"             value="/etc/nginx/sites-enabled/seewhylive" />
        <Row label="SSL Cert"            value="/etc/letsencrypt/live/seewhylive.online/" badge={{ type: "live", label: "certbot" }} />
        <Row label="HTTPS Port"          value="443 (TLS 1.2/1.3)" />
        <Row label="HTTP Port"           value="80 → 301 redirect to HTTPS" />
        <Row label="Proxy Backend"       value="proxy_pass http://localhost:3000" />
        <Row label="Proxy MediaMTX HLS"  value="proxy_pass http://localhost:8888" />
        <Row label="Static Serve"        value="root /var/www/seewhylive/frontend/dist" />
        <Row label="try_files"           value="$uri $uri/ /index.html (SPA)" />
      </Section>

      <Section title="Nginx Key Directives">
        <Code copy={false}>{"client_max_body_size 50M;"}</Code>
        <Code copy={false}>{"proxy_read_timeout 3600s;  # for long streams"}</Code>
        <Code copy={false}>{"proxy_buffering off;       # for HLS/SSE"}</Code>
        <Code copy={false}>{"add_header X-Frame-Options SAMEORIGIN;"}</Code>
        <Code copy={false}>{"add_header X-Content-Type-Options nosniff;"}</Code>
      </Section>

      <Section title="PM2 Processes">
        {[
          { name: "seewhylive-backend",  script: "index.js",               port: 3000,         status: "live" },
          { name: "mediamtx",            script: "mediamtx binary",         port: "1935/8888/9997", status: "live" },
          { name: "seewhylive-frontend", script: "vite preview (or nginx)", port: 5173,         status: "live" },
        ].map((p) => (
          <div key={p.name} className="py-2 border-b border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Badge type={p.status}>{p.status}</Badge>
              <span className="text-[#D4AF37] font-mono text-xs font-bold">{p.name}</span>
            </div>
            <div className="flex gap-4 text-white/40 text-xs">
              <span>script: {p.script}</span>
              <span>port: {p.port}</span>
            </div>
          </div>
        ))}
        <div className="mt-2 space-y-1">
          <Code>pm2 status</Code>
          <Code>pm2 restart all</Code>
          <Code>pm2 logs seewhylive-backend --lines 50</Code>
          <Code>pm2 save && pm2 startup</Code>
        </div>
      </Section>

      <Section title="Firewall (UFW)">
        <Row label="SSH"            value="22/tcp — ALLOW"   badge={{ type: "live", label: "open" }} />
        <Row label="HTTP"           value="80/tcp — ALLOW"   badge={{ type: "live", label: "open" }} />
        <Row label="HTTPS"          value="443/tcp — ALLOW"  badge={{ type: "live", label: "open" }} />
        <Row label="RTMP"           value="1935/tcp — ALLOW" badge={{ type: "live", label: "open" }} />
        <Row label="MediaMTX HLS"   value="8888/tcp — ALLOW" badge={{ type: "live", label: "open" }} />
        <Row label="RTC UDP"        value="10000–10100/udp — ALLOW" badge={{ type: "live", label: "open" }} />
      </Section>
    </div>
  );
}

// ── Supabase ──────────────────────────────────────────────────────────────────
function SupabaseTab() {
  return (
    <div>
      <Section title="Project Info">
        <Row label="Project ID" value="rxlgywvfclyjdfyvfvyc" />
        <Row label="Region"     value="us-east-1" />
        <Row label="Auth"       value="GoTrue (JWT)" badge={{ type: "live", label: "active" }} />
        <Row label="Realtime"   value="Enabled"     badge={{ type: "live", label: "active" }} />
        <Row label="Storage"    value="Enabled (avatars, VODs)" />
      </Section>

      <Section title="Core Tables">
        {[
          { table: "users",            desc: "Extended auth profile",   cols: ["id (uuid, PK)", "username", "display_name", "avatar_url", "stripe_account_id", "created_at"] },
          { table: "streams",          desc: "Stream sessions",         cols: ["id", "user_id (FK)", "stream_key", "title", "status (live/ended)", "viewer_count", "started_at", "ended_at"] },
          { table: "subscriptions",    desc: "Tier memberships",        cols: ["id", "subscriber_id", "creator_id", "tier (bronze/silver/gold)", "stripe_sub_id", "status", "current_period_end"] },
          { table: "tips",             desc: "One-time payments",       cols: ["id", "sender_id", "creator_id", "stream_id", "amount_cents", "message", "stripe_pi_id", "created_at"] },
          { table: "fee_ledger",       desc: "90/10 audit log (immutable)", cols: ["id", "transaction_id", "gross_cents", "creator_cents", "platform_cents", "stripe_transfer_id", "verified_at"] },
          { table: "guardian_events",  desc: "Moderation log",          cols: ["id", "stream_id", "user_id", "action (ban/warn/flag)", "score", "reason", "created_at"] },
          { table: "watch_parties",    desc: "Sync sessions",           cols: ["id", "stream_id", "host_id", "max_members (20)", "sync_offset_ms", "status", "created_at"] },
        ].map((t) => (
          <div key={t.table} className="mb-4 bg-black/30 rounded p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#D4AF37] font-mono text-xs font-bold">{t.table}</span>
              <span className="text-white/30 text-xs">{t.desc}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.cols.map((c) => (
                <span key={c} className="text-emerald-300/70 text-[10px] font-mono bg-emerald-900/20 px-1.5 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Database Triggers">
        {[
          { trigger: "on_payment_success",    action: "Insert fee_ledger row, verify 90/10 split" },
          { trigger: "on_subscription_change", action: "Update user tier, emit socket event via pg_notify" },
          { trigger: "on_stream_end",          action: "Calculate final revenue, trigger VOD processing webhook" },
          { trigger: "on_guardian_ban",        action: "Soft-delete user messages, update guardian_events" },
        ].map((t) => (
          <div key={t.trigger} className="py-2 border-b border-white/5">
            <span className="text-[#800020] font-mono text-xs font-bold">{t.trigger}</span>
            <p className="text-white/50 text-xs mt-0.5">{t.action}</p>
          </div>
        ))}
      </Section>

      <Section title="RLS Policies">
        <Row label="users"           value="SELECT: own row only · UPDATE: own row only" />
        <Row label="streams"         value="SELECT: public · INSERT/UPDATE: owner only" />
        <Row label="subscriptions"   value="SELECT: subscriber or creator · INSERT: subscriber" />
        <Row label="fee_ledger"      value="SELECT: admin only · INSERT: trigger only (no direct)" />
        <Row label="guardian_events" value="SELECT: admin/creator · INSERT: service role only" />
      </Section>
    </div>
  );
}

// ── .env ──────────────────────────────────────────────────────────────────────
function EnvTab() {
  const envVars = [
    { key: "NODE_ENV",                val: "production",                                         status: "live" },
    { key: "PORT",                    val: "3000",                                               status: "live" },
    { key: "FRONTEND_URL",            val: "https://seewhylive.online",                          status: "live" },
    { key: "SUPABASE_URL",            val: "https://rxlgywvfclyjdfyvfvyc.supabase.co",          status: "live" },
    { key: "SUPABASE_ANON_KEY",       val: "eyJ... (from Supabase dashboard)",                  status: "live" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", val: "eyJ... (service role — keep secret)",             status: "live" },
    { key: "STRIPE_PUBLISHABLE_KEY",  val: "pk_live_... (confirmed active)",                    status: "live" },
    { key: "STRIPE_SECRET_KEY",       val: "sk_live_... ⚠ ROTATE if exposed",                  status: "critical" },
    { key: "STRIPE_WEBHOOK_SECRET",   val: "whsec_... (get from Stripe dashboard)",             status: "pending" },
    { key: "STRIPE_CONNECT_ACCOUNT",  val: "acct_1Svbvv2N0KWn00Qu",                            status: "live" },
    { key: "ANTHROPIC_API_KEY",       val: "sk-ant-... (rotate at console.anthropic.com)",      status: "pending" },
    { key: "LIVEKIT_URL",             val: "wss://your-livekit-instance",                       status: "pending" },
    { key: "LIVEKIT_API_KEY",         val: "API...",                                            status: "pending" },
    { key: "LIVEKIT_API_SECRET",      val: "...",                                               status: "pending" },
    { key: "YOUTUBE_DATA_API_KEY",    val: "AIza...",                                           status: "pending" },
    { key: "MEDIAMTX_API_URL",        val: "http://localhost:9997",                             status: "live" },
    { key: "JWT_SECRET",              val: "32+ char random string",                            status: "live" },
    { key: "ENCRYPTION_KEY",          val: "AES-256 key for VaultPro",                         status: "live" },
    { key: "N8N_WEBHOOK_URL",         val: "https://techmunity.app.n8n.cloud/webhook/",        status: "live" },
    { key: "SOCKET_CORS_ORIGIN",      val: "https://seewhylive.online",                        status: "live" },
  ];

  const statusCounts = {
    live:     envVars.filter((v) => v.status === "live").length,
    pending:  envVars.filter((v) => v.status === "pending").length,
    critical: envVars.filter((v) => v.status === "critical").length,
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-center">
          <div className="text-2xl font-mono text-green-400">{statusCounts.live}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider">Live</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-center">
          <div className="text-2xl font-mono text-yellow-400">{statusCounts.pending}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider">Pending</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
          <div className="text-2xl font-mono text-red-400">{statusCounts.critical}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider">Critical</div>
        </div>
      </div>

      <Section title="All Environment Variables">
        <div className="text-xs text-white/30 mb-3">Files: /var/www/seewhylive/.env · ecosystem.config.js (env block)</div>
        {envVars.map((v) => (
          <div key={v.key} className="flex items-start justify-between gap-3 py-2 border-b border-white/5">
            <span className={`font-mono text-xs shrink-0 ${v.status === "pending" ? "text-yellow-300" : v.status === "critical" ? "text-red-300" : "text-emerald-300"}`}>
              {v.key}
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-white/40 text-xs text-right">{v.val}</span>
              <Badge type={v.status === "critical" ? "critical" : v.status === "pending" ? "pending" : "live"}>
                {v.status}
              </Badge>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Injection Pattern">
        <div className="text-xs text-white/50 mb-2">Safe way to update .env from mobile terminal:</div>
        <Code>{"sed -i 's/STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=whsec_xxx/' .env"}</Code>
        <Code>pm2 restart seewhylive-backend</Code>
        <Code>{"pm2 env 0  # verify injected"}</Code>
        <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded p-2 text-xs text-red-200">
          ⚠ Never paste live secret keys in this chat — use terminal only
        </div>
      </Section>
    </div>
  );
}

// ── Deploy Status ─────────────────────────────────────────────────────────────
function StatusTab() {
  const [results, setResults] = useState({});
  const [checking, setChecking] = useState({});

  const checks = [
    { id: "frontend",      label: "Frontend (seewhylive.online)",     url: "https://seewhylive.online",                                              method: "fetch" },
    { id: "api",           label: "Backend API (/api/health)",         url: "https://seewhylive.online/api/health",                                   method: "fetch" },
    { id: "hls",           label: "MediaMTX HLS API",                  url: "https://seewhylive.online/mediamtx/v3/paths/list",                       method: "fetch" },
    { id: "stripe_webhook",label: "Stripe Webhook Endpoint",          url: "https://seewhylive.online/api/webhooks/stripe",                           method: "head" },
    { id: "auth",          label: "Supabase Auth Ping",                url: "https://rxlgywvfclyjdfyvfvyc.supabase.co/auth/v1/health",               method: "fetch" },
  ];

  const runCheck = async (check) => {
    setChecking((c) => ({ ...c, [check.id]: true }));
    const start = Date.now();
    try {
      const res = await fetch(check.url, {
        method: check.method === "head" ? "HEAD" : "GET",
        mode: "no-cors",
        signal: AbortSignal.timeout(5000),
      });
      const ms = Date.now() - start;
      setResults((r) => ({ ...r, [check.id]: { ok: true, ms, status: res.status || "opaque" } }));
    } catch (e) {
      const ms = Date.now() - start;
      setResults((r) => ({ ...r, [check.id]: { ok: false, ms, error: e.message } }));
    } finally {
      setChecking((c) => ({ ...c, [check.id]: false }));
    }
  };

  const runAll = () => checks.forEach(runCheck);

  return (
    <div>
      <Section title="Live Endpoint Checker">
        <div className="text-xs text-white/40 mb-4">
          Uses browser fetch — no-cors mode means "reachable" check only (status will show "opaque" for cross-origin). Run from VPS for full HTTP status codes.
        </div>
        <button
          onClick={runAll}
          className="mb-4 w-full py-2 bg-[#800020] hover:bg-[#a00028] text-white text-sm font-mono uppercase tracking-wider rounded transition-colors"
        >
          ▶ Check All Endpoints
        </button>
        {checks.map((check) => {
          const r = results[check.id];
          const isChecking = checking[check.id];
          return (
            <div key={check.id} className="flex items-center gap-3 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full shrink-0"
                style={{ background: isChecking ? "#D4AF37" : r ? (r.ok ? "#22c55e" : "#ef4444") : "#ffffff20" }} />
              <div className="flex-1">
                <div className="text-white/80 text-xs">{check.label}</div>
                <div className="text-white/30 text-[10px] font-mono">{check.url}</div>
              </div>
              <div className="text-right">
                {isChecking && <span className="text-yellow-300 text-xs animate-pulse">checking...</span>}
                {r && !isChecking && (
                  <div>
                    <Badge type={r.ok ? "live" : "critical"}>{r.ok ? "reachable" : "error"}</Badge>
                    <div className="text-white/30 text-[10px] font-mono mt-0.5">{r.ms}ms</div>
                  </div>
                )}
                {!r && !isChecking && (
                  <button onClick={() => runCheck(check)} className="text-white/30 hover:text-white text-xs transition-colors">
                    check →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Section>

      <Section title="Deployment Checklist Status">
        {[
          { item: "DNS A records → 2.24.194.112",            done: true },
          { item: "SSL cert active (Let's Encrypt)",          done: true },
          { item: "nginx serving SPA correctly",              done: true },
          { item: "PM2 processes running + saved",            done: true },
          { item: "Supabase auth live",                       done: true },
          { item: "Stripe live keys active (pk_ + sk_)",      done: true },
          { item: "RTMP ingest live (port 1935)",             done: true },
          { item: "HLS playback live (port 8888)",            done: true },
          { item: "STRIPE_WEBHOOK_SECRET set",                done: false },
          { item: "Anthropic API key active",                 done: false },
          { item: "LiveKit credentials set",                  done: false },
          { item: "YouTube Data API v3 key set",              done: false },
          { item: "Attorney review of legal docs",            done: false },
          { item: "Git repo mirrored to GitHub",              done: true },
        ].map((item, i) => (
          <CheckItem key={i} done={item.done}>{item.item}</CheckItem>
        ))}
      </Section>

      <Section title="Git / Repo">
        <Row label="Forgejo (self-hosted)" value="srv1581658.hstgr.cloud/git" badge={{ type: "live", label: "primary" }} />
        <Row label="GitHub Mirror"         value="SwanyThree23/seewhylive.online" badge={{ type: "live", label: "mirrored" }} />
        <Row label="Deploy Branch"         value="main" />
        <Row label="Build Command"         value="cd frontend && npm run build" />
        <Row label="After Deploy"          value="pm2 restart seewhylive-backend" />
      </Section>
    </div>
  );
}

const TAB_CONTENT = {
  rtmp:     RTMPTab,
  webrtc:   WebRTCTab,
  webhooks: WebhooksTab,
  connect:  ConnectTab,
  nginx:    NginxTab,
  supabase: SupabaseTab,
  env:      EnvTab,
  status:   StatusTab,
};

export default function StreamInfraRef() {
  const [activeTab, setActiveTab] = useState("rtmp");
  const ActiveContent = TAB_CONTENT[activeTab];

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
      className="min-h-screen bg-[#0E0C09] text-white">

      {/* Header */}
      <div className="border-b border-[#800020]/40 bg-[#110E0B]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[#800020] text-[10px] font-mono uppercase tracking-[0.3em] mb-1">SeeWhy LIVE</div>
              <h1 style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
                className="text-2xl tracking-widest text-white leading-none">
                STREAM INFRASTRUCTURE REFERENCE
              </h1>
            </div>
            <div className="text-right">
              <div className="text-[#D4AF37] text-[10px] font-mono">let the bones fall</div>
              <div className="text-white/20 text-[9px] font-mono mt-1">v41 · Washington Classic 2026</div>
            </div>
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            <Badge type="live">Production Live</Badge>
            <Badge type="gold">348 confirmed viewers</Badge>
            <Badge type="pending">4 keys pending</Badge>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-white/10 bg-[#0E0C09] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-0 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-mono whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-[#800020] text-white"
                    : "border-transparent text-white/30 hover:text-white/60"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ActiveContent />
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 mt-8 py-4 text-center">
        <div className="text-white/20 text-[10px] font-mono">
          CREATOR_SHARE 0.90 · PLATFORM_FEE 0.10 · PREVIEW_SECS 120 · MAX_PANEL_GUESTS 20
        </div>
      </div>
    </div>
  );
}
