# Fortschritt

## Erledigt (2026-10-26)

- Statische Seite „QR-Werkstatt“ gebaut: `src/app.html`, `build.mjs`, `dist/index.html`.
- `qr-code-styling@1.9.2` vendort (`vendor/`, Quellenzeile am Dateianfang).
- Sechs Inhaltstypen, Logo-Mitte, Farben/Stile, PNG/SVG-Download, beide Themes.
- 37 automatische Prüfungen (Playwright + jsQR) grün; Gegenprobe gegen eine kaputte Kopie rot.
- Review-Funde behoben: defektes Logo, Telefon-Normalisierung (`+49 (0) …`), ungültige
  Nummern, `host:port`, vCard-UTF-8-Faltung, Ruhezone mindestens 4 Module.
- Eine Schrift: Archivo wird überall verwendet; IBM Plex Mono und die zweite Schriftdatei
  sind entfernt. Keine Google-Fonts-Anfrage. Der unabhängige Sicherheits-Review hatte genau
  diese Anfrage als einzigen (niedrigen) Punkt gefunden.
- Datenschutz-Dialog mit Zweck und Rechtsgrundlage (Art. 6 Abs. 1 lit. f DSGVO).
- Datenschutz-Dialog nach dem Aufbau der Portfolio-Seite gegliedert: Hosting, Cookies,
  Besucherstatistik, localStorage, Schrift, externe Links, Rechte, Aktualität,
  Verantwortlicher. Der Statistik-Abschnitt nennt Cloudflare Web Analytics.
- `DEPLOY.md` mit den Cloudflare-Pages- und Web-Analytics-Schritten.
- Cloudflare Pages Projekt `qr-werkstatt` angelegt und `dist` hochgeladen; live unter
  https://qr-werkstatt.pages.dev. 37 Live-Prüfungen gegen die veröffentlichte Seite grün.
- Cloudflare Web Analytics eingeschaltet; der Beacon (`cloudflareinsights`) wird auf der
  Live-Seite geladen, ohne Seitenfehler. Gezählt werden Seitenaufrufe, keine QR-Scans.
- Custom Domain `qr.drwortwurzel.com` per Cloudflare-API im Pages-Projekt eingetragen;
  wartet auf den CNAME bei Namecheap.
- `check.mjs` akzeptiert jetzt auch URLs (`CHECK_TARGET=https://...`).
- Cloudflare-Login per `wrangler`; Token im Windows-Schlüsseltresor, dafür
  `@napi-rs/keyring@1.3.0` global installiert.
- Rechtlich: öffentlich, aber privat/nicht gewerblich → kein Impressum; kurze
  Datenschutznotiz statt voller Erklärung.

## Nächster Schritt

1. Bei Namecheap den CNAME `qr` → `qr-werkstatt.pages.dev` eintragen. Keine Nameserver
   ändern.
2. `https://qr.drwortwurzel.com` prüfen und die Statistik beobachten.
3. GitHub-Repository `Wortwurzel/qr-werkstatt` veröffentlichen (README, Banner,
   Screenshots und Projektdateien).

## Entscheidungen

- Cloudflare Pages statt Artifact: kostenlos, Direct Upload, eingebaute Besucherstatistik.
  Ein Artifact bietet keine Aufrufzahlen und blockiert Downloads.
- Eine Schrift: Archivo überall; keine zweite Schrift. Das hält die Seite ruhig und
  reduziert die Ladezeit.
- Adresse `qr.drwortwurzel.com` per CNAME bei Namecheap. Das Portfolio (`drwortwurzel.com`,
  `www`) läuft bereits auf Netlify; Namecheap ist nur Registrar, DNS und E-Mail-Weiterleitung.
  Kein Hosting-Umzug nötig.
- Cloudflare Web Analytics: keine Cookies, kein Cookie-Banner, nur aggregierte Aufrufe.
- Keine Formulardaten an einen Server; gezählt werden ausschließlich Seitenaufrufe.
- Lokale Schriften statt Google Fonts: Datenschutz und keine externe Abhängigkeit.
- Fehlerkorrektur Q ohne Logo, H mit Logo; Ruhezone 4 Module; vCard UTF-8 und 75-Byte-Faltung.
- Kein Impressum, solange die Seite privat und nicht gewerblich bleibt.

## Offene Fragen

- `@napi-rs/keyring@1.3.0` ist global installiert (nur für den Cloudflare-Login). Das
  personal-os-setup-Manifest führt keine npm-Globals; daher keine Spiegelung.
- Das GitHub-Repository ist noch nicht veröffentlicht; die Vorbereitung (README,
  `docs/assets/`) ist fertig.
