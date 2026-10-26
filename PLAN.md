# Plan: QR-Werkstatt

## Ziel

Eine statische Website, die QR-Codes für Kontakt (vCard), Website, Telefon, WhatsApp,
E-Mail und freien Text erzeugt. Name, Logo, Website, Telefon und WhatsApp sind frei
kombinierbar; leere Felder werden weggelassen. Die Seite wird öffentlich, aber privat und
nicht gewerblich betrieben, mit einer Besucherstatistik über Cloudflare Web Analytics.
Kein Impressum; eine kurze Datenschutznotiz ist eingebaut.

## Entscheidungen

- Bibliothek: `qr-code-styling@1.9.2` (vendort, 48 KB) – Logo-Mitte, Stile, PNG/SVG-Export.
- Eine Quelle: `src/app.html`; `build.mjs` erzeugt `dist/index.html` und kopiert `vendor/`.
- Hosting: Cloudflare Pages (kostenloser Direct Upload). Statistik: Cloudflare Web Analytics
  (keine Cookies, Beacon wird von Pages automatisch eingefügt).
- Kein Artifact: Dort sind Downloads blockiert und es gibt keine Aufrufzahlen.
- Keine Formulardaten an einen Server; gezählt werden nur Seitenaufrufe.
- Schriften lokal in `vendor/fonts`; keine Google-Fonts-Anfrage.
- Fehlerkorrektur Q ohne Logo, H mit Logo; Ruhezone 4 Module; vCard mit UTF-8 und
  75-Byte-Faltung.
- Rechtlich: privat/nicht gewerblich → kein Impressum; Datenschutz-Dialog mit Zweck und
  Rechtsgrundlage (Art. 6 Abs. 1 lit. f DSGVO).

## Schritte

- [x] Review-Funde beheben (Logo-Prüfung, Telefon-Normalisierung, ungültige Werte,
      `host:port`, vCard-Faltung, Ruhezone)
- [x] Check erweitern: 37 Prüfungen grün; Gegenprobe gegen kaputte Kopie rot
- [x] Datenschutz-Dialog, lokale Schriften, ehrliche Lokal-Aussage
- [x] Deploy-Anleitung `DEPLOY.md`
- [x] Unabhängiger Sicherheits-Review: ein Low-Fund (Google Fonts) behoben
- [x] Cloudflare Pages hochladen; live unter https://qr-werkstatt.pages.dev
- [x] Web Analytics einschalten; Beacon auf der Live-Seite geprüft
- [x] `PROGRESS.md` schreiben
- [x] GitHub-Repository `Wortwurzel/qr-werkstatt` veröffentlichen
- [x] CNAME `qr` bei Namecheap auf `qr-werkstatt.pages.dev` setzen
- [ ] SSL-Zertifikat für `qr.drwortwurzel.com` abwarten und die Adresse prüfen

## Prüfkommando

```powershell
npm ci
npm run check
```

Erwartet: `CHECK OK` (aktuell 37 Prüfungen). Gegen eine kaputte Kopie:
`CHECK_TARGET=<pfad> node check.mjs` muss mit Exit 1 enden.

## Abnahmekriterien

- Jeder Typ erzeugt einen dekodierbaren QR-Code mit dem erwarteten Inhalt.
- Namensfeld, Website, Telefon und WhatsApp landen gemeinsam in der vCard.
- Logo erscheint in der Mitte, ohne den Code unlesbar zu machen.
- Ruhezone mindestens 4 Module; ungültige Telefonnummern werden weggelassen.
- Entwurfsänderungen wirken sofort; PNG und SVG lassen sich lokal herunterladen.
- 390 px Breite ohne horizontales Scrollen; beide Themes lesbar.
- Keine JavaScript-Fehler in der Konsole; keine Google-Fonts-Anfrage.
- Öffentlich unter Cloudflare Pages; Web Analytics zählt Seitenaufrufe ohne Cookies.
