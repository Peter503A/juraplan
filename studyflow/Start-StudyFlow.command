#!/bin/bash
# ============================================================
#  StudyFlow starten (macOS)
#  Doppelklick startet einen kleinen lokalen Server und
#  öffnet StudyFlow im Browser. Fenster offen lassen,
#  solange du die App nutzt.
# ============================================================
cd "$(dirname "$0")"
PORT=4180

echo "StudyFlow wird gestartet …"
echo "Adresse: http://localhost:$PORT"
echo "Zum Beenden dieses Fenster schließen."
echo ""

# Browser nach kurzer Wartezeit öffnen
( sleep 1; open "http://localhost:$PORT/index.html" ) &

# Lokalen Server starten (Python ist auf macOS vorinstalliert)
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server $PORT
elif command -v python >/dev/null 2>&1; then
  python -m SimpleHTTPServer $PORT
else
  echo "Python nicht gefunden. Bitte INSTALLIEREN.md lesen."
  read -r
fi
