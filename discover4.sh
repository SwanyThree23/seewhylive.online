#!/bin/bash
echo "=== Top imports of App.jsx (first 60 lines) ==="
sed -n '1,60p' /opt/seewhy/frontend/src/App.jsx

echo ""
echo "=== ZEGO room section context (lines 5340-5520) ==="
sed -n '5340,5520p' /opt/seewhy/frontend/src/App.jsx

echo ""
echo "=== Existing import of GlobalMicButtonV49 anywhere in App.jsx? ==="
grep -n "GlobalMicButtonV49" /opt/seewhy/frontend/src/App.jsx

echo ""
echo "=== Existing mic-related JSX near the room render ==="
grep -n "mic\|Mic" /opt/seewhy/frontend/src/App.jsx | head -20
