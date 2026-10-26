import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(root, "src", "app.html"), "utf8");

function readEnv(name) {
  if (process.env[name]) return process.env[name].trim();
  try {
    const env = readFileSync(resolve(root, ".env"), "utf8");
    return (env.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1] || "").trim();
  } catch {
    return "";
  }
}

const analyticsToken = readEnv("CF_WEB_ANALYTICS_TOKEN");
if (analyticsToken && !/^[a-f0-9]{32}$/.test(analyticsToken)) {
  throw new Error("CF_WEB_ANALYTICS_TOKEN is not a 32-character hex token");
}
// The deployed page gets the beacon; the local check builds without it because
// beacon requests from file:// fail with CORS.
const includeAnalytics = !process.argv.includes("--no-analytics");
const marker = "<!-- APP -->";
const splitAt = source.indexOf(marker);

if (splitAt === -1) {
  throw new Error("Marker <!-- APP --> not found in src/app.html");
}

const head = source.slice(0, splitAt).trimEnd();
const body = source.slice(splitAt + marker.length).trimStart();

let html = `<!doctype html>
<html lang="de" data-local="true">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;

if (analyticsToken && includeAnalytics) {
  const beacon = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token: analyticsToken })}'></script>`;
  html = html.replace("</body>", `${beacon}\n</body>`);
}

const dist = resolve(root, "dist");
mkdirSync(resolve(dist, "vendor"), { recursive: true });
writeFileSync(resolve(dist, "index.html"), html, "utf8");
cpSync(
  resolve(root, "vendor", "qr-code-styling.js"),
  resolve(dist, "vendor", "qr-code-styling.js")
);
rmSync(resolve(dist, "vendor", "fonts"), { recursive: true, force: true });
cpSync(
  resolve(root, "vendor", "fonts"),
  resolve(dist, "vendor", "fonts"),
  { recursive: true }
);

console.log("Build OK -> dist/index.html");
