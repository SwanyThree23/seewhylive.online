#!/bin/bash
echo "=== useVODRecording.js (full) ==="
cat /opt/seewhy/frontend/src/hooks/useVODRecording.js

echo ""
echo "=== ZegoLiveRoom: lines 5378-5470 (state setup + mic wiring) ==="
sed -n '5378,5470p' /opt/seewhy/frontend/src/App.jsx

echo ""
echo "=== Local stream / getUserMedia refs inside ZegoLiveRoom ==="
awk 'NR>=5378 && NR<=5900 && /localStream|getUserMedia|MediaStream|zg\.createStream|zg\.startPublishing/' /opt/seewhy/frontend/src/App.jsx
