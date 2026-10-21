// ==UserScript==
// @name          Auto Super-Meldescript (mobile.de & AutoScout24)
// @namespace     https://github.com/RainbowLabsInc/Auto_Super_Meldescript
// @description   Fügt in den Suchergebnissen von mobile.de und AutoScout24.de an jedem Inserat einen „Melden“-Button ein. Grund und Text kommen aus selbst konfigurierbaren Bausteinen und werden in das offizielle Melde-Formular eingesetzt, das sich in einem kleinen Popup öffnet. Wahlweise geht das Melden auch direkt aus der Übersicht.
// @author        RainbowlabsInc
// @copyright     2026, RainbowlabsInc
// @license       MIT
// @version       0.3.1
// @icon          https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/assets/icon48.png
// @homepage      https://github.com/RainbowLabsInc/Auto_Super_Meldescript
// @updateURL     https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js
// @downloadURL   https://github.com/RainbowLabsInc/Auto_Super_Meldescript/raw/main/script.user.js
// @match         https://suchen.mobile.de/*
// @match         https://www.autoscout24.de/*
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_registerMenuCommand
// @run-at        document-idle
// ==/UserScript==

/*
 * Funktionsweise
 * --------------
 * 1. Übersicht (Suchergebnisse):
 *    Jede Inserats-Karte bekommt unter dem Preis einen „Melden“-Button. Ein Klick öffnet ein
 *    kleines Menü am Button: Baustein (Grund + Text) wählen, Text bei Bedarf anpassen.
 *
 * 2. Offizielles Formular im Popup:
 *    Ein kleines Popup-Fenster (Fenstername „asm-report“, URL-Hash #asm-report) öffnet bei
 *    mobile.de das Inserat und klickt dort „Dieses Inserat beanstanden“, bei AutoScout24 gleich
 *    die eigene Melde-Seite. Dasselbe Script blendet alles außer dem Formular aus, wählt den
 *    Grund des Bausteins und setzt Text und Kontakt ein. Absenden musst du selbst. Der Status
 *    geht per postMessage an die Übersicht; nach dem Absenden schließt sich das Popup.
 *    (Ein eingebettetes iframe statt Popup wäre unsicher: Die Seiten verbieten in der Regel
 *    das Einbetten per X-Frame-Options/CSP.)
 *
 * 3. Direkt aus der Übersicht (ohne Popup), wenn SITE.direct eingetragen ist: schickt dieselbe
 *    Anfrage wie das offizielle Formular, erst nach Bestätigung „in gutem Glauben“.
 *
 * Hinweis: Beide Seiten ändern ihr Frontend häufig. Das Script sucht Elemente daher zuerst
 * über feste Merkmale und fällt sonst auf Text und Struktur zurück. Alles Seitenspezifische
 * steht gesammelt in SITES, alles andere in CONFIG.
 */

(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Seiten
    // ------------------------------------------------------------------

    const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    const SITES = [
        {
            id: 'mobile',
            label: 'mobile.de',
            hosts: ['suchen.mobile.de'],
            // Inseratsseite (Stand 10/2026): /auto-inserat/<name>/<nummer>.html, ebenso
            // /wohnwagen-inserat/… usw.; ältere Links: /fahrzeuge/details.html?id=<nummer>
            adIdFromUrl(url) {
                let u;
                try { u = new URL(url, location.href); } catch (e) { return null; }
                if (!this.hosts.includes(u.hostname)) return null;
                const m = u.pathname.match(/^\/[a-z]+(?:-[a-z]+)*-inserat\/[^/]+\/(\d+)\.html$/);
                if (m) return m[1];
                const id = u.pathname === '/fahrzeuge/details.html' ? u.searchParams.get('id') : null;
                return id && /^\d+$/.test(id) ? id : null;
            },
            adLinkSelector: 'a[href*="-inserat/"], a[href*="/fahrzeuge/details.html"]',
            // Bezeichnung in Hinweisen
            form: { nom: 'der Melde-Dialog', akk: 'den Melde-Dialog', akkOff: 'den offiziellen Melde-Dialog', dat: 'im Melde-Dialog' },
            // Link „Dieses Inserat beanstanden“ unter den Anbieter-Informationen (Stand 10/2026,
            // auf der Seite zweimal: Desktop und Mobil)
            triggerSelectors: ['button[data-testid="vip-complaint-form-link"]'],
            triggerText: /^\s*(dieses\s+)?inserat\s+beanstanden\s*$/i,
            triggerTextLoose: /inserat\s+beanstanden/i,
            // Ein neu aufgetauchter Dialog zählt nur, wenn dieser Text darin vorkommt
            // (sonst könnte z. B. ein verspätetes Cookie-Banner als Melde-Dialog gelten).
            // Der Dialog heißt „Was möchtest du beanstanden?“.
            dialogText: /beanstand/i,
            successText: /an den mobile\.de kundenservice weitergeleitet/i,
            // Gründe im offiziellen Dialog: { id, label, path: [Beschriftungen, die nacheinander
            // angeklickt werden] }. Der Dialog hat drei Reiter mit je einer Liste; api ist der Wert
            // des Auswahlfelds (name="reasonName"), Stand 10/2026.
            reasons: [
                ['fz-schaden', 'Angaben zum Fahrzeug', 'Beschädigung nicht gekennzeichnet', 'UNSIGNED_DAMAGED'],
                ['fz-km', 'Angaben zum Fahrzeug', 'Kilometerstand falsch', 'INCORRECT_MILEAGE'],
                ['fz-ez', 'Angaben zum Fahrzeug', 'Erstzulassung falsch', 'INCORRECT_REGISTRATION'],
                ['fz-preis', 'Angaben zum Fahrzeug', 'Preisangabe falsch', 'INCORRECT_PRICE'],
                ['fz-ausstattung', 'Angaben zum Fahrzeug', 'Ausstattung widersprüchlich', 'CONTRADICTORY_VEHICLE_DATA'],
                ['fz-modell', 'Angaben zum Fahrzeug', 'Kategorie / Marke / Modell falsch', 'WRONG_CATEGORY'],
                ['fz-verkauft', 'Angaben zum Fahrzeug', 'Fahrzeug bereits verkauft', 'ALREADY_SOLD'],
                ['anb-kontakt', 'Angaben zum Anbieter', 'Kontaktdaten falsch', 'INCOMPLETE_CUSTOMERDATA'],
                ['anb-haendler', 'Angaben zum Anbieter', 'Händler gibt sich als privater Verkäufer aus', 'HIDDEN_DEALER'],
                ['anb-vorkasse', 'Angaben zum Anbieter', 'Vorauszahlung ohne Besichtigungsmöglichkeit', 'PREPAYMENT'],
                ['anb-unserioes', 'Angaben zum Anbieter', 'Unseriöses Verkäuferverhalten', 'UNTRUSTWORTHY_ON_SITE'],
                ['sonst-ersatzteil', 'Sonstiges', 'Ersatzteilangebot', 'SPARE_PART'],
                ['sonst-mehrfach', 'Sonstiges', 'Fahrzeug wird mehrfach angeboten', 'MULTIPLE_INSERTIONS'],
                ['sonst-kein-fz', 'Sonstiges', 'Kein Fahrzeugangebot', 'UNRELATED_INDUSTRY'],
                ['sonst-paket', 'Sonstiges', 'Verkauf mehrerer Fahrzeuge als Paket', 'PACKAGE_DEAL'],
                ['sonst-tausch', 'Sonstiges', 'Tauschangebot', 'TRADING_OFFER'],
                ['sonst-andere', 'Sonstiges', 'Andere Gründe', 'OTHER_COMPLAIN_REASON'],
            ].map(([id, tab, label, api]) => ({ id, api, label: `${tab} › ${label}`, path: [tab, label] })),
            defaultReasons: {
                'std-preis': 'fz-preis', 'std-angaben': 'sonst-andere', 'std-verkauft': 'fz-verkauft',
                'std-vorkasse': 'anb-vorkasse', 'std-haendler': 'anb-haendler', 'std-betrug': 'sonst-andere',
            },
            textMaxLength: 0,
            // Direkt aus der Übersicht: dieselbe Anfrage, die „Abschicken“ im Dialog sendet (abgelesen
            // aus dem Script der Inseratsseite, Stand 10/2026). Der Dialog schickt sie ohne Cookies
            // an www.mobile.de, also ohne Login; „in gutem Glauben“ prüft nur der Dialog selbst.
            // Ein Namensfeld gibt es nicht.
            direct: {
                confirmText: 'Ich erkläre, dass ich in gutem Glauben handle und meine Meldung so genau und vollständig ist wie möglich.',
                withName: false,
                async send(info, { reason, text, email }) {
                    const res = await fetch('https://www.mobile.de/api/blame', {
                        method: 'PUT',
                        headers: {
                            'content-type': 'application/json',
                            'x-mobile-api-version': '12',
                            'x-mobile-client': 'de.mobile.consumer-webapp',
                        },
                        // Leere Felder lässt der Dialog weg
                        body: JSON.stringify({
                            adId: Number(info.adId),
                            reasonName: reason.api,
                            ...(text ? { message: text } : {}),
                            ...(email ? { email } : {}),
                        }),
                    });
                    return { code: res.status, detail: res.ok ? '' : await responseDetail(res) };
                },
            },
        },
        {
            id: 'autoscout',
            label: 'AutoScout24',
            hosts: ['www.autoscout24.de'],
            // Inseratsseite: /angebote/<name>-<uuid>; Melde-Seite: /report-fraud/<uuid>
            adIdFromUrl(url) {
                let u;
                try { u = new URL(url, location.href); } catch (e) { return null; }
                if (!this.hosts.includes(u.hostname) || !/^\/(angebote|report-fraud)\//.test(u.pathname)) return null;
                const m = u.pathname.match(UUID_RE);
                return m ? m[0].toLowerCase() : null;
            },
            adLinkSelector: 'a[href*="/angebote/"]',
            form: { nom: 'das Melde-Formular', akk: 'das Melde-Formular', akkOff: 'das offizielle Melde-Formular', dat: 'im Melde-Formular' },
            // Karten der Ergebnisliste (Stand 10/2026) haben keinen Link aufs Inserat, die Seite
            // navigiert per Script. Die Inserats-Nummer steht in data-guid.
            cardSelector: 'article[data-guid]',
            cardAdId: (card) => { const m = (card.dataset.guid || '').match(UUID_RE); return m ? m[0].toLowerCase() : null; },
            // /angebote/<uuid> leitet auf die volle Adresse des Inserats weiter
            adUrl: (adId) => `https://www.autoscout24.de/angebote/${adId}`,
            // „Inserat melden“ auf der Inseratsseite führt auf eine eigene Melde-Seite; das Popup
            // öffnet sie direkt
            reportUrl: (adId) => `https://www.autoscout24.de/report-fraud/${adId}?culture=de-DE`,
            triggerSelectors: ['button[class*="FraudReportLink_reportFraudButton"]'],
            triggerText: /^\W*inserat\s+melden\s*$/i,
            triggerTextLoose: /inserat\s+melden/i,
            formSelectors: ['form#report-form'],
            dialogText: /bedenken bezüglich dieses inserats|inserat melden/i,
            successText: /vielen dank für (diese|deine|ihre) meldung/i,
            successSelectors: ['#backToSearch'],
            // Kategorie und Problem sind zwei Auswahllisten, deren Einträge erst nach dem Aufklappen
            // im Dokument stehen ({ open }: dieses Feld anklicken)
            reasons: [
                ['fraud-money', 'Betrügerisches Inserat', 'Der Verkäufer verlangt Geld, bevor ich das Fahrzeug gesehen habe', 'FM'],
                ['fraud-accident', 'Betrügerisches Inserat', 'Unfallfahrzeug, aber nicht als solches gekennzeichnet', 'D'],
                ['fraud-dealer', 'Betrügerisches Inserat', 'Professioneller Autohändler gibt vor, ein privater Verkäufer zu sein', 'A'],
                ['fraud-pictures', 'Betrügerisches Inserat', 'Bilder aus anderen Inseraten kopiert', 'FP'],
                ['fraud-other', 'Betrügerisches Inserat', 'Sonstiges', 'F'],
                ['owner-noreply', 'Eigentümer antwortet nicht / verhält sich unfreundlich', 'Verkäufer antwortet nicht', 'OR'],
                ['owner-unfriendly', 'Eigentümer antwortet nicht / verhält sich unfreundlich', 'Verkäufer verhält sich unfreundlich', 'OU'],
                ['owner-other', 'Eigentümer antwortet nicht / verhält sich unfreundlich', 'Sonstiges', 'O'],
                ['info-accident', 'Das Inserat enthält falsche Informationen', 'Unfallfahrzeug, aber nicht als solches gekennzeichnet', 'D'],
                ['info-mileage', 'Das Inserat enthält falsche Informationen', 'Falsche Laufleistung', 'KM'],
                ['info-price', 'Das Inserat enthält falsche Informationen', 'Falscher Preis', 'P'],
                ['info-model', 'Das Inserat enthält falsche Informationen', 'Falsche Marke oder Modell', 'B'],
                ['info-other', 'Das Inserat enthält falsche Informationen', 'Sonstiges', 'I'],
                ['other', 'Sonstiges', '', 'F'],
            ].map(([id, category, problem, api]) => ({
                id, api,
                label: problem ? `${category} › ${problem}` : category,
                path: problem
                    ? [{ open: '#issue-category' }, category, { open: '#abuse-sub-category' }, problem]
                    : [{ open: '#issue-category' }, category],
            })),
            defaultReasons: {
                'std-preis': 'info-price', 'std-angaben': 'info-other', 'std-verkauft': 'info-other',
                'std-vorkasse': 'fraud-money', 'std-haendler': 'fraud-dealer', 'std-betrug': 'fraud-other',
            },
            textMaxLength: 0,
            // Direkt aus der Übersicht: dieselbe Anfrage, die das Formular beim Absenden schickt
            // (abgelesen aus dem Script der Melde-Seite, Stand 10/2026). Ohne Login und ohne Token.
            direct: {
                confirmText: 'Ich erkläre, dass ich in gutem Glauben handle und meine Meldung so genau und vollständig ist wie möglich.',
                withName: true,
                async send(info, { reason, text, email, name }) {
                    const res = await fetch('/as24-search-funnel/abuse-report/submit-report', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            listingGuid: cleanLikeAs24(info.adId),
                            reasonId: reason.api,
                            email: cleanLikeAs24(email),
                            comment: cleanLikeAs24(text),
                            name: cleanLikeAs24(name),
                            clientId: 'web-app',
                        }),
                    });
                    return { code: res.status, detail: res.ok ? '' : await responseDetail(res) };
                },
            },
        },
    ];

    // Dieselbe Bereinigung, die das Melde-Formular von AutoScout24 vor dem Absenden auf jedes
    // Feld anwendet (entfernt HTML, Script-Reste und SQL-artige Muster)
    function cleanLikeAs24(value) {
        let r = String(value || '');
        if (!r) return '';
        [/VALUES\s*\([^)]{0,1000}\)/gi, /^[ \t]*--[^\n]{0,1000}/gm, /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /javascript:/gi, /data:[^;]+;/gi,
            /on\w+\s*=\s*(?:"[^"]{0,1000}"|'[^']{0,1000}'|[^\s>]{0,1000})/gi, /<[^>]{0,1000}>/g, /[<>`]/g, /\${.*?}/g, /@import/gi, /eval\s*\(.*?\)/gi,
        ].forEach(re => { r = r.replace(re, ''); });
        return r.replace(/;\s*$/g, '').replace(/'\s*;\s*'/g, '').replace(/"\s*;\s*"/g, '').replace(/`\s*;\s*`/g, '');
    }

    // Antworttext für die Fehleranzeige (gekürzt, ohne HTML-Tags)
    async function responseDetail(res) {
        try {
            return (await res.text()).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
        } catch (e) {
            return '';
        }
    }

    const CONFIG = {
        hash: '#asm-report',
        msgType: 'asm-report',
        // Fenstername des Popups – bleibt erhalten, auch wenn die Seite den URL-Hash entfernt
        popupName: 'asm-report',
        // Zustand des Popups über Seitenwechsel hinweg (sessionStorage des Popups)
        popupStateKey: 'asm-popup-state',
        // Wie lange auf den Melde-Link / -Dialog gewartet wird
        triggerTimeoutMs: 12000,
        // Wie lange auf einer Melde-Seite auf das Formular gewartet wird
        formTimeoutMs: 8000,
        // Abstand zwischen Klick-Versuchen auf den Melde-Link
        clickRetryMs: 1500,
        // Wie lange das Popup auf den Auftrag (Baustein) aus der Übersicht wartet
        jobTimeoutMs: 2000,
        // Spätestens dann meldet das Popup, was sich nicht einsetzen ließ
        prefillReportMs: 5000,
        popupWidth: 640,
        popupHeight: 820,
        // Mögliche Container des Melde-Dialogs
        dialogSelectors: [
            '[role="dialog"]',
            '[aria-modal="true"]',
            'dialog[open]',
        ],
        // Beschriftung des Absenden-Buttons im Melde-Dialog
        submitText: /(absenden|abschicken|senden|melden|beanstanden)/i,
        // Speicher (Userscript-Manager, sonst localStorage)
        reportedKey: (site) => `asm-reported-${site}`,
        templatesKey: (site) => `asm-templates-${site}`,
        lastTemplateKey: (site) => `asm-last-template-${site}`,
        settingsKey: 'asm-settings',
        maxReported: 5000,
        defaultSettings: {
            // 'menu': Menü mit Bausteinen; 'dialog': gleich den offiziellen Dialog öffnen
            clickAction: 'menu',
            // Werden nur in leere Felder des Melde-Formulars eingetragen bzw. beim direkten Melden mitgeschickt
            contact: '',
            name: '',
        },
        // Fertige Bausteine; Platzhalter: {titel}, {preis}, {id}, {link}. Feste IDs, damit der
        // zuletzt benutzte Baustein auch ohne gespeicherte eigene Bausteine wiedererkannt wird.
        // Den Grund je Seite legt SITE.defaultReasons fest; ohne Grund wählst du ihn im Dialog.
        defaultTemplates: [
            { id: 'std-preis', name: 'Preis stimmt nicht',
                text: 'Der angegebene Preis ({preis}) ist nicht der tatsächliche Verkaufspreis. Laut Beschreibung wird ein anderer Preis verlangt.' },
            { id: 'std-angaben', name: 'Falsche Fahrzeugangaben',
                text: 'Die Angaben zum Fahrzeug (z. B. Kilometerstand, Erstzulassung, Zustand oder Ausstattung) passen nicht zu Bildern und Beschreibung: ' },
            { id: 'std-verkauft', name: 'Bereits verkauft',
                text: 'Das Fahrzeug ist laut Anbieter bereits verkauft, das Inserat ist aber weiterhin online.' },
            { id: 'std-vorkasse', name: 'Vorkasse verlangt',
                text: 'Der Anbieter verlangt Geld (z. B. Anzahlung, Reservierungs- oder Transportgebühr), bevor man das Fahrzeug besichtigen kann.' },
            { id: 'std-haendler', name: 'Händler gibt sich als privat aus',
                text: 'Das Fahrzeug wird als Privatverkauf angeboten, der Anbieter ist aber offensichtlich gewerblicher Händler: ' },
            { id: 'std-betrug', name: 'Verdacht auf Betrug',
                text: 'Das Inserat wirkt betrügerisch: ' },
        ],
    };

    // Nur auf den Seiten oben laufen – zusätzlich zu @match, falls der Script-Manager
    // die Header ignoriert oder das Script manuell mit breiteren Regeln eingebunden wird.
    const SITE = SITES.find(s => s.hosts.includes(window.location.hostname));
    if (window.location.protocol !== 'https:' || !SITE) return;

    // Läuft das Script doppelt (z. B. zweimal installiert), arbeitet nur die zuerst gestartete Kopie
    const root = document.documentElement;
    if (root.hasAttribute('data-asm')) {
        console.warn('[Auto Super-Meldescript] läuft bereits, diese Kopie bleibt inaktiv. Bitte nur einmal installieren.');
        return;
    }
    root.setAttribute('data-asm', SITE.id);

    const isDetailPage = !!SITE.adIdFromUrl(window.location.href);

    // ------------------------------------------------------------------
    // Gemeinsame Helfer
    // ------------------------------------------------------------------

    const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

    function load(key, fallback) {
        try {
            if (hasGM) return GM_getValue(key, fallback);
            const raw = localStorage.getItem(key);
            return raw == null ? fallback : JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function save(key, value) {
        try {
            if (hasGM) GM_setValue(key, value);
            else localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    function isVisible(el) {
        if (!el || !el.isConnected) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function loadReported() {
        const data = load(CONFIG.reportedKey(SITE.id), {});
        return data && typeof data === 'object' ? data : {};
    }

    function saveReported(adId) {
        const data = loadReported();
        data[adId] = Date.now();
        // Älteste Einträge zuerst verwerfen
        const ids = Object.keys(data);
        if (ids.length > CONFIG.maxReported) {
            ids.sort((a, b) => data[a] - data[b]).slice(0, ids.length - CONFIG.maxReported).forEach(id => delete data[id]);
        }
        save(CONFIG.reportedKey(SITE.id), data);
    }

    function loadSettings() {
        const s = load(CONFIG.settingsKey, null);
        return { ...CONFIG.defaultSettings, ...(s && typeof s === 'object' ? s : {}) };
    }

    // Wert so setzen, dass auch React/Vue die Änderung mitbekommt
    function setFieldValue(field, value) {
        const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
            : field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // RainbowLabsInc-Logo (48x48 PNG, eingebettet – das Script lädt nichts von externen Servern)
    const logoDataUri = 'data:image/png;base64,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';
    const logoImg = `<img class="asm-logo" src="${logoDataUri}" alt="" aria-hidden="true" width="20" height="20">`;

    const checkSvg = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    // ------------------------------------------------------------------
    // Teil 1: Inserat im Popup – Melde-Dialog öffnen und vorausfüllen
    // ------------------------------------------------------------------

    function runReportPopup() {
        const target = window.opener;

        // Zustand über Seitenwechsel im Popup hinweg (z. B. falls der Melde-Link auf eine eigene Seite führt)
        const readState = () => {
            try { return JSON.parse(sessionStorage.getItem(CONFIG.popupStateKey) || 'null') || {}; } catch (e) { return {}; }
        };
        const writeState = (patch) => {
            try { sessionStorage.setItem(CONFIG.popupStateKey, JSON.stringify({ ...readState(), ...patch })); } catch (e) { /* egal */ }
        };
        // Frisch aus der Übersicht geöffnet (Hash gesetzt): neu anfangen. Das Fenster wird für
        // das nächste Inserat wiederverwendet, sein sessionStorage bleibt dabei erhalten.
        let state = window.location.hash === CONFIG.hash ? {} : readState();
        if (!state.adId) {
            state = { adId: SITE.adIdFromUrl(window.location.href) };
            try { sessionStorage.setItem(CONFIG.popupStateKey, JSON.stringify(state)); } catch (e) { /* egal */ }
        }
        const adId = state.adId;

        function post(status, extra = {}) {
            if (!target) return;
            try {
                target.postMessage({ type: CONFIG.msgType, status, adId, ...extra }, window.location.origin);
            } catch (e) { /* Opener geschlossen */ }
        }

        // Auftrag aus der Übersicht: { choices: [...], text, contact } oder null (nur Dialog öffnen)
        function receiveJob() {
            if ('job' in state) return Promise.resolve(state.job);
            return new Promise(resolve => {
                const done = (job) => {
                    window.removeEventListener('message', onMsg);
                    clearTimeout(timer);
                    writeState({ job });
                    state.job = job;
                    resolve(job);
                };
                const onMsg = (e) => {
                    if (e.origin !== window.location.origin || e.source !== target) return;
                    const d = e.data;
                    if (d && d.type === CONFIG.msgType && d.cmd === 'job') done(d.job || null);
                };
                window.addEventListener('message', onMsg);
                const timer = setTimeout(() => done(null), CONFIG.jobTimeoutMs);
                post('ready');
            });
        }

        const style = document.createElement('style');
        style.textContent = `
            html.asm-focus, html.asm-focus body { background: transparent !important; overflow: hidden !important; }
            html.asm-focus body * { visibility: hidden !important; }
            html.asm-focus [data-asm-dialog], html.asm-focus [data-asm-dialog] * { visibility: visible !important; }
        `;
        (document.head || document.documentElement).appendChild(style);

        function findTrigger() {
            for (const sel of SITE.triggerSelectors) {
                const el = Array.from(document.querySelectorAll(sel)).find(isVisible);
                if (el) return el;
            }
            // Nur sichtbare Kandidaten – Seiten rendern Buttons teils doppelt (Desktop/Mobil)
            const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], [role="menuitem"]')).filter(isVisible);
            const byText = (re) => candidates.find(el => {
                const label = [el.textContent, el.getAttribute('aria-label'), el.getAttribute('title')].filter(Boolean).join(' ');
                return re.test(label.trim());
            });
            return byText(SITE.triggerText) || byText(SITE.triggerTextLoose) || null;
        }

        // Dialoge/Formulare, die schon vor dem Klick da waren (z. B. Cookie-Banner, Suchfeld), ignorieren
        let preExisting = new Set();
        const allDialogs = () => CONFIG.dialogSelectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
        const allForms = () => Array.from(document.querySelectorAll('form, [role="radiogroup"]'));

        function findDialog() {
            for (const sel of SITE.formSelectors || []) {
                const form = Array.from(document.querySelectorAll(sel)).find(isVisible);
                if (form) return form;
            }
            const dialog = allDialogs().find(el => !preExisting.has(el) && isVisible(el) && SITE.dialogText.test(el.textContent));
            if (dialog) return dialog;
            // Fallback: neu aufgetauchtes Formular mit Eingabefeldern rund ums Melden
            const form = allForms().find(el => !preExisting.has(el) && isVisible(el)
                && el.querySelector('input, textarea, select') && SITE.dialogText.test(el.textContent));
            if (!form) return null;
            // Bis zum fixierten Container (Modal) hochlaufen, sonst das Formular selbst nehmen
            for (let el = form; el && el !== document.body; el = el.parentElement) {
                if (getComputedStyle(el).position === 'fixed') return el;
            }
            return form;
        }

        // Nur ein Modal hervorheben; ein Formular auf einer eigenen Seite bleibt, wie es ist
        function isModal(dialog) {
            if (dialog.matches('[role="dialog"], [aria-modal="true"], dialog')) return true;
            for (let el = dialog; el && el !== document.body; el = el.parentElement) {
                if (getComputedStyle(el).position === 'fixed') return true;
            }
            return false;
        }

        // Erfolgsmeldung im Dialog oder in einem Hinweis der Seite. Nicht im ganzen Inserat
        // suchen: Dort kann „Vielen Dank“ auch in der Beschreibung des Anbieters stehen.
        function successVisible(dialog) {
            if ((SITE.successSelectors || []).some(sel => Array.from(document.querySelectorAll(sel)).some(isVisible))) return true;
            const places = [dialog, ...document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')];
            return places.some(p => p && isVisible(p) && SITE.successText.test(p.innerText || ''));
        }

        // Nach einem Seitenwechsel infolge des Absendens: ganze Seite prüfen
        function pageShowsSuccess() {
            return SITE.successText.test(document.body ? document.body.innerText : '');
        }

        function waitFor(fn, timeoutMs) {
            return new Promise(resolve => {
                const found = fn();
                if (found) return resolve(found);
                const obs = new MutationObserver(() => {
                    const hit = fn();
                    if (hit) { obs.disconnect(); clearTimeout(timer); resolve(hit); }
                });
                obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
                const timer = setTimeout(() => { obs.disconnect(); resolve(fn() || null); }, timeoutMs);
            });
        }

        function watchDialog(dialog, prefill) {
            let finished = false;
            let closing = false;
            let submitted = false;
            let filledReported = false;

            // Popup schließen – egal ob gemeldet oder abgebrochen. Die Übersicht fragt
            // selbst nach, falls keine Meldung erkannt wurde.
            const finish = (success) => {
                if (finished) return;
                finished = true;
                obs.disconnect();
                clearTimeout(prefillTimer);
                clearInterval(prefillPoll);
                document.removeEventListener('click', onClick, true);
                document.removeEventListener('submit', onSubmit, true);
                document.documentElement.classList.remove('asm-focus');
                post('closed', { success });
                if (target) setTimeout(() => window.close(), success ? 1500 : 300);
            };

            const reportFilled = (force) => {
                if (filledReported || !prefill) return;
                const result = prefill.step(dialog);
                if (!result.done && !force) return;
                filledReported = true;
                clearInterval(prefillPoll);
                post('filled', { missing: result.missing });
            };
            const prefillTimer = setTimeout(() => reportFilled(true), CONFIG.prefillReportMs);
            // Auch ohne Änderung im Dokument weiter versuchen (z. B. wenn eine Auswahlliste auf den
            // ersten Klick noch nicht aufging, weil die Seite noch lädt)
            const prefillPoll = setInterval(() => { if (!submitted && !closing) reportFilled(false); }, 400);

            // Klick auf „Absenden“ o. Ä. im Dialog merken
            const onClick = (e) => {
                const btn = e.target.closest('button, [type="submit"], [role="button"]');
                if (btn && dialog.contains(btn) && CONFIG.submitText.test(btn.textContent || btn.value || '')) {
                    submitted = true;
                    writeState({ submitted: true });
                }
            };
            const onSubmit = (e) => {
                if (dialog.contains(e.target)) { submitted = true; writeState({ submitted: true }); }
            };
            document.addEventListener('click', onClick, true);
            document.addEventListener('submit', onSubmit, true);

            // Nach dem Absenden zeigt der Dialog oft eine Bestätigung ohne Eingabefelder
            const showsConfirmation = () => submitted && isVisible(dialog)
                && !Array.from(dialog.querySelectorAll('input:not([type="hidden"]), textarea, select')).some(isVisible);

            const obs = new MutationObserver(() => {
                if (closing || finished) return;
                // Erfolg, während der Dialog noch offen ist (Danke-Text oder Bestätigungsansicht)
                if ((submitted && successVisible(dialog)) || showsConfirmation()) {
                    closing = true;
                    post('success');
                    finish(true);
                    return;
                }
                // Mehrstufige Dialoge: weitere Auswahl einsetzen, sobald sie erscheint
                if (!submitted && prefill) reportFilled(false);
                // Dialog geschlossen? (entfernt oder unsichtbar, und kein neuer Dialog offen)
                if (!isVisible(dialog)) {
                    const next = findDialog();
                    if (next && next !== dialog) {
                        // Dialog wurde ersetzt (z. B. Schritt 2 / Danke-Seite) – weiter beobachten
                        dialog.removeAttribute('data-asm-dialog');
                        dialog = next;
                        dialog.setAttribute('data-asm-dialog', '');
                        return;
                    }
                    // Fokus-Modus aufheben, damit innerText auch Hinweise außerhalb des Dialogs sieht,
                    // dann kurz warten – eine Erfolgsmeldung kann erst nach dem Schließen erscheinen
                    closing = true;
                    document.documentElement.classList.remove('asm-focus');
                    setTimeout(() => finish(submitted || successVisible(null)), 1200);
                }
            });
            obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
            if (prefill) reportFilled(false);
        }

        function showDialog(dialog, job) {
            dialog.setAttribute('data-asm-dialog', '');
            if (isModal(dialog)) document.documentElement.classList.add('asm-focus');
            else dialog.scrollIntoView({ block: 'start' });
            post('dialog-open');
            watchDialog(dialog, job ? createPrefill(job) : null);
        }

        (async () => {
            const job = await receiveJob();

            // Nach einem Seitenwechsel im Popup oder auf einer eigenen Melde-Seite (SITE.reportUrl):
            // Formular schon da, oder Erfolgsseite nach dem Absenden?
            if (state.clicked || !isDetailPage || SITE.reportUrl) {
                if (state.submitted && pageShowsSuccess()) {
                    post('success');
                    post('closed', { success: true });
                    if (target) setTimeout(() => window.close(), 1500);
                    return;
                }
                const form = await waitFor(findDialog, CONFIG.formTimeoutMs);
                if (form) { showDialog(form, job); return; }
            }

            const trigger = await waitFor(findTrigger, CONFIG.triggerTimeoutMs);
            if (!trigger) {
                post('trigger-not-found');
                return;
            }
            preExisting = new Set([...allDialogs(), ...allForms()].filter(isVisible));
            trigger.scrollIntoView({ block: 'center' });

            // Der Link ist oft schon sichtbar, bevor das Frontend die Klick-Logik angehängt hat.
            // Darum mehrfach klicken, bis der Dialog erscheint.
            let dialog = null;
            const deadline = Date.now() + CONFIG.triggerTimeoutMs;
            while (!dialog && Date.now() < deadline) {
                const btn = findTrigger() || trigger;
                writeState({ clicked: true });
                btn.click();
                dialog = await waitFor(findDialog, CONFIG.clickRetryMs);
            }
            if (!dialog) {
                post('dialog-not-found');
                return;
            }
            showDialog(dialog, job);
        })();
    }

    // Setzt Grund (Auswahl nacheinander), Text und Kontakt in den Dialog ein. Klickt nie auf
    // „Absenden“. step() wird bei jeder Änderung im Dialog erneut aufgerufen, damit auch
    // Auswahlfelder späterer Schritte ausgefüllt werden.
    function createPrefill(job) {
        // Auswahl: Beschriftungen, die nacheinander angeklickt werden, oder { open: Selektor }
        // für eine Auswahlliste, die erst aufgeklappt werden muss
        const pending = (job.choices || []).filter(Boolean).slice();
        // Felder, die nur eingetragen werden, wenn sie leer sind: [Selektor, Wert, Name für den Hinweis]
        const fields = [
            ['textarea', job.text, 'Text'],
            // mobile.de: type="text" name="email"
            ['input[type="email"], input[name="email"]', job.contact, ''],
            ['input[name="name"], input[autocomplete="name"]', job.name, ''],
        ].filter(f => f[1]);
        let lastOpen = 0;

        const choiceSelector = 'label, button, [role="radio"], [role="option"], [role="button"], [role="menuitem"], [role="tab"], li, a';

        function findChoice(dialog, label) {
            const want = norm(label);
            const select = Array.from(dialog.querySelectorAll('select')).filter(isVisible)
                .find(s => Array.from(s.options).some(o => norm(o.textContent) === want));
            if (select) return { select, option: Array.from(select.options).find(o => norm(o.textContent) === want) };
            const candidates = Array.from(dialog.querySelectorAll(choiceSelector)).filter(isVisible);
            const pick = (test) => {
                const hits = candidates.filter(c => test(norm(c.textContent)));
                // Das innerste Element nehmen (z. B. das Label statt der ganzen Liste)
                return hits.find(h => !hits.some(o => o !== h && h.contains(o))) || null;
            };
            const el = pick(t => t === want) || pick(t => t.startsWith(want));
            return el ? { el } : null;
        }

        function activate(hit) {
            if (hit.select) {
                setFieldValue(hit.select, hit.option.value);
                return;
            }
            const input = hit.el.matches('label') ? (hit.el.control || hit.el.querySelector('input')) : null;
            if (input && input.checked) return;
            hit.el.click();
        }

        return {
            step(dialog) {
                while (pending.length) {
                    const cur = pending[0];
                    if (typeof cur === 'object') {
                        // Aufgeklappt, sobald der nächste Eintrag zu sehen ist
                        if (typeof pending[1] === 'string' && findChoice(dialog, pending[1])) { pending.shift(); continue; }
                        const opener = Array.from(dialog.querySelectorAll(cur.open)).find(isVisible);
                        if (opener && Date.now() - lastOpen > 700) {
                            lastOpen = Date.now();
                            opener.click();
                        }
                        break;
                    }
                    const hit = findChoice(dialog, cur);
                    if (!hit) break;
                    activate(hit);
                    pending.shift();
                }
                for (let i = fields.length - 1; i >= 0; i--) {
                    const [sel, value] = fields[i];
                    const field = Array.from(dialog.querySelectorAll(sel)).find(isVisible);
                    if (!field) continue;
                    // Nichts überschreiben, was schon drinsteht
                    if (!field.value.trim()) setFieldValue(field, field.maxLength > 0 ? value.slice(0, field.maxLength) : value);
                    fields.splice(i, 1);
                }
                const missing = [...pending.filter(c => typeof c === 'string'), ...fields.map(f => f[2]).filter(Boolean)];
                return { done: !pending.length && !fields.length, missing };
            },
        };
    }

    // ------------------------------------------------------------------
    // Teil 2: Übersicht – Melden-Buttons einfügen + Popup steuern
    // ------------------------------------------------------------------

    function runOverview() {
        injectOverviewStyles();

        let scheduled = false;
        const schedule = () => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => { scheduled = false; injectButtons(); });
        };
        injectButtons();
        new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });

        window.addEventListener('message', onPopupMessage);
    }

    // Die Seite baut Teile des Dokuments nach dem Laden neu auf; dann die Styles erneut einhängen
    const overviewStyle = document.createElement('style');
    const ensureOverviewStyles = () => { if (!overviewStyle.isConnected) (document.head || document.documentElement).appendChild(overviewStyle); };

    function injectOverviewStyles() {
        overviewStyle.textContent = `
            /* Steht die Karte selbst als Flex-Zeile, darf der Button nicht in die Höhe gezogen werden.
               z-index: AutoScout24 legt beim Überfahren einen Link über die ganze Karte (z-index 1). */
            .asm-wrap { position: relative; z-index: 2; display: flex; justify-content: flex-end; align-items: center; align-self: flex-end; margin: 6px 0 0; }
            .asm-btn {
                flex: none;
                display: inline-flex; align-items: center; gap: 6px;
                padding: 4px 12px; border-radius: 999px;
                border: 1px solid #d0d0cc; background: #fff; color: #555;
                font: inherit; font-size: 13px; font-weight: 600; line-height: 20px;
                cursor: pointer; white-space: nowrap; text-decoration: none;
                transition: background-color .15s, border-color .15s, color .15s;
            }
            .asm-logo { width: 20px; height: 20px; border-radius: 5px; flex: none; display: block; margin-left: -6px; }
            .asm-btn:hover, .asm-btn:focus-visible { border-color: #c62828; color: #c62828; background: #fdecea; outline: none; }
            .asm-btn[data-state="reported"] { border-color: #a5d6a7; color: #2e7d32; background: #edf7ee; }
            .asm-btn[data-state="busy"] { opacity: .6; cursor: progress; }

            .asm-toast {
                position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
                z-index: 2147483000; max-width: min(560px, calc(100vw - 32px));
                display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px;
                padding: 10px 14px; border-radius: 10px;
                background: #1e1e1e; color: #fff; font: 14px/1.4 system-ui, sans-serif;
                box-shadow: 0 8px 24px rgba(0,0,0,.25);
            }
            .asm-toast[data-kind="ok"] { background: #2e7d32; }
            .asm-toast[data-kind="warn"] { background: #8a4b00; }
            .asm-toast-text { flex: 1 1 220px; }
            .asm-toast button {
                padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,.6);
                background: transparent; color: inherit; font: inherit; font-size: 13px; cursor: pointer;
            }
            .asm-toast button:hover { background: rgba(255,255,255,.15); }

            .asm-menu {
                position: absolute; z-index: 2147482000; box-sizing: border-box;
                max-height: calc(100vh - 32px); overflow: auto;
                background: #fff; color: #1e1e1e; border: 1px solid #d0d0cc; border-radius: 12px;
                box-shadow: 0 12px 32px rgba(0,0,0,.22);
                font: 14px/1.4 system-ui, sans-serif; text-align: left;
            }
            .asm-menu[data-floating] { position: fixed; }
            .asm-menu *, .asm-menu *::before, .asm-menu *::after { box-sizing: border-box; }
            .asm-menu-head {
                position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px;
                padding: 10px 10px 10px 14px; background: #fff; border-bottom: 1px solid #eceae6;
            }
            .asm-menu-title { flex: 1; min-width: 0; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .asm-menu-body { padding: 12px 14px 14px; display: grid; gap: 12px; }
            .asm-menu button, .asm-menu input, .asm-menu select, .asm-menu textarea { font: inherit; font-size: 14px; color: inherit; }
            .asm-icon-btn {
                flex: none; width: 32px; height: 32px; display: inline-grid; place-items: center;
                border: 0; border-radius: 8px; background: transparent; cursor: pointer; font-size: 18px; line-height: 1;
            }
            .asm-icon-btn:hover, .asm-icon-btn:focus-visible { background: #f2f1ee; outline: none; }
            .asm-list { display: grid; gap: 4px; margin: 0; padding: 0; border: 0; min-width: 0; }
            .asm-option {
                display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px;
                border: 1px solid #e3e1dc; border-radius: 8px; cursor: pointer;
            }
            .asm-option:hover { border-color: #c62828; }
            .asm-option:has(input:checked) { border-color: #c62828; background: #fdecea; }
            .asm-option input { margin: 3px 0 0; accent-color: #c62828; flex: none; }
            .asm-option-name { font-weight: 600; display: block; }
            .asm-option-reason { display: block; font-size: 12px; color: #6b6b6b; }
            .asm-field { display: grid; gap: 4px; }
            .asm-field > span:not(.asm-hint) { font-size: 12px; font-weight: 600; color: #555; }
            .asm-input {
                width: 100%; padding: 8px 10px; border: 1px solid #c9c7c2; border-radius: 8px; background: #fff;
            }
            .asm-input:focus { outline: 2px solid #1e1e1e; outline-offset: -1px; }
            textarea.asm-input { resize: vertical; min-height: 96px; }
            .asm-counter { justify-self: end; font-size: 12px; color: #6b6b6b; }
            .asm-note { margin: 0; padding: 8px 10px; border-radius: 8px; background: #f2f1ee; font-size: 13px; }
            .asm-note[data-kind="error"] { background: #fdecea; color: #8e1c1c; }
            .asm-note[data-kind="ok"] { background: #edf7ee; color: #1f5e23; }
            .asm-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
            .asm-actions .asm-spacer { flex: 1; }
            .asm-action {
                padding: 7px 14px; border-radius: 999px; border: 1px solid #c9c7c2; background: #fff; color: #1e1e1e;
                font-weight: 600; cursor: pointer; white-space: nowrap;
            }
            .asm-action:hover:not(:disabled), .asm-action:focus-visible { border-color: #1e1e1e; outline: none; }
            .asm-action[data-primary] { background: #c62828; border-color: #c62828; color: #fff; }
            .asm-action[data-primary]:hover:not(:disabled) { background: #a51f1f; border-color: #a51f1f; }
            .asm-action:disabled { opacity: .45; cursor: not-allowed; }
            .asm-link {
                justify-self: start; padding: 0; border: 0; background: none; color: #555; text-decoration: underline;
                font-size: 13px; cursor: pointer; text-align: left;
            }
            .asm-link:hover { color: #c62828; }
            .asm-tpl { display: grid; gap: 8px; padding: 10px; border: 1px solid #e3e1dc; border-radius: 8px; }
            .asm-tpl-head { display: flex; gap: 4px; align-items: center; }
            .asm-tpl-head .asm-input { flex: 1; font-weight: 600; }
            .asm-tpl-head .asm-icon-btn { width: 28px; height: 28px; font-size: 15px; }
            .asm-tpl-head .asm-icon-btn:disabled { opacity: .3; cursor: default; background: transparent; }
            .asm-hint { margin: 0; font-size: 12px; color: #6b6b6b; }
            .asm-hint code { font-size: 12px; background: #f2f1ee; padding: 0 3px; border-radius: 3px; }
            .asm-section { margin: 4px 0 0; font-size: 13px; font-weight: 700; }
            .asm-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .asm-confirm { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: #444; cursor: pointer; }
            .asm-confirm input { margin: 2px 0 0; accent-color: #c62828; flex: none; }
            .asm-radio { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; cursor: pointer; }
            .asm-radio input { margin: 2px 0 0; accent-color: #c62828; flex: none; }
        `;
        ensureOverviewStyles();
    }

    function findAdCards() {
        const cards = new Set();
        // Karten mit fester Kennung (Inserats-Nummer als Attribut)
        if (SITE.cardSelector) {
            document.querySelectorAll(SITE.cardSelector).forEach(card => { if (SITE.cardAdId(card)) cards.add(card); });
        }
        // Vom Inserats-Link so weit nach oben laufen, wie der Container nur Links auf genau
        // dieses eine Inserat enthält -> das ist die Karte.
        document.querySelectorAll(SITE.adLinkSelector).forEach(link => {
            if (link.closest('.asm-menu') || (SITE.cardSelector && link.closest(SITE.cardSelector))) return;
            // Karte schon versorgt? Nur überspringen, solange ihr Button noch da ist
            const done = link.closest('[data-asm-injected]');
            if (done && done.querySelector('.asm-btn')) return;
            const adId = SITE.adIdFromUrl(link.href);
            if (!adId) return;
            let card = null;
            let el = link.parentElement;
            while (el && el !== document.body && containsOnlyAd(el, adId)) {
                card = el;
                el = el.parentElement;
            }
            // Ganze Karte ist ein einziger Link
            if (!card) card = link;
            // Nur echte Karten (mit Bild oder Preis), keine reinen Text-Links
            if (card.querySelector('img') || findPriceRow(card)) cards.add(card);
        });
        return Array.from(cards);
    }

    function containsOnlyAd(el, adId) {
        return Array.from(el.querySelectorAll(SITE.adLinkSelector))
            .every(a => SITE.adIdFromUrl(a.href) === adId);
    }

    function getCardInfo(card) {
        const links = card.matches(SITE.adLinkSelector) ? [card] : Array.from(card.querySelectorAll(SITE.adLinkSelector));
        const link = links.find(a => SITE.adIdFromUrl(a.href));
        const fixedId = SITE.cardSelector && card.matches(SITE.cardSelector) ? SITE.cardAdId(card) : null;
        const href = fixedId ? SITE.adUrl(fixedId) : link ? link.href.split('#')[0] : null;
        const adId = fixedId || (href ? SITE.adIdFromUrl(href) : null);
        const titleEl = card.querySelector('h2, h3, h4');
        const title = (titleEl ? titleEl.textContent : (link ? link.getAttribute('title') || link.textContent : ''))
            .replace(/\s+/g, ' ').trim().slice(0, 120);
        return { href, adId, title };
    }

    // Preis-Bestandteile: „38.780 €“, „€ 12.990,-“, Fußnoten, „VB“, „Brutto“/„Netto“
    const pricePartsRe = /€\s*\d[\d.]*(?:,(?:\d{1,2}|-+))?|\d[\d.]*(?:,(?:\d{1,2}|-+))?\s*€|[¹²³*()]|\b(?:vb|brutto|netto)\b/gi;
    // Text ohne den eigenen Button und ohne hochgestellte Fußnoten („12.990 €¹“)
    const textWithoutUi = (node) => {
        let text = '';
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.parentElement.closest('.asm-wrap, sup')) text += n.nodeValue;
        }
        return text;
    };

    // Fußnote direkt hinter dem Preis, die nicht als <sup> ausgezeichnet ist (mobile.de: „29.900 €¹“
    // als eigenes Element, Stand 10/2026). Nur hinter einer Zahl mit €, damit „€ 12“ ein Preis bleibt.
    const stripFootnote = (text) => text.trim().replace(/(\d[\d.,]*-*\s*€)\s*[\d¹²³]{1,2}$/, '$1');
    const priceText = (el) => stripFootnote(textWithoutUi(el)).replace(/\s+/g, ' ');

    function isPriceOnly(text) {
        const t = stripFootnote(text);
        return /€/.test(t) && /\d/.test(t) && t.replace(pricePartsRe, '').replace(/[\s.,:]+/g, '') === '';
    }

    // Reines Preis-Element: als Kinder höchstens der eigene Button, hoch- oder tiefgestellter Text
    // und Elemente, die nur eine Ziffer enthalten (Fußnote, oder ein Betrag in eigenem Element)
    const isPriceLeaf = (el) => Array.from(el.children)
        .every(c => c.matches('.asm-wrap, sup, sub') || /^\s*[\d¹²³*]{1,2}\s*$/.test(c.textContent))
        && !el.closest('.asm-wrap') && isPriceOnly(textWithoutUi(el));

    // Raten und Nebenkosten („Finanzierung ab 277 € mtl.“, „Versicherung ab …“) sind nicht der Preis.
    // Nur die kurze Zeile direkt um den Betrag prüfen, nicht einen ganzen Kartenbereich.
    const isSideCost = (el) => {
        const around = textWithoutUi(el.parentElement || el).replace(/\s+/g, ' ').trim();
        return around.length <= 40 && /finanzierung|versicherung|leasing|mtl\.|monatl/i.test(around);
    };

    function findPriceRow(card) {
        const leaves = Array.from(card.querySelectorAll('p, span, div, strong, b'))
            .filter(el => isPriceLeaf(el) && !isSideCost(el));
        if (!leaves.length) return null;
        // Der Preis des Inserats ist die größte Angabe; bei gleicher Größe die erste
        const size = (el) => parseFloat(getComputedStyle(el).fontSize) || 0;
        const first = leaves.reduce((best, el) => (size(el) > size(best) ? el : best));
        // Dann hoch bis zur Zeile, die noch ausschließlich Preise enthält (z. B. Preis + Altpreis)
        let row = first;
        while (row.parentElement && row.parentElement !== card && isPriceOnly(textWithoutUi(row.parentElement))) {
            row = row.parentElement;
        }
        return { row, price: priceText(first) };
    }

    function injectButtons() {
        const reported = loadReported();
        ensureOverviewStyles();

        findAdCards().forEach(card => {
            // Schon da? Baut die Seite die Karte neu auf, fehlt der Button: dann neu einsetzen.
            // Verwendet die Seite eine Karte für ein anderes Inserat weiter, den alten Button ersetzen.
            const existing = card.querySelector('.asm-btn');
            if (existing) {
                const fixedId = SITE.cardSelector && card.matches(SITE.cardSelector) ? SITE.cardAdId(card) : null;
                if (!fixedId || existing.dataset.adid === fixedId) return;
                existing.closest('.asm-wrap').remove();
            }
            const info = getCardInfo(card);
            if (!info.href || !info.adId) return;

            const priceRow = findPriceRow(card);
            info.price = priceRow ? priceRow.price : '';
            card.dataset.asmInjected = 'true';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'asm-btn';
            btn.dataset.adid = info.adId;
            setButtonState(btn, reported[info.adId] ? 'reported' : 'idle');

            // Karte ist oft komplett verlinkt – Klick darf nicht zum Inserat navigieren
            const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
            ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(t => btn.addEventListener(t, e => e.stopPropagation()));
            btn.addEventListener('click', (e) => {
                stop(e);
                if (btn.dataset.state === 'busy') return;
                if (loadSettings().clickAction === 'dialog') {
                    closeMenu();
                    openReportPopup(info, btn, null);
                    return;
                }
                toggleMenu(info, btn);
            });

            const wrap = document.createElement('div');
            wrap.className = 'asm-wrap';
            wrap.appendChild(btn);
            // Unter den Preis, sonst ans Ende der Karte
            if (priceRow) priceRow.row.insertAdjacentElement('afterend', wrap);
            else card.appendChild(wrap);
        });
    }

    function setButtonState(btn, state) {
        btn.dataset.state = state;
        if (state === 'reported') {
            btn.innerHTML = `${logoImg}${checkSvg}<span>Gemeldet</span>`;
            btn.title = 'Dieses Inserat wurde von dir bereits gemeldet (erneut melden: klicken)';
        } else {
            btn.innerHTML = `${logoImg}<span>Melden</span>`;
            btn.title = `Inserat bei ${SITE.label} melden, ohne die Übersicht zu verlassen`;
        }
    }

    // ------------------------------------------------------------------
    // Bausteine (im Speicher des Userscript-Managers, pro Seite)
    // ------------------------------------------------------------------

    const newId = () => Math.random().toString(36).slice(2, 10);
    const knownReason = (id) => SITE.reasons.find(r => r.id === id) || null;
    const reasonLabel = (id) => (knownReason(id) || { label: 'Grund wählst du im Dialog' }).label;

    function loadTemplates() {
        const list = load(CONFIG.templatesKey(SITE.id), null);
        if (Array.isArray(list)) {
            const valid = list.filter(t => t && typeof t.name === 'string' && typeof t.text === 'string');
            if (valid.length) {
                return valid.map(t => ({ id: t.id || newId(), name: t.name, text: t.text,
                    reasonId: knownReason(t.reasonId) ? t.reasonId : '' }));
            }
        }
        return defaultTemplates();
    }

    function defaultTemplates() {
        return CONFIG.defaultTemplates.map(t => ({ ...t, reasonId: SITE.defaultReasons[t.id] || '' }));
    }

    function fillPlaceholders(text, info) {
        const values = {
            titel: info.title || '',
            preis: info.price || '',
            id: info.adId || '',
            link: info.href || '',
        };
        const out = text.replace(/\{(titel|preis|id|link)\}/g, (_, key) => values[key]);
        return SITE.textMaxLength ? out.slice(0, SITE.textMaxLength) : out;
    }

    // ------------------------------------------------------------------
    // Melden-Menü an der Karte
    // ------------------------------------------------------------------

    function el(tag, props = {}, ...children) {
        const node = document.createElement(tag);
        for (const [k, v] of Object.entries(props)) {
            if (v == null || v === false) continue;
            if (k === 'dataset') Object.assign(node.dataset, v);
            else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
            else if (k in node && k !== 'list') node[k] = v;
            else node.setAttribute(k, v === true ? '' : v);
        }
        children.flat().forEach(c => c != null && node.append(c));
        return node;
    }

    let menu = null; // { root, info, btn, cleanup }

    function toggleMenu(info, btn) {
        if (menu && menu.btn === btn) { closeMenu(); return; }
        openMenu(info, btn);
        renderReportView();
    }

    function closeMenu() {
        if (!menu) return;
        menu.cleanup();
        menu.root.remove();
        const btn = menu.btn;
        menu = null;
        if (btn && btn.isConnected) btn.focus({ preventScroll: true });
    }

    // btn = null: frei schwebendes Menü (Einstellungen aus dem Menü des Userscript-Managers)
    function openMenu(info, btn) {
        closeMenu();
        ensureOverviewStyles();
        const root = el('div', { className: 'asm-menu', role: 'dialog', 'aria-label': 'Inserat melden', dataset: btn ? {} : { floating: '' } });
        const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); } };
        const onOutside = (e) => {
            if (!menu || root.contains(e.target) || (btn && btn.contains(e.target))) return;
            closeMenu();
        };
        const onResize = () => menu && positionMenu();
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('pointerdown', onOutside, true);
        window.addEventListener('resize', onResize);
        // Klicks im Menü dürfen nicht bis zur (verlinkten) Karte oder zur Seite durchdringen
        ['click', 'mousedown', 'pointerdown'].forEach(t => root.addEventListener(t, e => e.stopPropagation()));

        menu = {
            root, info, btn,
            cleanup: () => {
                document.removeEventListener('keydown', onKey, true);
                document.removeEventListener('pointerdown', onOutside, true);
                window.removeEventListener('resize', onResize);
            },
        };
        document.body.appendChild(root);
    }

    function positionMenu() {
        const { root, btn } = menu;
        const vw = document.documentElement.clientWidth;
        const width = Math.min(420, vw - 32);
        root.style.width = width + 'px';
        if (!btn) {
            root.style.left = Math.round((vw - width) / 2) + 'px';
            root.style.top = '16px';
            return;
        }
        const r = btn.getBoundingClientRect();
        const left = Math.min(Math.max(16, r.right - width), vw - 16 - width);
        root.style.left = (left + window.scrollX) + 'px';
        root.style.top = (r.bottom + 8 + window.scrollY) + 'px';
    }

    function revealMenu() {
        positionMenu();
        if (menu.btn) menu.root.scrollIntoView({ block: 'nearest' });
    }

    function menuHeader(title, extraButtons = []) {
        return el('div', { className: 'asm-menu-head' },
            el('span', { className: 'asm-menu-title', title }, title),
            extraButtons,
            el('button', { type: 'button', className: 'asm-icon-btn', 'aria-label': 'Schließen', title: 'Schließen', onclick: closeMenu }, '×'));
    }

    function renderReportView() {
        const { root, info, btn } = menu;
        const templates = loadTemplates();
        const lastId = load(CONFIG.lastTemplateKey(SITE.id), '');
        let selected = templates.find(t => t.id === lastId) || templates[0];

        // Direkt melden (ohne Popup), wenn für die Seite bekannt
        const direct = SITE.direct;
        const settings = loadSettings();
        let sending = false;

        const max = SITE.textMaxLength;
        const text = el('textarea', { className: 'asm-input', rows: 4, maxLength: max || null });
        const counter = el('span', { className: 'asm-counter' });
        const email = el('input', { className: 'asm-input', type: 'email', value: settings.contact, autocomplete: 'email', placeholder: 'für Rückfragen' });
        const name = el('input', { className: 'asm-input', type: 'text', value: settings.name, autocomplete: 'name' });
        const confirm = el('input', { type: 'checkbox' });
        const status = el('p', { className: 'asm-note', role: 'status', hidden: true });
        const noReason = el('p', { className: 'asm-hint', hidden: true },
            'Dieser Baustein hat keinen Grund. Zum direkten Melden über ⚙ einen Grund zuweisen, oder im Formular melden.');
        const goLabel = direct ? 'Im Formular prüfen' : `I${SITE.form.dat.slice(1)} einsetzen`;
        const goBtn = el('button', { type: 'button', className: 'asm-action', dataset: direct ? {} : { primary: '' } }, goLabel);
        const sendBtn = direct ? el('button', { type: 'button', className: 'asm-action', dataset: { primary: '' } }, 'Melden') : null;

        const showStatus = (msg, kind) => {
            status.hidden = !msg;
            status.textContent = msg || '';
            if (kind) status.dataset.kind = kind; else delete status.dataset.kind;
        };
        const emailOk = () => !email.value.trim() || EMAIL_RE.test(email.value.trim());
        const update = () => {
            counter.textContent = max ? `${text.value.length}/${max}` : `${text.value.length} Zeichen`;
            goBtn.disabled = !selected || !text.value.trim() || !emailOk();
            if (!direct) return;
            const reason = selected && knownReason(selected.reasonId);
            noReason.hidden = !selected || !!reason;
            sendBtn.disabled = sending || !reason || !text.value.trim() || !emailOk() || !confirm.checked;
        };
        const applyTemplate = (t) => {
            selected = t;
            text.value = fillPlaceholders(t.text, info);
            update();
        };

        const options = templates.map(t => {
            const radio = el('input', { type: 'radio', name: 'asm-template', value: t.id, checked: t === selected,
                onchange: () => applyTemplate(t) });
            return el('label', { className: 'asm-option' }, radio,
                el('span', {},
                    el('span', { className: 'asm-option-name' }, t.name),
                    el('span', { className: 'asm-option-reason' }, reasonLabel(t.reasonId))));
        });
        text.addEventListener('input', update);

        goBtn.addEventListener('click', () => {
            if (goBtn.disabled) return;
            const reason = knownReason(selected.reasonId);
            const job = {
                choices: reason ? reason.path : [],
                text: text.value.trim(),
                contact: email.value.trim(),
                name: name.value.trim(),
            };
            save(CONFIG.lastTemplateKey(SITE.id), selected.id);
            closeMenu();
            // Muss direkt im Klick-Handler passieren, sonst blockiert der Browser das Popup
            openReportPopup(info, btn, job);
        });

        if (direct) {
            [email, name].forEach(f => f.addEventListener('input', update));
            confirm.addEventListener('change', update);
            sendBtn.addEventListener('click', async () => {
                if (sendBtn.disabled) return;
                sending = true;
                update();
                showStatus('Meldung wird gesendet …');
                const template = selected;
                const reason = knownReason(template.reasonId);
                const contact = { email: email.value.trim(), name: name.value.trim() };
                let code = 0, detail = '';
                try {
                    ({ code, detail } = await direct.send(info, { reason, text: text.value.trim(), ...contact }));
                } catch (e) { code = 0; }
                // Das Menü kann inzwischen geschlossen sein (Escape, Klick daneben): Das Ergebnis trotzdem festhalten
                const open = !!menu && menu.root === root;
                if (code >= 200 && code < 300) {
                    save(CONFIG.lastTemplateKey(SITE.id), template.id);
                    save(CONFIG.settingsKey, { ...loadSettings(), contact: contact.email, name: contact.name });
                    markReported(info.adId);
                    if (open) closeMenu();
                    showToast(`Inserat gemeldet: ${reason.label}`, 'ok', [], 4000);
                    return;
                }
                if (!open) {
                    showToast(`Meldung für „${info.title || 'Inserat ' + info.adId}“ nicht gesendet${code ? ` (Status ${code})` : ' (Netzwerkfehler)'}. Bitte erneut versuchen.`, 'warn', [], 8000);
                    return;
                }
                sending = false;
                update();
                const server = detail ? ` Antwort von ${SITE.label}: „${detail}“` : '';
                showStatus(code === 0
                    ? `Die Meldung konnte nicht gesendet werden (Netzwerkfehler). Du kannst es erneut versuchen oder ${SITE.form.akk} nutzen.`
                    : `${SITE.label} hat die Meldung abgelehnt (Status ${code}). Bitte ${SITE.form.akk} nutzen.${server}`, 'error');
            });
        }

        const reportedAt = loadReported()[info.adId];
        const body = el('div', { className: 'asm-menu-body' },
            reportedAt ? el('p', { className: 'asm-note', dataset: { kind: 'ok' } },
                `Du hast dieses Inserat am ${new Date(reportedAt).toLocaleDateString('de-DE')} bereits gemeldet.`) : null,
            el('fieldset', { className: 'asm-list' },
                el('legend', { className: 'asm-hint', style: 'margin-bottom:4px' }, 'Baustein'),
                options),
            el('label', { className: 'asm-field' }, el('span', {}, 'Text der Meldung'), text, counter),
            direct ? el('div', { className: direct.withName ? 'asm-pair' : '' },
                el('label', { className: 'asm-field' }, el('span', {}, 'E-Mail (optional)'), email),
                direct.withName ? el('label', { className: 'asm-field' }, el('span', {}, 'Name (optional)'), name) : null) : null,
            direct ? el('label', { className: 'asm-confirm' }, confirm, el('span', {}, direct.confirmText)) : null,
            noReason,
            status,
            el('p', { className: 'asm-hint' }, direct
                ? `„Melden“ schickt die Meldung direkt an ${SITE.label}, genau wie ${SITE.form.nom}. „${goLabel}“ öffnet stattdessen ${SITE.form.akk} in einem kleinen Fenster, mit Grund und Text eingesetzt; abschicken machst du dort selbst.`
                : `Das Inserat öffnet sich in einem kleinen Fenster. Dort öffnet das Script ${SITE.form.akk} von ${SITE.label}`
                    + (SITE.reasons.length ? ', wählt den Grund' : '')
                    + ' und setzt den Text ein. Prüfen und absenden machst du selbst.'),
            el('div', { className: 'asm-actions' },
                el('span', { className: 'asm-spacer' }),
                el('button', { type: 'button', className: 'asm-action', onclick: closeMenu }, 'Abbrechen'),
                goBtn,
                sendBtn),
            el('button', { type: 'button', className: 'asm-link', onclick: () => { closeMenu(); openReportPopup(info, btn, null); } },
                `Ohne Baustein: nur ${SITE.form.akkOff} öffnen`));

        const gear = el('button', { type: 'button', className: 'asm-icon-btn', 'aria-label': 'Bausteine und Einstellungen',
            title: 'Bausteine und Einstellungen', onclick: renderSettingsView }, '⚙');
        root.replaceChildren(menuHeader(`Melden: ${info.title || 'Inserat ' + info.adId}`, [gear]), body);
        if (selected) applyTemplate(selected);
        update();
        revealMenu();
        (root.querySelector('input[name="asm-template"]:checked') || text).focus({ preventScroll: true });
    }

    function renderSettingsView() {
        const { root } = menu;
        const back = () => (menu.info ? renderReportView() : closeMenu());
        const settings = loadSettings();
        let list = loadTemplates();
        const listBox = el('div', { className: 'asm-list' });
        const status = el('p', { className: 'asm-note', role: 'status', hidden: true });

        const clickRadio = (value, label) => el('label', { className: 'asm-radio' },
            el('input', { type: 'radio', name: 'asm-click', value, checked: settings.clickAction === value,
                onchange: () => { settings.clickAction = value; } }),
            el('span', {}, label));
        const contact = el('input', { className: 'asm-input', type: 'email', value: settings.contact, autocomplete: 'email',
            placeholder: 'optional', oninput: (e) => { settings.contact = e.target.value; } });
        const userName = el('input', { className: 'asm-input', type: 'text', value: settings.name, autocomplete: 'name',
            placeholder: 'optional', oninput: (e) => { settings.name = e.target.value; } });

        const drawList = () => {
            listBox.replaceChildren(...list.map((t, i) => {
                const reason = el('select', { className: 'asm-input', onchange: (e) => { t.reasonId = e.target.value; },
                    disabled: !SITE.reasons.length, title: SITE.reasons.length ? null : `Die Gründe im Dialog von ${SITE.label} sind noch nicht eingetragen. Den Grund wählst du darum im Dialog.` },
                el('option', { value: '', selected: !t.reasonId }, 'Grund im Dialog selbst wählen'),
                SITE.reasons.map(r => el('option', { value: r.id, selected: r.id === t.reasonId }, r.label)));
                const move = (d) => { list.splice(i + d, 0, list.splice(i, 1)[0]); drawList(); };
                return el('div', { className: 'asm-tpl' },
                    el('div', { className: 'asm-tpl-head' },
                        el('input', { className: 'asm-input', type: 'text', value: t.name, 'aria-label': 'Name des Bausteins',
                            maxLength: 60, oninput: (e) => { t.name = e.target.value; } }),
                        el('button', { type: 'button', className: 'asm-icon-btn', title: 'Nach oben', 'aria-label': 'Nach oben',
                            disabled: i === 0, onclick: () => move(-1) }, '↑'),
                        el('button', { type: 'button', className: 'asm-icon-btn', title: 'Nach unten', 'aria-label': 'Nach unten',
                            disabled: i === list.length - 1, onclick: () => move(1) }, '↓'),
                        el('button', { type: 'button', className: 'asm-icon-btn', title: 'Löschen', 'aria-label': 'Baustein löschen',
                            disabled: list.length === 1, onclick: () => { list.splice(i, 1); drawList(); } }, '🗑')),
                    reason,
                    el('textarea', { className: 'asm-input', rows: 3, maxLength: SITE.textMaxLength || null, value: t.text,
                        'aria-label': 'Text des Bausteins', oninput: (e) => { t.text = e.target.value; } }));
            }));
        };

        const showError = (msg) => {
            status.hidden = false;
            status.dataset.kind = 'error';
            status.textContent = msg;
        };
        const saveAll = () => {
            const clean = list.map(t => ({ ...t, name: t.name.trim(), text: t.text.trim() }));
            if (clean.some(t => !t.name || !t.text)) return showError('Jeder Baustein braucht einen Namen und einen Text.');
            const contactValue = settings.contact.trim();
            if (contactValue && !EMAIL_RE.test(contactValue)) return showError('Bitte eine gültige E-Mail-Adresse eintragen oder das Feld leer lassen.');
            if (!save(CONFIG.templatesKey(SITE.id), clean)
                || !save(CONFIG.settingsKey, { ...settings, contact: contactValue, name: settings.name.trim() })) {
                return showError('Speichern nicht möglich (Speicher nicht verfügbar).');
            }
            back();
        };

        drawList();
        const body = el('div', { className: 'asm-menu-body' },
            el('p', { className: 'asm-section' }, 'Klick auf „Melden“'),
            clickRadio('menu', 'Menü mit Bausteinen öffnen'),
            clickRadio('dialog', `Gleich ${SITE.form.akkOff} öffnen (ohne Baustein)`),
            el('p', { className: 'asm-section' }, 'Kontakt (gilt für mobile.de und AutoScout24)'),
            el('div', { className: 'asm-pair' },
                el('label', { className: 'asm-field' }, el('span', {}, 'E-Mail für Rückmeldungen'), contact),
                el('label', { className: 'asm-field' }, el('span', {}, 'Name (nur AutoScout24)'), userName)),
            el('p', { className: 'asm-hint' }, 'Wird nur in leere Felder des Melde-Formulars eingetragen bzw. beim direkten Melden mitgeschickt. Leer lassen, wenn du anonym melden willst.'),
            el('p', { className: 'asm-section' }, `Bausteine für ${SITE.label}`),
            el('p', { className: 'asm-hint' }, 'Platzhalter im Text: ',
                el('code', {}, '{titel}'), ' ', el('code', {}, '{preis}'), ' ', el('code', {}, '{id}'), ' ', el('code', {}, '{link}'),
                '. Gespeichert wird nur lokal im Speicher deines Userscript-Managers.'),
            listBox,
            el('div', { className: 'asm-actions' },
                el('button', { type: 'button', className: 'asm-action',
                    onclick: () => { list.push({ id: newId(), name: 'Neuer Baustein', reasonId: '', text: '' }); drawList(); } },
                    '+ Neuer Baustein'),
                el('button', { type: 'button', className: 'asm-link',
                    onclick: () => { list = defaultTemplates(); drawList(); } }, 'Standard wiederherstellen')),
            status,
            el('div', { className: 'asm-actions' },
                el('span', { className: 'asm-spacer' }),
                el('button', { type: 'button', className: 'asm-action', onclick: back }, menu.info ? 'Zurück' : 'Abbrechen'),
                el('button', { type: 'button', className: 'asm-action', dataset: { primary: '' }, onclick: saveAll }, 'Speichern')));

        root.replaceChildren(menuHeader('Bausteine und Einstellungen'), body);
        revealMenu();
        root.querySelector('input').focus({ preventScroll: true });
    }

    function openSettings() {
        openMenu(null, null);
        renderSettingsView();
    }

    // ------------------------------------------------------------------
    // Popup + Statusleiste
    // ------------------------------------------------------------------

    let current = null; // { info, btn, popup, job, poll, done }

    function openReportPopup(info, btn, job) {
        finishCurrent();

        // Eigene Melde-Seite, wenn bekannt; sonst das Inserat, dort wird der Melde-Link geklickt
        const url = (SITE.reportUrl ? SITE.reportUrl(info.adId) : info.href.split('#')[0]) + CONFIG.hash;
        const w = CONFIG.popupWidth, h = CONFIG.popupHeight;
        const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
        const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
        // Muss direkt im Klick-Handler passieren, sonst blockiert der Browser das Popup
        const popup = window.open(url, CONFIG.popupName, `popup=yes,width=${w},height=${h},left=${left},top=${top}`);

        if (!popup) {
            showToast(`Popup wurde vom Browser blockiert. Bitte Popups für ${location.hostname} erlauben.`, 'warn', [
                { label: 'In neuem Tab öffnen', onClick: () => { window.open(url, '_blank'); hideToast(); } },
            ]);
            return;
        }
        try { popup.focus(); } catch (e) { /* egal */ }

        btn.dataset.state = 'busy';
        current = { info, btn, popup, job, done: false, poll: null };
        showToast(`Melde-Fenster geöffnet: ${info.title || 'Inserat ' + info.adId}`);

        // Erkennen, wenn der Nutzer das Popup selbst schließt
        current.poll = setInterval(() => {
            if (!current || !current.popup.closed) return;
            const c = current;
            finishCurrent();
            if (!c.done) askMarkReported(c.info);
        }, 500);
    }

    function finishCurrent() {
        if (!current) return;
        clearInterval(current.poll);
        if (current.btn.dataset.state === 'busy') {
            setButtonState(current.btn, loadReported()[current.info.adId] ? 'reported' : 'idle');
        }
        current = null;
    }

    function markReported(adId) {
        saveReported(adId);
        document.querySelectorAll('.asm-btn').forEach(b => { if (b.dataset.adid === adId) setButtonState(b, 'reported'); });
    }

    function askMarkReported(info) {
        showToast('Melde-Fenster geschlossen. Hast du das Inserat gemeldet?', null, [
            { label: 'Als gemeldet markieren', onClick: () => { markReported(info.adId); hideToast(); } },
            { label: 'Nein', onClick: hideToast },
        ], 10000);
    }

    let toastTimer = null;

    function showToast(text, kind, actions = [], autoHideMs = 0) {
        hideToast();
        ensureOverviewStyles();
        const toast = document.createElement('div');
        toast.className = 'asm-toast';
        toast.setAttribute('role', 'status');
        if (kind) toast.dataset.kind = kind;
        const span = document.createElement('span');
        span.className = 'asm-toast-text';
        span.textContent = text;
        toast.appendChild(span);
        actions.forEach(a => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = a.label;
            b.addEventListener('click', a.onClick);
            toast.appendChild(b);
        });
        const x = document.createElement('button');
        x.type = 'button';
        x.textContent = '×';
        x.setAttribute('aria-label', 'Hinweis schließen');
        x.addEventListener('click', hideToast);
        toast.appendChild(x);
        document.body.appendChild(toast);
        if (autoHideMs) toastTimer = setTimeout(hideToast, autoHideMs);
    }

    function hideToast() {
        clearTimeout(toastTimer);
        document.querySelectorAll('.asm-toast').forEach(t => t.remove());
    }

    function onPopupMessage(e) {
        if (e.origin !== window.location.origin) return;
        const data = e.data;
        if (!data || data.type !== CONFIG.msgType || !current) return;
        if (e.source !== current.popup) return;
        if (data.adId && data.adId !== current.info.adId) return;

        switch (data.status) {
            case 'ready':
                // Auftrag (Baustein) ans Popup geben; null = nur Dialog öffnen
                e.source.postMessage({ type: CONFIG.msgType, cmd: 'job', job: current.job }, e.origin);
                break;
            case 'dialog-open':
                showToast(current.job
                    ? 'Bitte im Melde-Fenster prüfen und absenden.'
                    : 'Bitte im Melde-Fenster den Grund auswählen und absenden.');
                break;
            case 'filled':
                if (data.missing && data.missing.length) {
                    showToast(`Nicht automatisch eingesetzt: ${data.missing.join(', ')}. Bitte im Melde-Fenster selbst ergänzen und absenden.`, 'warn');
                } else {
                    showToast('Grund und Text sind eingesetzt. Bitte im Melde-Fenster prüfen und absenden.');
                }
                break;
            case 'trigger-not-found':
                showToast('Der Melde-Link wurde nicht automatisch gefunden. Bitte im Fenster selbst auf „Melden“ bzw. „Inserat beanstanden“ klicken.', 'warn');
                break;
            case 'dialog-not-found':
                showToast('Der Melde-Dialog wurde nicht erkannt. Bitte im Fenster selbst fortfahren.', 'warn');
                break;
            case 'success':
            case 'closed':
                if ((data.status === 'success' || data.success) && !current.done) {
                    current.done = true;
                    markReported(current.info.adId);
                    showToast('Inserat gemeldet.', 'ok', [], 4000);
                }
                break;
        }
    }

    // ------------------------------------------------------------------
    // Start
    // ------------------------------------------------------------------

    const isReportPopup = window.location.hash === CONFIG.hash || (window.name === CONFIG.popupName && !!window.opener);
    if (isReportPopup && window.top === window.self) {
        runReportPopup();
    } else if (!isDetailPage && window.top === window.self) {
        runOverview();
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('Bausteine und Einstellungen', openSettings);
        }
    }
})();
