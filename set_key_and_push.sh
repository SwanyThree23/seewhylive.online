#!/bin/bash
set -e
cd /opt/seewhy
SB_KEY="${1:-}"
GH_PAT="${2:-}"
if [ -z "$SB_KEY" ] || [ -z "$GH_PAT" ]; then
  echo "Usage: bash set_key_and_push.sh YOUR_SB_SECRET_KEY ghp_YOUR_PAT"
  exit 1
fi
echo "[1/3] Setting Supabase key..."
sed -i '/SUPABASE_SERVICE_ROLE_KEY/d' .env
printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n' "$SB_KEY" >> .env
pm2 stop seewhy-server && pm2 delete seewhy-server
export SUPABASE_SERVICE_ROLE_KEY="$SB_KEY"
pm2 start /opt/seewhy/server/index.js --name seewhy-server
pm2 save
sleep 3
echo "[2/3] Testing VOD route..."
RESULT=$(curl -s --max-time 5 "http://localhost:3001/api/vod/list?creator_id=fa691550-9019-4f89-8a25-b1f88c10ac9e" | head -c 100)
echo "  Response: $RESULT"
echo "[3/3] Git push..."
git config user.email "swanythree23@users.noreply.github.com"
git config user.name "SwanyThree23"
git remote set-url origin "https://SwanyThree23:${GH_PAT}@github.com/SwanyThree23/seewhylive.online.git"
git add -A 2>/dev/null || true
git add -u 2>/dev/null || true
git diff --cached --quiet 2>/dev/null || git commit -m "feat: v49 batch 2 complete"
git push origin HEAD:master
git remote set-url origin "https://github.com/SwanyThree23/seewhylive.online.git"
echo "=== Done ==="
