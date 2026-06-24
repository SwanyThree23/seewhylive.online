#!/bin/bash
echo "=== Files containing 'BroadcastStudio' ==="
grep -rl "BroadcastStudio" /opt/seewhy/frontend/src --include="*.jsx" 2>/dev/null

echo ""
echo "=== Files containing 'ZEGO' ==="
grep -rl "ZEGO" /opt/seewhy/frontend/src --include="*.jsx" 2>/dev/null

echo ""
echo "=== App_v46.jsx size + imports of GlobalMicButtonV49 ==="
wc -l /opt/seewhy/frontend/src/App_v46.jsx 2>/dev/null
grep -n "GlobalMicButtonV49\|useVODRecording\|useAutoSpeakGate\|BroadcastStudio" /opt/seewhy/frontend/src/App_v46.jsx 2>/dev/null

echo ""
echo "=== Which App file is actually built/served (check index entry) ==="
grep -rn "App_v46\|App_v45\|from './App'" /opt/seewhy/frontend/src/main.jsx /opt/seewhy/frontend/src/index.jsx 2>/dev/null
