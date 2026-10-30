# JuraPlan – Dein Lernkalender

Ein persönlicher Kalender für Lernblöcke, Termine, Notizen und Fortschritt.
JuraPlan ist eine **lokale App (PWA)**: Alle Daten bleiben auf deinem Gerät –
kein Server, kein Konto, kein Internet nötig. Funktioniert komplett offline.

## Funktionen

- 🗓️ **Kalender** mit Tag-, Wochen-, Monats- und Jahresansicht
- ➕ **Lernblöcke & Termine** per Klick anlegen – mit Modul, Zeit und Notiz
- 🚩 **Prioritäten** (wichtig / dringend) mit Farbe und Filter
- ✅ **Status** erledigt / teilweise / fehlt – inkl. tatsächlich gelernter Zeit
  und „Was fehlt noch?" + „In nächste Woche mitnehmen"
- 📚 **Module & Projekte** mit Farben und optionalem Zeitziel
- 📊 **Wochenrückblick** mit Lernzeit nach Modul, Soll-Pensum, offenen Punkten
- 📝 **Notizen** pro Eintrag, pro Tag und pro Woche
- 💾 **Export / Import** als JSON (Backup und Geräte-Übertragung)

## Nutzung & Installation

Siehe **[INSTALLIEREN.md](INSTALLIEREN.md)** für eine Schritt-für-Schritt-Anleitung
(Laptop & iPhone).

Kurz: Die App ist über GitHub Pages erreichbar und lässt sich direkt im Browser
„installieren" (Laptop) bzw. per „Zum Home-Bildschirm" (iOS).

## Technik

Reines HTML, CSS und JavaScript – ohne Framework und ohne Build-Schritt.
Datenhaltung über IndexedDB, Offline-Fähigkeit über einen Service Worker.
