# JuraPlan installieren & nutzen

JuraPlan ist eine **lokale App**. Alle deine Daten (Kalender, Einträge,
Module, Notizen) bleiben **auf deinem Gerät** gespeichert – kein Server,
kein Konto, kein Internet nötig. Die App funktioniert komplett offline.

---

## 💻 Auf dem Laptop (Mac & Windows)

### Schritt 1 – App starten
- **Mac:** Doppelklick auf **`Start-JuraPlan.command`**
- **Windows:** Doppelklick auf **`Start-JuraPlan-Windows.bat`**

Es öffnet sich kurz ein schwarzes Fenster (der lokale Server) und danach
JuraPlan im Browser. **Das schwarze Fenster offen lassen**, solange du die
App benutzt.

> Falls beim Mac eine Sicherheitswarnung kommt: Rechtsklick auf die Datei →
> „Öffnen" → „Öffnen". Das ist nur beim allerersten Mal nötig.

### Schritt 2 – Als echte App installieren (empfohlen)
Damit JuraPlan wie ein normales Programm im Dock / Startmenü liegt
(eigenes Fenster, ohne Browser-Leiste):

- **Chrome / Edge:** Rechts in der Adressleiste erscheint ein
  **Installieren-Symbol** (Monitor mit Pfeil) → anklicken → „Installieren".
  Oder in der Seitenleiste von JuraPlan auf **„Als App installieren"**.
- **Safari (Mac):** Menü **Ablage → Zum Dock hinzufügen**.

Danach startest du JuraPlan direkt über das App-Icon – der Start-Doppelklick
ist dann nicht mehr nötig (Safari) bzw. läuft im Hintergrund weiter.

---

## 📱 Auf dem iPhone / iPad (iOS)

iOS erlaubt das Installieren von Web-Apps direkt über Safari:

1. Übertrage den Ordner `juraplan` auf dein Gerät **oder** rufe die App über
   eine Adresse auf (siehe „Von überall erreichbar" unten).
2. Öffne JuraPlan in **Safari**.
3. Tippe auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben).
4. Wähle **„Zum Home-Bildschirm"**.
5. JuraPlan erscheint als App-Icon – öffnet sich im Vollbild wie eine
   normale App, und die Daten bleiben auf dem Gerät.

> Wichtig: Unter iOS speichert jede installierte Web-App ihre Daten für sich.
> Nutze **„Daten exportieren"** regelmäßig als Backup.

---

## 🌐 Von überall erreichbar machen (optional)

Wenn du die App nicht per Datei öffnen, sondern über eine **Internet-Adresse**
aufrufen möchtest (praktisch fürs iPhone), kannst du den Ordner kostenlos
hosten – z. B. mit **Netlify Drop** (Ordner einfach auf netlify.com/drop
ziehen) oder **GitHub Pages**. Es bleibt trotzdem alles lokal im Browser
gespeichert. Sag Bescheid, dann richten wir das gemeinsam ein.

---

## 🔒 Daten sichern & übertragen

- **Backup:** Seitenleiste → **„Daten exportieren"** → speichert eine
  `.json`-Datei mit allem drin.
- **Wiederherstellen / auf neues Gerät holen:** Seitenleiste →
  **„Daten importieren"** → die `.json`-Datei auswählen.

So kannst du deine Daten auch zwischen Laptop und iPhone übertragen.

---

## ❓ Häufige Fragen

**Gehen meine Daten verloren, wenn ich die App schließe?**
Nein. Alles liegt dauerhaft im lokalen Speicher deines Geräts (IndexedDB).
Nur wenn du im Browser gezielt „Websitedaten löschen" wählst, sind sie weg –
deshalb lohnt sich ein gelegentliches Backup.

**Brauche ich Internet?**
Nein. Nach dem ersten Laden funktioniert alles offline.

**Kann ich die App später erweitern?**
Ja. Der Code liegt offen und gut lesbar im Ordner `js/`. Sag mir einfach,
was du ändern möchtest.
