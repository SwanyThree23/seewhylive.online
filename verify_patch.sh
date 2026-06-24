#!/bin/bash
echo "=== Does /opt/seewhy/src exist? ==="
ls -la /opt/seewhy/src 2>/dev/null || echo "NOT FOUND"

echo ""
echo "=== Does /opt/seewhy/src/hooks/useVODRecording.js exist? ==="
ls -la /opt/seewhy/src/hooks/ 2>/dev/null || echo "NOT FOUND"

echo ""
echo "=== Is /opt/seewhy/src referenced anywhere in frontend's vite config? ==="
cat /opt/seewhy/frontend/vite.config.js 2>/dev/null

echo ""
echo "=== Did the patch actually land in BroadcastStudio.jsx? ==="
grep -n "GlobalMicButtonV49\|vodResult\|useVODRecording" /opt/seewhy/src/pages/BroadcastStudio.jsx 2>/dev/null | head -10

echo ""
echo "=== Is the new code in the BUILT bundle that's actually served? ==="
grep -l "GlobalMicButtonV49\|vodRecording" /opt/seewhy/frontend/dist/assets/*.js 2>/dev/null || echo "NOT IN BUILT BUNDLE — patch did not ship"

echo ""
echo "=== What does nginx actually serve? ==="
grep -n "root\|try_files" /etc/nginx/sites-enabled/* 2>/dev/null
