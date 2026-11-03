# StudyFlow 📘✦

**Dein Lernplaner für das Fernstudium Online Marketing & E-Commerce (B.A.)**

StudyFlow verbindet drei Dinge: deinen **Lernplan (Soll)**, deine **tatsächlich geleistete Lernzeit (Ist)** und deinen **Fortschritt pro Modul** – in einer übersichtlichen, deutschsprachigen Oberfläche. Im Design angelehnt an die JuraApp, aber vollständig auf deinen Studiengang zugeschnitten.

Die App läuft **komplett offline im Browser**, speichert automatisch lokal und braucht keine Installation und keinen Server.

---

## 🚀 Schnellstart

**Einfachster Weg:** Öffne die Datei **`studyflow.html`** per Doppelklick in deinem Browser. Das war's. Alles ist in dieser einen Datei enthalten – funktioniert auf PC und Smartphone, auch ohne Internet.

Alternativ (für Entwicklung, mit getrennten Dateien):

```bash
npm run serve     # startet einen lokalen Server auf http://localhost:8777
npm run build     # erzeugt die eigenständige studyflow.html neu
npm test          # führt die Logik- und Interaktionstests aus
```

---

## 🧩 Funktionen

### 1. Kalender
- **Tag-, Wochen-, Monats- und Jahresansicht**
- **Lernblöcke** und **Termine** getrennt eintragen
- Ein Lernblock enthält: Modul, **Lernart** (Lesen, Verstehen, Lernen, Wiederholen, Klausurvorbereitung, Hausarbeit/Projekt), geplante & tatsächlich gelernte Zeit, Priorität, Notizen und offene Punkte
- Klick auf eine Uhrzeit legt direkt einen Eintrag an
- Pro Tag und Woche eigene Notizen

### 2. Module & Projekte
- **Vollständiger, vorgefüllter Modulkatalog** des Studiengangs (99 Einträge)
- Durchsuchbar nach **Name** oder **Kurscode**; Filter nach Pflicht / Wahlpflicht / Gewählt / Zusatz
- **Pflichtmodule** nach Semester (1.–6.) sind als *Pflicht* markiert
- **Wahlpflichtbereiche A, B, C, D** mit jeweils angezeigtem **ECTS-Sollwert**
- Wahlpflichtmodule werden **per Checkbox** gewählt und erscheinen dann in *Meine Module*
- **Keine Dubletten:** Module, die in mehreren Wahlpflichtgruppen vorkommen, werden nur **einmal** über ihren eindeutigen **Kurscode** geführt; die Gruppenzugehörigkeit (A/B/C) wird als Kennzeichen angezeigt
- Der bewusste **Doppeleintrag `DLBMSM02-02`** (Social-Media-Marketing) wird separat angezeigt und als *möglicher Doppeleintrag* markiert
- **Wahlpflichtbereich D** ist exklusiv: entweder **Praktikum (30 ECTS)** *oder* die **sechs Einzelmodule** – nur ein Weg zählt zum Fortschritt
- Teilkurse (z. B. Marketing I/II, Advanced Leadership I/II) sind unter einem gemeinsamen Modul zusammengefasst
- Pro Modul: **Prüfungsstatus** (offen, begonnen, gelernt, prüfungsbereit, bestanden, angerechnet), ECTS, Prüfungsform, geschätzter Aufwand, Zieltermin, Modulfarbe
- **Fortschritt** je Modul über Seiten (gelesen/gesamt), erledigte Aufgaben und verbleibende Lernschritte
- **Zusatzangebote ohne ECTS** (IU mitgestalten, Sprachtrainings) werden getrennt geführt
- Nur **ausgewählte** Wahlmöglichkeiten zählen zum Studienfortschritt

### 3. Wochen- & Monatsrückblick
- **Soll vs. Ist** – geplante gegen tatsächlich gelernte Zeit mit Fortschrittsbalken
- **Lernzeit je Modul** als Balkendiagramm
- Erledigte Lernblöcke, Einträge des Zeitraums
- **Offene Punkte** sammeln und per Klick **in die nächste Woche übertragen**
- Wochen- bzw. Monatsnotiz
- Umschaltbar zwischen Wochen- und Monatssicht

### 4. Alltag & Lernfenster
Zugeschnitten auf deinen Rhythmus (als sinnvolle Startwerte vorbelegt, jederzeit änderbar):
- **Arbeitszeit:** Dienstag–Donnerstag, 7–15 Uhr
- **Lernfreie Tage:** Montag & Freitag
- **Fitnessstudio:** Mo, Di, Do, Fr (~1–1,5 h)
- **Ruhetag** am Wochenende (einstellbar)
- **Studienzieltermin** im August (mit Countdown bis zum Abschluss)
- Die App **schlägt freie Lernzeiten vor**, belegt aber **Ruhezeiten nie automatisch** – du entscheidest per Klick, ob ein Vorschlag zum Lernblock wird

### 5. Daten
- **Automatisches lokales Speichern** (localStorage) – nichts geht verloren
- **Export** und **Import** als JSON-Datei (Backup / Gerätewechsel)
- Zurücksetzen-Funktion
- Responsive: **gut bedienbar am PC und am Smartphone**

---

## 📂 Projektstruktur

```
studyflow/
├── studyflow.html          ← Fertige App in EINER Datei (einfach öffnen!)
├── index.html              ← Entwicklungs-Einstieg (lädt src/ als Module)
├── styles.css              ← Design (violettes Theme)
├── data/
│   └── moduleCatalog.js    ← Kompletter Studienplan / Modulkatalog
├── src/
│   ├── main.js             ← Einstiegspunkt
│   ├── app.js              ← App-Shell: Sidebar, Navigation, Export/Import
│   ├── store.js            ← Zustand + automatische Persistenz
│   ├── modules.js          ← ECTS-/Fortschritts-Logik
│   ├── entryModal.js       ← „Neuer Eintrag“ (Lernblock/Termin)
│   ├── utils.js            ← Datum/Zeit/Formatierung (deutsch)
│   ├── dom.js              ← kleine DOM-Helfer, Modals, Toasts
│   └── views/
│       ├── calendar.js     ← Tag/Woche/Monat/Jahr
│       ├── modules.js      ← Modulkatalog + Meine Module
│       ├── review.js       ← Wochen-/Monatsrückblick
│       └── settings.js     ← Alltag & Lernfenster
├── build-standalone.mjs    ← baut studyflow.html aus den Quellen
├── serve.mjs               ← lokaler Entwicklungs-Server
└── test-*.mjs              ← Logik- und Interaktionstests
```

## 🔧 Technik
Reines **Vanilla JavaScript** (ES-Module), **ohne Abhängigkeiten**, **ohne Build-Pflicht** und **ohne Internetverbindung** lauffähig. Die Datei `studyflow.html` bündelt alle Module über ein winziges eingebettetes Modulsystem, damit sie als einzelne Datei funktioniert.

> Hinweis: Der Modulkatalog bildet den Studienplan sorgfältig ab. Bitte gleiche ECTS, Prüfungsformen und Kurscodes im Zweifel mit deinem offiziellen Studienplan / dem IU-Portal ab und passe Abweichungen direkt im Katalog (`data/moduleCatalog.js`) oder in der App an.
