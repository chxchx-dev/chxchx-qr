// Servidor estático mínimo (sin dependencias) para la imagen web de acore-qr.
// Sirve ./dist con headers básicos de seguridad y fallback SPA a index.html.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const ROOT = normalize(fileURLToPath(new URL("./dist", import.meta.url)));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

function send(res, status, filePath, contentType) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (filePath === null) {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    send(res, 400, null, "text/plain; charset=utf-8");
    return;
  }

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = normalize(join(ROOT, pathname));

  // Evitar path traversal: el archivo debe quedar dentro de ROOT.
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${sep}`)) {
    send(res, 403, null, "text/plain; charset=utf-8");
    return;
  }

  if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
    const contentType = MIME[extname(filePath)] ?? "application/octet-stream";
    send(res, 200, filePath, contentType);
    return;
  }

  // Fallback SPA para rutas sin archivo.
  const fallback = join(ROOT, "index.html");
  if (existsSync(fallback)) {
    send(res, 200, fallback, MIME[".html"]);
    return;
  }
  send(res, 404, null, "text/plain; charset=utf-8");
});

server.listen(PORT, () => {
  console.log(`[qr-web] sirviendo /dist en :${PORT}`);
});
