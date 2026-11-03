@echo off
REM ============================================================
REM  StudyFlow starten (Windows)
REM  Doppelklick startet einen kleinen lokalen Server und
REM  oeffnet StudyFlow im Browser. Fenster offen lassen,
REM  solange du die App nutzt.
REM ============================================================
cd /d "%~dp0"
set PORT=4180

echo StudyFlow wird gestartet ...
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
