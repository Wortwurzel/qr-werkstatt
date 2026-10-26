import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const rawTarget = process.env.CHECK_TARGET || join(root, "dist", "index.html");
const isRemote = /^https?:\/\//i.test(rawTarget);
const target = isRemote ? rawTarget : resolve(rawTarget);
const logLines = [];
const failures = [];
let checks = 0;

function log(line) {
  logLines.push(line);
}

function check(condition, name, detail = "") {
  checks += 1;
  log(`${condition ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
  if (!condition) failures.push(`${name}${detail ? " :: " + detail : ""}`);
}

let browser;
try {
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    log("Browser: msedge");
  } catch (error) {
    log("msedge unavailable: " + error.message);
    browser = await chromium.launch({ headless: true });
    log("Browser: bundled chromium");
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true
  });
  const page = await context.newPage();
  const browserErrors = [];
  const externalFontRequests = [];
  const localFontRequests = [];

  page.on("pageerror", (error) => {
    browserErrors.push({ kind: "pageerror", text: error.message, url: "" });
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push({
        kind: "console",
        text: message.text(),
        url: message.location()?.url || ""
      });
    }
  });
  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("fonts.googleapis.com") ||
      url.includes("fonts.gstatic.com")
    ) {
      externalFontRequests.push(url);
    }
    if (url.includes("/vendor/fonts/")) {
      localFontRequests.push(url);
    }
  });

  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());

  await page.goto(isRemote ? target : pathToFileURL(target).href, { waitUntil: "load" });
  await page.waitForSelector("#qrCanvas svg", { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  const localFonts = await page.evaluate(() => document.fonts.check("800 16px Archivo"));
  check(localFonts, "Archivo ist geladen");
  check(
    localFontRequests.every((url) => url.includes("archivo")),
    "Nur Archivo wird geladen",
    JSON.stringify(localFontRequests)
  );
  check(
    externalFontRequests.length === 0,
    "Keine Google-Fonts-Anfrage",
    JSON.stringify(externalFontRequests)
  );
  await page.addScriptTag({
    content: readFileSync(join(root, "node_modules", "jsqr", "dist", "jsQR.js"), "utf8")
  });

  async function decodeFull() {
    return page.evaluate(async () => {
      const svg = document.querySelector("#qrCanvas svg");
      if (!svg) return null;
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      try {
        const image = new Image();
        await new Promise((resolveImage, rejectImage) => {
          image.onload = resolveImage;
          image.onerror = () => rejectImage(new Error("SVG could not be loaded"));
          image.src = url;
        });
        const size = 800;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(image, 0, 0, size, size);
        const pixels = ctx.getImageData(0, 0, size, size);
        const result = window.jsQR(pixels.data, size, size, {
          inversionAttempts: "attemptBoth"
        });
        return result ? { data: result.data, version: result.version } : null;
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  }

  async function decode() {
    const result = await decodeFull();
    return result ? result.data : null;
  }

  async function measureQuietZone(moduleCount) {
    return page.evaluate(async (modules) => {
      const svg = document.querySelector("#qrCanvas svg");
      if (!svg) return null;
      const xml = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
      try {
        const image = new Image();
        await new Promise((resolveImage, rejectImage) => {
          image.onload = resolveImage;
          image.onerror = () => rejectImage(new Error("SVG could not be loaded"));
          image.src = url;
        });
        const size = 1024;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(image, 0, 0, size, size);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        let minX = size;
        let minY = size;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            const i = (y * size + x) * 4;
            if (pixels[i] < 100 && pixels[i + 1] < 100 && pixels[i + 2] < 100) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) return null;
        const moduleSize = (maxX - minX + 1) / modules;
        return {
          left: minX / moduleSize,
          top: minY / moduleSize,
          right: (size - 1 - maxX) / moduleSize,
          bottom: (size - 1 - maxY) / moduleSize
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    }, moduleCount);
  }

  async function expectDecoded(name, expected, timeout = 6000) {
    const start = Date.now();
    let decoded = null;
    while (Date.now() - start < timeout) {
      try {
        decoded = await decode();
      } catch (error) {
        decoded = null;
        log("decode error: " + error.message);
      }
      if (typeof expected === "function" ? decoded && expected(decoded) : decoded === expected) {
        check(true, name, JSON.stringify(decoded));
        return decoded;
      }
      await page.waitForTimeout(120);
    }
    check(false, name, "dekodiert: " + JSON.stringify(decoded));
    return decoded;
  }

  async function fill(id, value) {
    await page.fill(id, value);
  }

  async function clickTab(tabId) {
    await page.click(tabId);
  }

  const initial = await expectDecoded(
    "Startbeispiel ist eine lesbare vCard",
    (value) =>
      value.startsWith("BEGIN:VCARD") &&
      value.includes("VERSION:3.0") &&
      value.includes("FN:Max Mustermann") &&
      value.includes("TEL;TYPE=CELL:+4917612345678") &&
      value.includes("URL:https://musterwerk.de") &&
      value.includes("https://wa.me/4917612345678")
  );
  log("Initial decoded:\n" + (initial || "null"));

  await fill("#v-first", "Erika");
  await fill("#v-last", "Musterfrau");
  await fill("#v-org", "Beispiel GmbH");
  await fill("#v-title", "Technik");
  await fill("#v-phone", "0176 1234567");
  await fill("#v-email", "erika@example.org");
  await fill("#v-web", "example.org");
  await fill("#v-wa", "+49 176 7654321");

  await expectDecoded(
    "vCard enthält alle gewählten Felder",
    (value) =>
      value.includes("FN:Erika Musterfrau") &&
      value.includes("ORG:Beispiel GmbH") &&
      value.includes("TITLE:Technik") &&
      value.includes("TEL;TYPE=CELL:+491761234567") &&
      value.includes("EMAIL;TYPE=INTERNET:erika@example.org") &&
      value.includes("URL:https://example.org") &&
      value.includes("URL;TYPE=WhatsApp:https://wa.me/491767654321")
  );

  await fill("#v-title", "ä".repeat(100));
  const folded = await expectDecoded(
    "Lange Umlaut-Zeile wird gefaltet",
    (value) => value.includes("TITLE:") && value.includes("\r\n ")
  );
  if (folded) {
    const tooLong = folded
      .split("\r\n")
      .filter((line) => Buffer.byteLength(line, "utf8") > 75);
    check(tooLong.length === 0, "Alle vCard-Zeilen bleiben unter 75 Byte", JSON.stringify(tooLong));
  }

  await fill("#v-phone", "abc");
  await fill("#v-wa", "abc");
  await expectDecoded(
    "Ungültige Telefonnummern werden in der vCard weggelassen",
    (value) =>
      value.includes("FN:") &&
      !value.includes("TEL;TYPE=CELL:") &&
      !value.includes("wa.me/")
  );

  await clickTab("#tab-website");
  await fill("#web-url", "example.org:8080");
  await expectDecoded("Website wird als https-URL kodiert", "https://example.org:8080");

  await clickTab("#tab-phone");
  await fill("#tel-number", "+49 (0) 176 111 222");
  await expectDecoded("Telefon wird als tel-Link kodiert", "tel:+49176111222");

  const phoneResult = await decodeFull();
  const quiet = phoneResult
    ? await measureQuietZone(17 + 4 * phoneResult.version)
    : null;
  if (quiet) {
    const minQuiet = Math.min(quiet.left, quiet.top, quiet.right, quiet.bottom);
    check(minQuiet >= 3.8, "Ruhezone mindestens 4 Module", JSON.stringify(quiet));
  } else {
    check(false, "Ruhezone messbar", "kein QR oder keine dunklen Pixel");
  }

  await fill("#tel-number", "abc");
  await page.waitForTimeout(300);
  check(await page.isVisible("#qrEmpty"), "Ungültige Telefonnummer zeigt den Leerzustand");

  await clickTab("#tab-whatsapp");
  await fill("#wa-number", "+49 176 111 222");
  await fill("#wa-message", "Hallo Werkstatt");
  await expectDecoded(
    "WhatsApp wird als wa.me-Link mit Nachricht kodiert",
    "https://wa.me/49176111222?text=Hallo%20Werkstatt"
  );

  await fill("#wa-number", "abc");
  await page.waitForTimeout(300);
  check(await page.isVisible("#qrEmpty"), "Ungültige WhatsApp-Nummer zeigt den Leerzustand");

  await clickTab("#tab-email");
  await fill("#mail-address", "hallo@example.org");
  await fill("#mail-subject", "Anfrage");
  await fill("#mail-message", "Hallo zusammen");
  await expectDecoded(
    "E-Mail wird als mailto-Link kodiert",
    "mailto:hallo@example.org?subject=Anfrage&body=Hallo%20zusammen"
  );

  await clickTab("#tab-text");
  await fill("#free-text", "Hallo QR-Werkstatt");
  await expectDecoded("Freier Text wird unverändert kodiert", "Hallo QR-Werkstatt");

  await fill("#free-text", "a".repeat(3000));
  await page.waitForTimeout(700);
  check(
    await page.isVisible("#qrError"),
    "Zu langer Text zeigt eine Fehlermeldung",
    "qrError sichtbar"
  );
  check(
    await page.isDisabled("#downloadPng"),
    "Zu langer Text deaktiviert den Download"
  );

  await page.click("#clearBtn");
  await page.waitForTimeout(300);
  check(await page.isVisible("#qrEmpty"), "Leeren zeigt den Leerzustand");
  check(await page.isDisabled("#downloadPng"), "Leerer Zustand deaktiviert den Download");

  await clickTab("#tab-website");
  await fill("#web-url", "download.example");
  await expectDecoded("Download-Test hat einen gültigen Code", "https://download.example");
  await page.waitForFunction(() => !document.getElementById("downloadPng").disabled);

  const [pngDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.click("#downloadPng")
  ]);
  check(
    /\.png$/i.test(pngDownload.suggestedFilename()),
    "PNG-Download wird angeboten",
    pngDownload.suggestedFilename()
  );

  await page.waitForFunction(() => !document.getElementById("downloadSvg").disabled);
  const [svgDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.click("#downloadSvg")
  ]);
  check(
    /\.svg$/i.test(svgDownload.suggestedFilename()),
    "SVG-Download wird angeboten",
    svgDownload.suggestedFilename()
  );

  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#0b8a5b"/><circle cx="32" cy="32" r="16" fill="#ffffff"/></svg>`;
  await page.setInputFiles("#logoInput", {
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(logoSvg, "utf8")
  });
  await page.waitForTimeout(700);
  check(await page.isVisible("#logoPreview"), "Logo-Auswahl zeigt die Vorschau");
  await expectDecoded(
    "Logo in der Mitte lässt den Code lesbar",
    "https://download.example",
    8000
  );
  await page.click("#logoRemove");
  await page.waitForTimeout(300);
  check(!(await page.isVisible("#logoPreview")), "Logo lässt sich wieder entfernen");

  const beforeBrokenLogo = await decode();
  await page.setInputFiles("#logoInput", {
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("definitely not a png", "utf8")
  });
  await page.waitForTimeout(600);
  check(!(await page.isVisible("#logoPreview")), "Kaputtes Logo wird abgelehnt");
  check((await decode()) === beforeBrokenLogo, "Kaputtes Logo lässt den QR intakt");
  check(
    (await page.textContent("#status")).includes("Logo"),
    "Kaputtes Logo meldet einen Fehler"
  );

  await page.click("#themeToggle");
  const firstTheme = await page.getAttribute("html", "data-theme");
  check(firstTheme === "dark" || firstTheme === "light", "Theme-Schalter setzt data-theme", firstTheme);
  await page.click("#themeToggle");
  const secondTheme = await page.getAttribute("html", "data-theme");
  check(
    secondTheme === "dark" || secondTheme === "light",
    "Theme-Schalter wechselt erneut",
    secondTheme
  );
  check(secondTheme !== firstTheme, "Theme-Schalter wechselt das Theme", `${firstTheme} -> ${secondTheme}`);

  await page.click("#privacyOpen");
  await page.waitForTimeout(150);
  check(await page.isVisible("#privacyDialog"), "Datenschutz-Dialog öffnet");
  const privacyText = await page.locator("#privacyDialog").textContent();
  check(
    privacyText.includes("Besucherstatistik") &&
      privacyText.includes("Cloudflare Web Analytics") &&
      privacyText.includes("Art. 6 Abs. 1 lit. f DSGVO"),
    "Datenschutz nennt Statistik und Rechtsgrundlage"
  );
  await page.click("#privacyClose");
  await page.waitForTimeout(150);
  check(!(await page.isVisible("#privacyDialog")), "Datenschutz-Dialog schließt");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  check(!horizontalOverflow, "Kein horizontales Scrollen bei 390 px");

  const relevantErrors = browserErrors.filter((error) => {
    const url = (error.url || "").toLowerCase();
    const text = (error.text || "").toLowerCase();
    return !url.includes("fonts.googleapis.com") && !url.includes("fonts.gstatic.com") &&
      !text.includes("fonts.googleapis.com") && !text.includes("fonts.gstatic.com");
  });
  check(
    relevantErrors.length === 0,
    "Keine JavaScript-Fehler in der Konsole",
    JSON.stringify(relevantErrors)
  );

  log("Console messages: " + JSON.stringify(browserErrors));
  await context.close();
} catch (error) {
  checks += 1;
  failures.push("Unerwarteter Fehler: " + error.message);
  log("ERROR " + error.stack);
} finally {
  if (browser) await browser.close();
  writeFileSync(join(root, "check.log"), logLines.join("\n") + "\n", "utf8");
}

if (failures.length) {
  console.error(`CHECK FAILED: ${failures.length} von ${checks} Prüfungen`);
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log(`CHECK OK: ${checks} Prüfungen`);
}
