@echo off
REM ============================================================
REM  JuraPlan starten (Windows)
REM  Doppelklick startet einen kleinen lokalen Server und
REM  oeffnet JuraPlan im Browser. Fenster offen lassen,
REM  solange du die App nutzt.
REM ============================================================
cd /d "%~dp0"
set PORT=4173

echo JuraPlan wird gestartet ...
echo Adresse: http://localhost:%PORT%
echo Zum Beenden dieses Fenster schliessen.
echo.

start "" "http://localhost:%PORT%/index.html"

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PORT%
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    py -m http.server %PORT%
  ) else (
    echo Python nicht gefunden. Bitte INSTALLIEREN.md lesen.
    pause
  )
)
