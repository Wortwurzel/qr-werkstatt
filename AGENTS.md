# AGENTS.md

## Project

QR-Werkstatt is a static QR code generator. The QR processing runs entirely in the browser:
contact (vCard), website, phone, WhatsApp, email and free text. There is no backend.
The public version is live on Cloudflare Pages at https://qr-werkstatt.pages.dev; the
custom domain https://qr.drwortwurzel.com still needs the CNAME at Namecheap (the portfolio
stays on Netlify). It counts page views with Cloudflare Web Analytics (cookie-free,
auto-injected by Pages). It is a private,
non-commercial site; there is no Impressum, only the privacy dialog in the footer.

## Structure

- `src/app.html` — the single source: title, meta, `@font-face`, CSS, markup and script.
  It is an Artifact fragment (no `<!doctype>`, `<html>`, `<head>` or `<body>`).
- `build.mjs` — wraps the fragment into `dist/index.html` (adds doctype, head, meta and
  `data-local="true"`), copies the vendored library and `vendor/fonts/` into `dist/vendor/`.
- `vendor/qr-code-styling.js` — vendored `qr-code-styling@1.9.2` with the source line at
  the top. Do not edit it.
- `vendor/fonts/` — local Archivo WOFF2, the only typeface; source and hash in
  `SOURCE.md`. The page must not request Google Fonts.
- `dist/` — generated output. Open `dist/index.html` in a browser or upload `dist/`.
- `check.mjs` — end-to-end check: Playwright opens the local page, drives the form,
  rasterizes the SVG and decodes it with jsQR. Full output goes to `check.log`.
- `DEPLOY.md` — Cloudflare Pages and Web Analytics steps.

## Check

```powershell
npm ci
npm run check
```

Expected console output: `CHECK OK`. The check must fail against a deliberately broken
page: `CHECK_TARGET=<path> node check.mjs` must exit 1. To check the deployed page:
`$env:CHECK_TARGET="https://qr-werkstatt.pages.dev"; node check.mjs`.

## Rules

- `src/app.html` is the only source. After edits run `npm run build`; never edit `dist/`.
- Do not edit `vendor/qr-code-styling.js`. To update, take the new npm tarball, copy
  `lib/qr-code-styling.js`, keep the `Source:` line current and rerun the check.
- Keep one typeface: Archivo is the only font in `@font-face` and `vendor/fonts/`. Do not
  add a second font. The check asserts that no request goes to `fonts.googleapis.com` or
  `fonts.gstatic.com` and that only Archivo is loaded.
- No form data leaves the browser. In the public Cloudflare Pages deployment, only
  Cloudflare Web Analytics counts page views (no cookies, no IP-based identification).
  Keep the privacy dialog accurate: tool, purpose, Art. 6(1)(f) DSGVO, local fonts.
- Add an Impressum only if the site becomes commercial. `DEPLOY.md` has the details.
- `localStorage` only holds theme and design preferences, never form content.
- The page must work at 390 px width without horizontal scrolling and in both themes.
- `qr-code-styling` encodes each character with `charCodeAt & 0xFF`. Non-ASCII payloads
  therefore go through `encodeQrData()`, which hands the library a Latin-1 string of the
  UTF-8 bytes. Keep that function.
- vCard output uses CRLF, vCard escaping and byte-aware 75-octet line folding. Keep those.
- Error correction is Q without a logo and H with a logo. `quietZoneMargin()` computes at
  least 4 modules of quiet zone; keep it.
