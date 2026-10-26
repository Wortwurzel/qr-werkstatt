# Veröffentlichen mit Cloudflare Pages

Stand: 2026-10-26. Veröffentlicht auf Cloudflare Pages unter
`https://qr-werkstatt.pages.dev`; die eigene Adresse `https://qr.drwortwurzel.com` ist
live (CNAME gesetzt, Zertifikat aktiv). Die Seite ist statisch: kein Server, keine
Datenbank. Gehostet wird kostenlos bei Cloudflare Pages; die Besucherzählung läuft über
Cloudflare Web Analytics (ohne Cookies) und ist eingeschaltet. Ein Impressum ist nicht
nötig, weil die Seite privat und nicht gewerblich ist.

## 1. Vorbereiten

```powershell
npm ci
npm run check
npm run build
```

`npm run check` muss `CHECK OK` sagen. Danach liegen `dist/index.html` und `dist/vendor/`
bereit. Hochgeladen wird nur der Ordner `dist` – nicht `src`, `node_modules` oder
`check.mjs`.

## 2. Cloudflare-Konto

1. https://dash.cloudflare.com/sign-up öffnen und ein kostenloses Konto anlegen.
2. E-Mail bestätigen und einloggen.

## 3. Seite hochladen

1. Im Dashboard **Workers & Pages** öffnen.
2. **Create application** → **Pages** → **Upload assets** (oder „Drag and drop your files“).
3. Projektname: `qr-werkstatt` (klein, ohne Leerzeichen). Die Adresse wird dann
   `https://qr-werkstatt.pages.dev`. Ist der Name schon vergeben, einen Zusatz wählen.
4. Den Ordner `C:\Dev\Projects\qr-code\dist` in das Upload-Feld ziehen.
5. **Deploy site** klicken.
6. Die angezeigte Adresse öffnen und testen: QR-Code erzeugen und PNG herunterladen.

## 4. Eigene Adresse qr.drwortwurzel.com

Die Domain ist im Cloudflare-Projekt eingetragen, der CNAME bei Namecheap ist gesetzt und
das SSL-Zertifikat ist aktiv. Die Domain `drwortwurzel.com` bleibt bei Namecheap; nur der
CNAME `qr` kommt dazu. Portfolio (`drwortwurzel.com`, `www`) und E-Mail-Weiterleitung
bleiben unberührt.

Cloudflare Web Analytics zählt derzeit nur `qr-werkstatt.pages.dev`. Für
`qr.drwortwurzel.com` muss eine eigene Web Analytics-Site angelegt werden; sonst bleibt
der Beacon auf der eigenen Domain mit einem CORS-Fehler stehen.

1. Bei Namecheap: **Domain List** → `drwortwurzel.com` → **Manage** → **Advanced DNS**
   → **Add New Record** → **CNAME Record**.
   - Host: `qr`
   - Target: `qr-werkstatt.pages.dev` (ohne `https://`, ohne Pfad)
   - TTL: Automatic
2. Speichern. Cloudflare prüft den CNAME automatisch; das SSL-Zertifikat wird ausgestellt.
   Das kann einige Minuten dauern.
3. `https://qr.drwortwurzel.com` öffnen. Erst wenn die Seite lädt, ist der CNAME aktiv.

Wichtig: Keine Nameserver bei Namecheap ändern. Die MX- und SPF-Einträge für die
E-Mail-Weiterleitung bleiben, wie sie sind.

## 5. Besucherstatistik einschalten

1. Im Dashboard **Workers & Pages** → Projekt `qr-werkstatt` → **Metrics** öffnen.
2. Unter **Web Analytics** auf **Enable** klicken.
3. Cloudflare hängt das Zähl-Skript beim nächsten Deploy automatisch an die Seite. Einmal
   neu deployen (Schritt 3 wiederholen oder den CLI-Befehl in Abschnitt 7 verwenden).
4. Nach einigen Besuchen: **Web Analytics** im Dashboard öffnen. Dort stehen Seitenaufrufe
   und Besucher. Werbe-Blocker können den Zähler blockieren; die Zahl ist eine Untergrenze.

Gezählt werden **Besuche der Website**, nicht Scans der mit dem Generator erstellten
QR-Codes. Ein QR-Code enthält den Inhalt direkt und meldet keinen Scan an die Seite. Wer
Scans zählen will, braucht einen vorgeschalteten Kurzlink als Inhalt des QR-Codes.

## 6. Datenschutz und Impressum

- **Kein Impressum**: Die Seite ist privat und nicht gewerblich. Sobald daraus eine Firma,
  Werbung oder ein Verkauf wird, ist ein Impressum nach § 5 DDG Pflicht.
- **Cloudflare Web Analytics** ist cookie-frei und nutzt keine IP-Adressen zur
  Wiedererkennung; eine gesonderte IP-Anonymisierung ist nicht nötig. Der Datenschutz-Dialog
  nennt den Zweck (Verbesserung der Website) und die Rechtsgrundlage (berechtigtes Interesse
  nach Art. 6 Abs. 1 lit. f DSGVO).
- **Schrift**: Archivo liegt lokal in `vendor/fonts` und wird mit hochgeladen. Es gibt
  keine Anfrage an Google Fonts; die Datenschutznotiz sagt das.
- **Sicherheits-Review**: keine offenen Punkte. Der einzige Fund (nicht offengelegte
  Google-Fonts-Anfrage) ist durch die lokale Schrift behoben.
- Der **Datenschutz-Dialog** in der Fußzeile ist wie die Portfolio-Datenschutzseite
  gegliedert (Hosting, Cookies/Werbung, Besucherstatistik, localStorage, Schrift,
  externe Links, Rechte, Aktualität, Verantwortlicher). Er nennt Cloudflare Web Analytics,
  die fehlende Cookie-Nutzung und den Hosting-Dienst.
- Es gibt keinen Cookie-Banner, weil Cloudflare Web Analytics keine Cookies setzt.

## 7. Später ändern

1. `src/app.html` bearbeiten.
2. `npm run build` und `npm run check`.
3. Entweder im Cloudflare-Dashboard das Projekt öffnen → **Create new deployment** → den
   Ordner `dist` erneut hineinziehen, oder per CLI:

   ```powershell
   npx --yes wrangler@4.152.0 pages deploy dist --project-name qr-werkstatt --branch main
   ```

   Beim ersten Mal ist ein Login nötig: `npx --yes wrangler@4.152.0 login --use-keyring`.
   Dafür muss `@napi-rs/keyring@1.3.0` global installiert sein; das Token liegt im
   Windows-Schlüsseltresor. Adresse und Statistik bleiben erhalten.

## Was nur du machen kannst

Der CNAME bei Namecheap ist gesetzt. Upload, Domain-Eintrag, SSL und die Live-Prüfung sind
erledigt; die Seite läuft unter `https://qr-werkstatt.pages.dev` und
`https://qr.drwortwurzel.com`. Offen ist nur die Web Analytics-Site für die eigene Domain;
danach ist auch der 37er-Check dort grün.

Quellen (geprüft 2026-10-26):

- Cloudflare Pages, Direkt-Upload: https://developers.cloudflare.com/pages/get-started/direct-upload
- Web Analytics für Pages: https://developers.cloudflare.com/pages/how-to/web-analytics
- Cloudflare Web Analytics, keine Cookies: https://www.cloudflare.com/web-analytics
- Impressumspflicht § 5 DDG: https://www.gesetze-im-internet.de/ddg/__5.html
- Schriften-Quellen und Prüfsummen: `vendor/fonts/SOURCE.md`
