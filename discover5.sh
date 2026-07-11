#!/bin/bash
echo "=== useVODRecording.js (full) ==="
cat /opt/seewhy/frontend/src/hooks/useVODRecording.js

echo ""
echo "=== useAutoSpeakGate.js (full) ==="
cat /opt/seewhy/frontend/src/hooks/useAutoSpeakGate.js

echo ""
echo "=== GlobalMicButtonV49.jsx (full) ==="
cat /opt/seewhy/frontend/src/components/streaming/GlobalMicButtonV49.jsx

echo ""
echo "=== Component function signature wrapping the ZEGO room (search backward from line 5383) ==="
awk 'NR<=5383 && /^function [A-Za-z]+\(/{line=NR; name=$0} END{print line": "name}' /opt/seewhy/frontend/src/App.jsx
