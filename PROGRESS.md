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
- CNAME `qr` → `qr-werkstatt.pages.dev` bei Namecheap gesetzt (TTL Automatic); die
  öffentlichen Resolver 1.1.1.1 und 8.8.8.8 sehen ihn. Bestehende A-, www- und SPF-Einträge
  blieben unverändert.
- Custom Domain `qr.drwortwurzel.com` ist live: SSL-Zertifikat aktiv, Seite liefert
  Titel und Datenschutz-Dialog. Der 37er-Check gegen die eigene Domain: 36/37; nur
  Cloudflare Web Analytics verursacht dort einen CORS-Fehler. Die Statistik auf der
  eigenen Domain ist offen.
- GitHub-Repository öffentlich veröffentlicht: https://github.com/Wortwurzel/qr-werkstatt
  (Banner, Badges, Screenshots und README im ohmyzsh-Stil; Startseite verlinkt auf die
  Live-Seite).
- `check.mjs` akzeptiert jetzt auch URLs (`CHECK_TARGET=https://...`).
- Cloudflare-Login per `wrangler`; Token im Windows-Schlüsseltresor, dafür
  `@napi-rs/keyring@1.3.0` global installiert.
- Rechtlich: öffentlich, aber privat/nicht gewerblich → kein Impressum; kurze
  Datenschutznotiz statt voller Erklärung.

## Nächster Schritt

1. Web Analytics für `qr.drwortwurzel.com` einrichten (Site in Cloudflare Web Analytics)
   und den 37er-Check gegen die eigene Domain wiederholen.
2. Danach die Statistik beobachten.

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
