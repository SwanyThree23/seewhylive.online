#!/bin/bash
echo "=== BroadcastStudio.jsx location ==="
find /opt/seewhy/frontend -iname "BroadcastStudio*" 2>/dev/null

echo ""
echo "=== Existing hooks directory ==="
find /opt/seewhy/frontend -type d -iname "hooks" 2>/dev/null
ls -la /opt/seewhy/frontend/src/hooks/ 2>/dev/null

echo ""
echo "=== Existing components related to mic/audio ==="
grep -ril "mic" /opt/seewhy/frontend/src --include="*.jsx" 2>/dev/null | head -10

echo ""
echo "=== vod.js route file (from earlier wiring) ==="
find /opt/seewhy/frontend -iname "vod.js" 2>/dev/null

echo ""
echo "=== ZEGO SDK usage in BroadcastStudio ==="
BSPATH=$(find /opt/seewhy/frontend -iname "BroadcastStudio.jsx" 2>/dev/null | head -1)
if [ -n "$BSPATH" ]; then
  echo "Found at: $BSPATH"
  echo "Line count: $(wc -l < "$BSPATH")"
  grep -n "ZEGO\|useState\|useEffect\|import" "$BSPATH" | head -20
else
  echo "NOT FOUND"
fi
