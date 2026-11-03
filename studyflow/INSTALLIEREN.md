# StudyFlow installieren & nutzen

StudyFlow ist eine **lokale App**. Alle deine Daten (Kalender, Einträge,
Module, Notizen, Einstellungen) bleiben **auf deinem Gerät** gespeichert –
kein Server, kein Konto, kein Internet nötig. Die App funktioniert komplett offline.

Es gibt **zwei Wege**, StudyFlow zu nutzen:

- **Ganz einfach:** die einzelne Datei **`studyflow.html`** per Doppelklick öffnen.
- **Als echte App (PWA):** über ein Start-Skript starten und dann installieren –
  eigenes Icon, eigenes Fenster, offline. Das ist unten beschrieben.

---

## 💻 Auf dem Laptop (Mac & Windows)

### Schritt 1 – App starten
- **Mac:** Doppelklick auf **`Start-StudyFlow.command`**
- **Windows:** Doppelklick auf **`Start-StudyFlow-Windows.bat`**

Es öffnet sich kurz ein Fenster (der lokale Server) und danach StudyFlow im
Browser. **Das Fenster offen lassen**, solange du die App benutzt.

> Falls beim Mac eine Sicherheitswarnung kommt: Rechtsklick auf die Datei →
> „Öffnen" → „Öffnen". Das ist nur beim allerersten Mal nötig.

### Schritt 2 – Als echte App installieren (empfohlen)
Damit StudyFlow wie ein normales Programm im Dock / Startmenü liegt
(eigenes Fenster, ohne Browser-Leiste):

- **Chrome / Edge:** Rechts in der Adressleiste erscheint ein
  **Installieren-Symbol** (Monitor mit Pfeil) → anklicken → „Installieren".
  Oder in StudyFlow unten links auf **„Als App installieren"**.
- **Safari (Mac):** Menü **Ablage → Zum Dock hinzufügen**.

Danach startest du StudyFlow direkt über das App-Icon.

---

## 📱 Auf dem iPhone / iPad (iOS)

1. Übertrage den Ordner `studyflow` auf dein Gerät (z. B. in die Dateien-App)
   **oder** rufe die App über eine Webadresse auf.
2. Öffne **`index.html`** in **Safari**.
3. Tippe unten auf **Teilen** (Quadrat mit Pfeil nach oben).
4. Wähle **„Zum Home-Bildschirm"** → **„Hinzufügen"**.

StudyFlow liegt nun als App-Icon auf dem Home-Bildschirm und startet im
Vollbild – ohne Safari-Leisten.

---

## 🤖 Auf Android

1. Öffne **`index.html`** in **Chrome**.
2. Tippe auf das **Menü ⋮** → **„App installieren"** bzw.
   **„Zum Startbildschirm hinzufügen"**.

---

## 🔁 Daten sichern & übertragen
- Unten links in der App: **„Daten exportieren"** speichert alles als eine
  JSON-Datei.
- **„Daten importieren"** lädt eine solche Datei wieder ein – perfekt für
  Backups oder den Wechsel auf ein anderes Gerät.

---

## ❓ Häufige Fragen

**Muss ich online sein?**
Nein. Nach dem ersten Laden funktioniert alles offline.

**Gehen meine Daten verloren, wenn ich den Browser-Cache leere?**
Die Daten liegen im lokalen Speicher des Browsers. Leerst du gezielt die
Website-Daten, können sie gelöscht werden – deshalb regelmäßig **exportieren**.

**Warum klappt „Als App installieren" bei der einzelnen `studyflow.html` nicht immer?**
Das Installieren funktioniert am zuverlässigsten über ein Start-Skript oder
eine Webadresse (http/https). Als einzelne Datei (file://) schränken manche
Browser die Installation ein – die App läuft dann aber trotzdem voll.
