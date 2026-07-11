#!/bin/bash
echo "=== Vite entry point config ==="
cat /opt/seewhy/frontend/vite.config.js 2>/dev/null | grep -i "entry\|index"
find /opt/seewhy/frontend -maxdepth 2 -iname "main.jsx" -o -iname "main.js" -o -iname "index.html" 2>/dev/null

echo ""
echo "=== index.html script src (tells us real entry) ==="
cat /opt/seewhy/frontend/index.html 2>/dev/null | grep -i "script\|src="

echo ""
echo "=== App.jsx size + key imports ==="
wc -l /opt/seewhy/frontend/src/App.jsx 2>/dev/null
grep -n "ZEGO\|GlobalMicButtonV49\|useVODRecording\|useAutoSpeakGate\|StageRoom\|import.*from.*components" /opt/seewhy/frontend/src/App.jsx 2>/dev/null | head -30

echo ""
echo "=== Any component with 'Stage' or 'Stream' or 'Studio' in the name ==="
find /opt/seewhy/frontend/src -iname "*stage*" -o -iname "*stream*" -o -iname "*studio*" 2>/dev/null

echo ""
echo "=== package.json main/scripts ==="
grep -A3 '"scripts"' /opt/seewhy/frontend/package.json 2>/dev/null
