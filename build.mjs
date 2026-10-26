import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(root, "src", "app.html"), "utf8");
const marker = "<!-- APP -->";
const splitAt = source.indexOf(marker);

if (splitAt === -1) {
  throw new Error("Marker <!-- APP --> not found in src/app.html");
}

const head = source.slice(0, splitAt).trimEnd();
const body = source.slice(splitAt + marker.length).trimStart();

const html = `<!doctype html>
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
