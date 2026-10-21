<div align="center">

<img src="assets/logo.png" alt="RainbowlabsInc" width="96">

# 🚩 Auto Super-Meldescript: mobile.de & AutoScout24

**Unsaubere Fahrzeug-Inserate direkt aus den Suchergebnissen melden: mit eigenen Bausteinen, im offiziellen Melde-Dialog und ohne die Liste zu verlassen.**

[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js)
[![Plattform](https://img.shields.io/badge/plattform-mobile.de%20%C2%B7%20AutoScout24-green?style=flat-square)](#-wo-es-läuft)
[![Userscript](https://img.shields.io/badge/Tampermonkey-Violentmonkey-black?style=flat-square&logo=tampermonkey)](#%EF%B8%8F-installation)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20RainbowlabsInc-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/rainbowlabsinc)

*Chrome · Firefox · Edge · Kein Server · Kein Tracking · Meldet über den offiziellen Dialog*

<a href="https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js"><img src="assets/installieren.svg" alt="Installieren: Auto Super-Meldescript (Tampermonkey)" width="320" height="60"></a>

</div>

---

> [!IMPORTANT]
> **Frühe Version (0.1.0).** Ablauf, Menü und Bausteine sind fertig und an nachgebauten Seiten getestet. Die Teile, die vom echten Aufbau von mobile.de und AutoScout24 abhängen, sind **noch nicht an den Live-Seiten geprüft**: Wo der Button in der Karte sitzt, wie der Melde-Link auf AutoScout24 heißt und welche Gründe die Melde-Dialoge anbieten. Details unter [🧪 Getestet](#-getestet).

Wer auf mobile.de oder AutoScout24 ein Auto sucht, kennt das: **„1 €“**, Preise, die laut Beschreibung gar nicht gelten, Kilometerstände, die nicht zu den Fotos passen, längst verkaufte Fahrzeuge und Inserate, die nach Vorkasse-Betrug aussehen.

Melden kann man sie, aber dafür muss man jedes Inserat öffnen, den Melde-Link suchen und danach zurück zur Liste. Dabei geht oft die Scroll-Position verloren.

**Dieses Userscript setzt einen „Melden“-Button an jedes Inserat in der Ergebnisliste.** Ein Klick öffnet ein kleines Menü am Button. Dort wählst du einen **Baustein** (fertiger Text) und passt den Text bei Bedarf an. Dann öffnet sich das Inserat in einem kleinen Fenster, das Script öffnet dort den **offiziellen Melde-Dialog** und setzt deinen Text ein. Du prüfst und schickst ab, das Fenster schließt sich, und der Button zeigt **„Gemeldet“**.

---

## ✨ Features

* 🚩 **Melden-Button in der Übersicht:** an jedem Inserat in den Suchergebnissen, mit dem RainbowlabsInc-Logo.
* 🧩 **Bausteine:** Über ⚙ im Menü legst du Bausteine an, benennst sie um, sortierst oder löschst sie. Vier Vorlagen sind dabei: „Preis stimmt nicht“, „Falsche Fahrzeugangaben“, „Bereits verkauft“, „Verdacht auf Betrug“. Bausteine gibt es getrennt für mobile.de und AutoScout24. Den Grund wählst du in 0.1.0 noch selbst im Dialog, weil die Gründe der beiden Melde-Dialoge noch nicht eingetragen sind.
* 🪟 **Offizieller Dialog, vorausgefüllt:** Das Script öffnet den Melde-Dialog des Inserats in einem kleinen Popup, blendet den Rest der Seite aus und setzt Text und, falls hinterlegt, deine E-Mail ein. **Abgeschickt wird nur durch deinen Klick.**
* 🔀 **Wählbar:** „Menü mit Bausteinen“ oder „gleich den offiziellen Dialog öffnen“ (ohne Baustein), umschaltbar in den Einstellungen.
* ✅ **„Gemeldet“-Markierung:** Nach dem Absenden wird der Button grün. Schließt du das Fenster ohne erkannte Meldung, fragt das Script nach.
* 📌 **Übersicht bleibt, wo sie ist:** Kein Seitenwechsel, kein Zurück-Button. Scroll-Position, Filter und Seite bleiben erhalten.
* 🔒 **Strikt begrenzt:** Es läuft nur auf `https://suchen.mobile.de` und `https://www.autoscout24.de`.

---

## 🧭 Wo es läuft

| Seite | Übersicht (Button) | Inserat im Popup (Dialog öffnen und vorausfüllen) |
|---|---|---|
| **mobile.de** | Suchergebnisse auf `suchen.mobile.de` | `suchen.mobile.de/auto-inserat/…/<Nummer>.html` (auch `wohnwagen-inserat` usw.) und ältere Links `…/fahrzeuge/details.html?id=…`; Melde-Link „Inserat beanstanden“ |
| **AutoScout24** | Ergebnislisten (und andere Seiten mit Inserats-Links) auf `www.autoscout24.de` | `www.autoscout24.de/angebote/…`; Melde-Link wird über übliche Beschriftungen gesucht („melden“, „beanstanden“) |

**Nicht dabei:** Die Startseite `www.mobile.de` (die Karten dort haben keinen Link, den das Script lesen kann) und „Nutzer melden“ bei mobile.de. Das gibt es laut mobile.de nur im Nachrichten-Postfach (Drei-Punkte-Menü im Nachrichtenkopf), nicht an Inseraten.

---

## ⚙️ Installation

**Schritt 1: Userscript-Erweiterung installieren** (kostenlos)

| Browser | Erweiterung |
|---|---|
| Chrome / Edge | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) oder [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) |
| Firefox | [Tampermonkey](https://addons.mozilla.org/de/firefox/addon/tampermonkey/) oder [Violentmonkey](https://addons.mozilla.org/de/firefox/addon/violentmonkey/) |

> **Chrome/Edge:** Bei neueren Tampermonkey-Versionen muss in den Erweiterungs-Details „Benutzerskripte zulassen“ bzw. der Entwicklermodus aktiviert sein.

**Schritt 2: Script installieren**

<a href="https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js"><img src="assets/installieren.svg" alt="Installieren: Auto Super-Meldescript (Tampermonkey)" width="320" height="60"></a>

*(Alternativ: Inhalt von `script.user.js` kopieren und in Tampermonkey als neues Skript einfügen.)*

Updates holt sich Tampermonkey automatisch aus diesem Repo.

---

## 🛠️ Bedienung

1. Auf mobile.de oder AutoScout24 ganz normal suchen.
2. Bei einem unsauberen Inserat auf **„Melden“** klicken.
3. Im Menü einen Baustein wählen und den Text bei Bedarf anpassen.
4. Auf **„Im Melde-Dialog einsetzen“** klicken. Das Inserat öffnet sich in einem kleinen Fenster mit dem Melde-Dialog.
5. Im Fenster prüfen, fehlende Angaben ergänzen (z. B. den Grund) und **absenden**. Das Fenster schließt sich, der Button zeigt **„Gemeldet“**.

Für einen anderen Grund ohne Baustein: im Menü **„Ohne Baustein: nur den offiziellen Melde-Dialog öffnen“**.

**Bausteine und Einstellungen:** im Menü auf ⚙, oder im Tampermonkey-Menü auf **„Bausteine und Einstellungen“**. Dort stellst du ein,

* was ein Klick auf „Melden“ tut (Menü mit Bausteinen oder gleich den offiziellen Dialog öffnen),
* ob eine **E-Mail für Rückmeldungen** eingetragen werden soll. mobile.de schreibt dazu: Meldungen sind grundsätzlich anonym, mit E-Mail oder Telefonnummer bekommst du eine Rückmeldung zur Bearbeitung. Das Script trägt die E-Mail nur in ein leeres E-Mail-Feld im Dialog ein.

Im Text eines Bausteins kannst du diese Platzhalter verwenden:

| Platzhalter | wird ersetzt durch |
|---|---|
| `{titel}` | Titel des Inserats |
| `{preis}` | angezeigter Preis, z. B. „12.990 €“ bzw. „€ 12.990,-“ |
| `{id}` | Inserats-Nummer |
| `{link}` | Link zum Inserat |

> Falls der Browser das Fenster blockiert, erscheint unten ein Hinweis. Erlaube dann Popups für die Seite, oder öffne das Inserat über den Hinweis in einem neuen Tab.

---

## 🔧 Wie es technisch funktioniert

| Situation | Was passiert |
|---|---|
| Ergebnisliste | Das Script erkennt die Karten über ihre Links aufs Inserat (Inserats-Nummer bei mobile.de, UUID bei AutoScout24) und setzt den Button unter den Preis, ohne Preis ans Ende der Karte. Nachgeladene Ergebnisse erfasst ein `MutationObserver`. |
| „Im Melde-Dialog einsetzen“ | Das Inserat öffnet sich mit dem Hash `#asm-report` in einem Popup-Fenster. Dasselbe Script erkennt das Fenster, holt sich per `postMessage` den Auftrag (Text, Grund, E-Mail) aus der Übersicht und klickt den Melde-Link. |
| Melde-Dialog | Der neu erschienene Dialog wird hervorgehoben (Cookie-Banner und andere schon vorhandene Dialoge werden übergangen). Text und E-Mail werden so eingesetzt, dass das Frontend der Seite sie übernimmt. Vorbereitet, aber in 0.1.0 noch ohne eingetragene Gründe: Ist zu einem Baustein ein Grund hinterlegt, klickt das Script die Auswahl Schritt für Schritt an, auch in mehrstufigen Dialogen. **Den Absenden-Button klickt es nie.** |
| Nach dem Absenden | Erkennt das Script eine Bestätigung im Dialog, meldet es „gemeldet“ an die Übersicht und schließt das Fenster. Führt der Melde-Link auf eine eigene Seite, läuft das Ganze dort weiter. |
| Speicher | Im Speicher des Userscript-Managers (`GM_setValue`): Bausteine und „Gemeldet“-Markierungen je Seite (`asm-templates-…`, `asm-reported-…`, höchstens 5.000), Einstellungen (`asm-settings`). |

> **Warum ein Fenster und kein Overlay?** Die Seiten erlauben in der Regel nicht, dass man sie in andere Seiten einbettet (Schutz gegen Clickjacking). Ein Popup mit der echten Seite ist der verlässliche Weg.

Alles Seitenspezifische (Link-Muster, Beschriftung des Melde-Links, Gründe, Erfolgstexte) steht gesammelt in `SITES` am Anfang von [`script.user.js`](script.user.js), alles andere in `CONFIG`.

### Direkt aus der Übersicht melden

Wie beim [Kleinanzeigen-Meldescript](https://github.com/RainbowLabsInc/Kleinanzeigen.de_Anzeige_melden) soll man später auch ganz ohne Popup melden können. Dafür muss bekannt sein, welche Anfrage der offizielle Dialog beim Absenden schickt. Für mobile.de und AutoScout24 ist das noch nicht abgelesen. Darum gibt es in 0.1.0 nur den Weg über den offiziellen Dialog.

---

## 🧪 Getestet

| Umgebung | Stand |
|---|---|
| Chromium mit nachgebauten Seiten | ✅ Buttons an Karten (mit Link, verschachtelt, ganze Karte als Link; reine Text-Links übergangen), Klick navigiert nicht, Preis in beiden Formaten, Menü und Platzhalter, Popup öffnet den Dialog trotz verspätet angehängter Klick-Logik, Cookie-Banner übergangen, Text (auf die erlaubte Länge gekürzt) und E-Mail eingesetzt, Grund über zwei Schritte ausgewählt, nichts automatisch abgeschickt, „Gemeldet“ nach dem Absenden, Nachfrage beim Schließen ohne Meldung, Neuaufbau der Liste, Einstellungen, Inseratsseite ohne Popup bleibt unverändert |
| mobile.de, Live-Seite | ⏳ noch nicht getestet. Geprüft sind bisher nur die Inserats-Links (aus einer gespeicherten Startseite) und der Name des Melde-Links (laut Hilfeseite von mobile.de) |
| AutoScout24, Live-Seite | ⏳ noch nicht getestet. Link-Muster `/angebote/…` und Beschriftung des Melde-Links sind noch nicht an der Live-Seite geprüft |
| Firefox, Violentmonkey | ⏳ noch nicht getestet |

Funktioniert etwas nicht, hilft ein [Issue](https://github.com/RainbowLabsInc/Auto_Super_Meldescript/issues) mit:

1. einem Screenshot und dem Hinweis aus der Statusleiste unten in der Übersicht,
2. dem Link zur Seite,
3. dem HTML des betroffenen Elements (DevTools → Element → Rechtsklick → *Copy → Copy outerHTML*), oder der ganzen Seite mit geöffnetem Melde-Dialog (Strg+S, „Webseite, komplett“).

Bitte **keine** Cookies, Tokens oder persönlichen Daten mitschicken.

---

## 📋 Versionen

| Version | Änderungen |
|---|---|
| **0.1.0** | Erste Version: Melden-Button in den Ergebnislisten von mobile.de und AutoScout24, Menü mit Bausteinen, offizieller Melde-Dialog im Popup mit eingesetztem Text, Grund und E-Mail, „Gemeldet“-Markierung, Einstellungen |

---

## 🗺️ Ideen für später

* Gründe der Melde-Dialoge eintragen, damit Bausteine auch den Grund auswählen.
* Direkt aus der Übersicht melden (ohne Popup), sobald die Anfrage des offiziellen Dialogs bekannt ist.
* Startseite `www.mobile.de` mit ihren Empfehlungen.
* „Nutzer melden“ im Nachrichten-Postfach von mobile.de.

---

## ⚖️ Disclaimer

> Dieses Skript ist ein inoffizielles Tool und steht in keiner Verbindung zu mobile.de oder AutoScout24. Die Nutzung erfolgt auf eigene Gefahr. Bitte melde nur Inserate, die tatsächlich gegen die Regeln verstoßen. Missbräuchliche Massenmeldungen können zur Sperrung deines Kontos führen.

* Es liest keine Passwörter oder Nachrichten aus.
* Es nutzt keine externen Server, alles läuft lokal in deinem Browser. Das Logo im Button ist direkt im Script eingebettet.
* Es schickt selbst nichts an mobile.de oder AutoScout24. Es öffnet das Inserat wie ein normaler Klick und füllt den offiziellen Dialog aus. Abgeschickt wird nur durch deinen Klick im Dialog.
* Bausteine, Einstellungen und „Gemeldet“-Markierungen liegen nur im Speicher deines Userscript-Managers.
* Es läuft **ausschließlich auf `https://suchen.mobile.de` und `https://www.autoscout24.de`**. Auf allen anderen Websites ist es inaktiv.

---

## ☕ Unterstütze das Projekt

<a href="https://ko-fi.com/rainbowlabsinc" target="_blank">
  <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support on Ko-fi" height="36">
</a>

Dieses Userscript ist ein kostenloses Open-Source-Hobbyprojekt. Wenn es dir bei der Autosuche Zeit und Nerven spart, freue ich mich über einen Kaffee.

---

## 📄 Lizenz

MIT License: frei nutzbar, veränderbar und weitergebbar. Siehe [LICENSE](LICENSE).

---

<div align="center">

**Made with ❤️ by RainbowlabsInc**

[Installieren](https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js) · [Issues](https://github.com/RainbowLabsInc/Auto_Super_Meldescript/issues) · [☕ Spenden](https://ko-fi.com/rainbowlabsinc)

</div>
