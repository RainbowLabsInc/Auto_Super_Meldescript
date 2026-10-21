<div align="center">

<img src="assets/logo.png" alt="RainbowlabsInc" width="96">

# 🚩 Auto Super-Meldescript: mobile.de & AutoScout24

**Unsaubere Fahrzeug-Inserate direkt aus den Suchergebnissen melden: mit eigenen Bausteinen, im offiziellen Melde-Formular und ohne die Liste zu verlassen.**

[![Version](https://img.shields.io/badge/version-0.2.0-blue?style=flat-square)](https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js)
[![Plattform](https://img.shields.io/badge/plattform-mobile.de%20%C2%B7%20AutoScout24-green?style=flat-square)](#-wo-es-läuft)
[![Userscript](https://img.shields.io/badge/Tampermonkey-Violentmonkey-black?style=flat-square&logo=tampermonkey)](#%EF%B8%8F-installation)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20RainbowlabsInc-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/rainbowlabsinc)

*Chrome · Firefox · Edge · Kein Server · Kein Tracking · Meldet über die offiziellen Wege*

<a href="https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js"><img src="assets/installieren.svg" alt="Installieren: Auto Super-Meldescript (Tampermonkey)" width="320" height="60"></a>

</div>

---

> [!IMPORTANT]
> **Frühe Version (0.2.0).** **AutoScout24** ist an der Live-Seite getestet (Stand 10/2026). Bei **mobile.de** sind Melde-Link, Melde-Dialog und alle Gründe aus einer gespeicherten Inseratsseite übernommen. **Die Suchergebnisse von mobile.de sind dagegen noch nicht geprüft**: Die Seite war aus der Testumgebung nicht erreichbar, und eine gespeicherte Ergebnisseite liegt noch nicht vor. Details unter [🧪 Getestet](#-getestet).

Wer auf mobile.de oder AutoScout24 ein Auto sucht, kennt das: **„1 €“**, Preise, die laut Beschreibung gar nicht gelten, Kilometerstände, die nicht zu den Fotos passen, längst verkaufte Fahrzeuge und Inserate, die nach Vorkasse-Betrug aussehen.

Melden kann man sie, aber dafür muss man jedes Inserat öffnen, den Melde-Link suchen und danach zurück zur Liste. Dabei geht oft die Scroll-Position verloren.

**Dieses Userscript setzt einen „Melden“-Button an jedes Inserat in der Ergebnisliste.** Ein Klick öffnet ein kleines Menü am Button. Dort wählst du einen **Baustein** (Grund und fertiger Text) und passt den Text bei Bedarf an. Dann öffnet sich das **offizielle Melde-Formular** in einem kleinen Fenster, mit Grund und Text schon eingesetzt. Du prüfst und schickst ab, das Fenster schließt sich, und der Button zeigt **„Gemeldet“**. Bei **AutoScout24** geht es auch ganz ohne Fenster direkt aus dem Menü.

---

## ✨ Features

* 🚩 **Melden-Button in der Übersicht:** an jedem Inserat in den Suchergebnissen, mit dem RainbowlabsInc-Logo.
* 🧩 **Bausteine mit Grund:** Sechs Vorlagen sind dabei (siehe [Gründe](#%EF%B8%8F-gründe)). Über ⚙ im Menü legst du eigene an, wählst den Grund aus der Liste der jeweiligen Seite, benennst sie um, sortierst oder löschst sie. Bausteine gibt es getrennt für mobile.de und AutoScout24.
* 🪟 **Offizielles Formular, vorausgefüllt:** Das Script öffnet das Melde-Formular in einem kleinen Popup, blendet den Rest der Seite aus, wählt den Grund (auch über Reiter oder Auswahllisten) und setzt Text sowie, falls hinterlegt, E-Mail und Name ein. **Abgeschickt wird nur durch deinen Klick.** Auch das Häkchen „Ich erkläre, dass ich in gutem Glauben handle …“ setzt du selbst.
* ⚡ **AutoScout24: direkt melden.** Im Menü E-Mail und Name (beides optional) eintragen, die Erklärung „in gutem Glauben“ anhaken und auf **„Melden“** klicken. Das Script schickt dieselbe Anfrage wie das offizielle Formular. Kein Fenster, kein Seitenwechsel.
* 🔀 **Wählbar:** „Menü mit Bausteinen“ oder „gleich das offizielle Formular öffnen“ (ohne Baustein), umschaltbar in den Einstellungen.
* ✅ **„Gemeldet“-Markierung:** Nach dem Absenden wird der Button grün. Schließt du das Fenster ohne erkannte Meldung, fragt das Script nach.
* 📌 **Übersicht bleibt, wo sie ist:** Kein Seitenwechsel, kein Zurück-Button. Scroll-Position, Filter und Seite bleiben erhalten.
* 🔒 **Strikt begrenzt:** Es läuft nur auf `https://suchen.mobile.de` und `https://www.autoscout24.de`.

---

## 🧭 Wo es läuft

| Seite | Übersicht (Button) | Melde-Formular im Popup | Direkt melden |
|---|---|---|---|
| **mobile.de** | Suchergebnisse auf `suchen.mobile.de` (noch nicht an der Live-Seite geprüft) | Das Inserat (`/auto-inserat/…/<Nummer>.html` oder `/fahrzeuge/details.html?id=…`) öffnet sich, das Script klickt **„Dieses Inserat beanstanden“** und füllt den Dialog „Was möchtest du beanstanden?“ aus | ❌ noch nicht |
| **AutoScout24** | Ergebnislisten auf `www.autoscout24.de` | Die Melde-Seite `/report-fraud/<Inserats-ID>` öffnet sich direkt (dieselbe Seite wie „Inserat melden“ am Inserat) | ✅ |

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
4. **mobile.de:** auf **„Im Melde-Dialog einsetzen“** klicken. Das Inserat öffnet sich in einem kleinen Fenster, der Melde-Dialog ist schon ausgefüllt. Prüfen, „in gutem Glauben“ anhaken und **„Abschicken“**.
   **AutoScout24:** entweder „in gutem Glauben“ im Menü anhaken und **„Melden“** (direkt), oder **„Im Formular prüfen“** (Melde-Seite im Fenster, dort prüfen, anhaken und absenden).
5. Das Fenster schließt sich, der Button zeigt **„Gemeldet“**.

Für einen anderen Grund ohne Baustein: im Menü **„Ohne Baustein: nur … öffnen“**.

**Bausteine und Einstellungen:** im Menü auf ⚙, oder im Tampermonkey-Menü auf **„Bausteine und Einstellungen“**. Dort stellst du ein,

* was ein Klick auf „Melden“ tut (Menü mit Bausteinen oder gleich das offizielle Formular öffnen),
* ob **E-Mail und Name** für Rückfragen eingetragen werden sollen (beides optional). mobile.de schreibt dazu: Meldungen sind grundsätzlich anonym, mit E-Mail oder Telefonnummer bekommst du eine Rückmeldung zur Bearbeitung. Das Script trägt die Angaben nur in leere Felder des Formulars ein bzw. schickt sie beim direkten Melden mit. Ein Namensfeld hat nur AutoScout24.

Im Text eines Bausteins kannst du diese Platzhalter verwenden:

| Platzhalter | wird ersetzt durch |
|---|---|
| `{titel}` | Titel des Inserats |
| `{preis}` | angezeigter Preis, z. B. „12.990 €“ bzw. „€ 12.990,-“ |
| `{id}` | Inserats-Nummer |
| `{link}` | Link zum Inserat |

> Falls der Browser das Fenster blockiert, erscheint unten ein Hinweis. Erlaube dann Popups für die Seite, oder öffne das Inserat über den Hinweis in einem neuen Tab.

---

## 🏷️ Gründe

Die mitgelieferten Bausteine wählen diese Gründe aus. „Im Dialog wählen“ heißt: Der Text wird eingesetzt, den Grund klickst du selbst an. Über ⚙ kannst du jedem Baustein jeden Grund der Seite zuweisen.

| Baustein | mobile.de | AutoScout24 |
|---|---|---|
| Preis stimmt nicht | Angaben zum Fahrzeug › Preisangabe falsch | Das Inserat enthält falsche Informationen › Falscher Preis |
| Falsche Fahrzeugangaben | im Dialog wählen | Das Inserat enthält falsche Informationen › Sonstiges |
| Bereits verkauft | Angaben zum Fahrzeug › Fahrzeug bereits verkauft | Das Inserat enthält falsche Informationen › Sonstiges |
| Vorkasse verlangt | Angaben zum Anbieter › Vorauszahlung ohne Besichtigungsmöglichkeit | Betrügerisches Inserat › Der Verkäufer verlangt Geld, bevor ich das Fahrzeug gesehen habe |
| Händler gibt sich als privat aus | Angaben zum Anbieter › Händler gibt sich als privater Verkäufer aus | Betrügerisches Inserat › Professioneller Autohändler gibt vor, ein privater Verkäufer zu sein |
| Verdacht auf Betrug | im Dialog wählen | Betrügerisches Inserat › Sonstiges |

<details>
<summary>Alle Gründe der beiden Seiten (Stand 10/2026)</summary>

**mobile.de**, Dialog „Was möchtest du beanstanden?“:

* *Angaben zum Fahrzeug:* Beschädigung nicht gekennzeichnet · Kilometerstand falsch · Erstzulassung falsch · Preisangabe falsch · Ausstattung widersprüchlich · Kategorie / Marke / Modell falsch · Fahrzeug bereits verkauft
* *Angaben zum Anbieter:* Kontaktdaten falsch · Händler gibt sich als privater Verkäufer aus · Vorauszahlung ohne Besichtigungsmöglichkeit · Unseriöses Verkäuferverhalten
* *Sonstiges:* Ersatzteilangebot · Fahrzeug wird mehrfach angeboten · Kein Fahrzeugangebot · Verkauf mehrerer Fahrzeuge als Paket · Tauschangebot · Andere Gründe

**AutoScout24**, Melde-Seite (Kategorie › Problem):

* *Betrügerisches Inserat:* Der Verkäufer verlangt Geld, bevor ich das Fahrzeug gesehen habe · Unfallfahrzeug, aber nicht als solches gekennzeichnet · Professioneller Autohändler gibt vor, ein privater Verkäufer zu sein · Bilder aus anderen Inseraten kopiert · Sonstiges
* *Eigentümer antwortet nicht / verhält sich unfreundlich:* Verkäufer antwortet nicht · Verkäufer verhält sich unfreundlich · Sonstiges
* *Das Inserat enthält falsche Informationen:* Unfallfahrzeug, aber nicht als solches gekennzeichnet · Falsche Laufleistung · Falscher Preis · Falsche Marke oder Modell · Sonstiges
* *Sonstiges* (ohne Problem)

</details>

---

## 🔧 Wie es technisch funktioniert

| Situation | Was passiert |
|---|---|
| Ergebnisliste | Das Script erkennt die Karten (mobile.de über die Links aufs Inserat, AutoScout24 über die Inserats-ID der Karte) und setzt den Button unter den Preis, ohne Preis ans Ende der Karte. Nachgeladene Ergebnisse erfasst ein `MutationObserver`. AutoScout24 legt beim Überfahren einen Link über die ganze Karte; der Button liegt darüber. |
| „Im … einsetzen“ / „Im Formular prüfen“ | Ein Popup öffnet sich mit dem Hash `#asm-report`: bei mobile.de das Inserat, bei AutoScout24 die Melde-Seite. Dasselbe Script erkennt das Fenster und holt sich per `postMessage` den Auftrag (Grund, Text, Kontakt) aus der Übersicht. Bei mobile.de klickt es dann „Dieses Inserat beanstanden“. |
| Melde-Formular | Das Formular wird hervorgehoben (Cookie-Banner und andere schon vorhandene Dialoge werden übergangen). Den Grund klickt das Script Schritt für Schritt an: bei mobile.de Reiter und Auswahl, bei AutoScout24 Kategorie und Problem in den Auswahllisten. Text, E-Mail und Name kommen nur in leere Felder, so eingesetzt, dass das Frontend der Seite sie übernimmt. **Den Absenden-Button und das Häkchen „in gutem Glauben“ klickt es nie.** |
| Nach dem Absenden | Erkennt das Script die Bestätigung (mobile.de: „Deine Nachricht wurde an den mobile.de Kundenservice weitergeleitet.“, AutoScout24: „Vielen Dank für diese Meldung.“), meldet es „gemeldet“ an die Übersicht und schließt das Fenster. |
| Direkt melden (AutoScout24) | `POST /as24-search-funnel/abuse-report/submit-report` mit Inserats-ID, Grund, Text, E-Mail und Name, so wie die Melde-Seite sie schickt (abgelesen aus deren Script, Stand 10/2026). Die Texte werden vorher genauso bereinigt wie im Formular. Lehnt AutoScout24 ab, zeigt das Menü den Status und die Antwort an. |
| Speicher | Im Speicher des Userscript-Managers (`GM_setValue`): Bausteine und „Gemeldet“-Markierungen je Seite (`asm-templates-…`, `asm-reported-…`, höchstens 5.000), Einstellungen (`asm-settings`). |

> **Warum ein Fenster und kein Overlay?** Die Seiten erlauben in der Regel nicht, dass man sie in andere Seiten einbettet (Schutz gegen Clickjacking). Ein Popup mit der echten Seite ist der verlässliche Weg.

Alles Seitenspezifische (Link-Muster, Melde-Link, Gründe, Erfolgstexte, Anfrage fürs direkte Melden) steht gesammelt in `SITES` am Anfang von [`script.user.js`](script.user.js), alles andere in `CONFIG`.

### Direkt melden bei mobile.de

Geht noch nicht. Dafür muss bekannt sein, welche Anfrage „Abschicken“ im Dialog von mobile.de sendet. Sie steht in den Scripts der Seite auf `static.classistatic.de`, die aus der Testumgebung nicht erreichbar waren. Bis dahin meldest du bei mobile.de über den Dialog im Fenster.

---

## 🧪 Getestet

| Umgebung | Stand |
|---|---|
| AutoScout24, Live-Seite (Chromium, 10/2026) | ✅ Button an allen 20 Karten einer Ergebnisseite, unter dem Preis; Klick navigiert nicht; Menü mit Gründen; Melde-Seite im Popup mit Kategorie, Problem, Text, E-Mail und Name ausgefüllt, Häkchen nicht gesetzt, Absenden bleibt gesperrt; Nachfrage beim Schließen ohne Meldung; direkte Meldung erzeugt dieselbe Anfrage wie das Formular. **Beim Testen wurde keine echte Meldung abgeschickt** (die Anfrage wurde abgefangen). Ob AutoScout24 die direkte Meldung annimmt, zeigt sich also erst beim ersten echten Einsatz; bei einer Ablehnung zeigt das Menü die Antwort. |
| mobile.de, Melde-Dialog | ✅ mit dem Markup einer echten Inseratsseite (10/2026): Melde-Link gefunden, Dialog statt Cookie-Banner hervorgehoben, Reiter gewechselt, Grund ausgewählt, E-Mail eingesetzt, Häkchen nicht gesetzt. Nachgebaut und nicht an der echten Seite geprüft: das Textfeld (auf der gespeicherten Seite war es noch nicht zu sehen, vermutlich erscheint es erst nach der Wahl eines Grundes) und die Ansicht nach dem Abschicken (Bestätigungstext aus den Texten der Seite). |
| mobile.de, Suchergebnisse | ⏳ noch nicht geprüft. Getestet nur an nachgebauten Karten (Inserats-Links in beiden Formen, Preis, Neuaufbau der Liste) |
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
| **0.2.0** | AutoScout24: Karten über ihre Inserats-ID erkannt, Melde-Seite direkt im Popup, alle Gründe (Kategorie › Problem), E-Mail und Name, **direkt melden** aus dem Menü; Button bleibt klickbar, wenn AutoScout24 beim Überfahren einen Link über die Karte legt. mobile.de: Melde-Link „Dieses Inserat beanstanden“, alle 17 Gründe in drei Reitern, E-Mail-Feld, Bestätigungstext. Zwei neue Bausteine („Vorkasse verlangt“, „Händler gibt sich als privat aus“), Bausteine wählen jetzt auch den Grund. |
| **0.1.0** | Erste Version: Melden-Button in den Ergebnislisten von mobile.de und AutoScout24, Menü mit Bausteinen, offizieller Melde-Dialog im Popup mit eingesetztem Text und E-Mail, „Gemeldet“-Markierung, Einstellungen |

---

## 🗺️ Ideen für später

* Direkt melden auch bei mobile.de, sobald die Anfrage des Dialogs bekannt ist.
* Startseite `www.mobile.de` mit ihren Empfehlungen.
* „Nutzer melden“ im Nachrichten-Postfach von mobile.de.

---

## ⚖️ Disclaimer

> Dieses Skript ist ein inoffizielles Tool und steht in keiner Verbindung zu mobile.de oder AutoScout24. Die Nutzung erfolgt auf eigene Gefahr. Bitte melde nur Inserate, die tatsächlich gegen die Regeln verstoßen. Missbräuchliche Massenmeldungen können zur Sperrung deines Kontos führen.

* Es liest keine Passwörter oder Nachrichten aus.
* Es nutzt keine externen Server, alles läuft lokal in deinem Browser. Das Logo im Button ist direkt im Script eingebettet.
* Im Fenster füllt es nur das offizielle Formular aus. Abgeschickt wird nur durch deinen Klick.
* Beim direkten Melden auf AutoScout24 schickt es genau eine Anfrage an AutoScout24, und zwar erst, wenn du die Erklärung „in gutem Glauben“ angehakt und auf „Melden“ geklickt hast. Es ist dieselbe Anfrage, die auch die Melde-Seite schickt.
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
